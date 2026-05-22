package com.bajajnav.nav

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import java.util.UUID

/**
 * Phase 3 — foreground service that owns the BLE link to the cluster so the
 * connection survives the screen being off while riding. A persistent
 * notification keeps the OS from killing it. Exposes a small static API the
 * React module calls into.
 */
@SuppressLint("MissingPermission") // runtime perms are gated in JS before any call
class BikeBluetoothService : Service() {

  companion object {
    private const val TAG = "BajajBleService"
    private const val CHANNEL_ID = "bajaj_nav_link"
    private const val NOTIF_ID = 4711

    @Volatile private var instance: BikeBluetoothService? = null

    /** Heuristic for spotting the cluster among scan results. */
    private val BIKE_NAME_RE = Regex("""bajaj|pulsar|ride\s?connect""", RegexOption.IGNORE_CASE)

    fun startScan(ctx: Context) {
      ensureStarted(ctx)
      instance?.beginScan()
    }

    fun stopScan() = instance?.endScan()
    fun connect(ctx: Context, deviceId: String) {
      ensureStarted(ctx)
      instance?.connectTo(deviceId)
    }
    fun disconnect() = instance?.teardown()

    /** Write to the currently selected (or given) characteristic. */
    fun writeHex(charUuid: String?, hex: String): Boolean {
      val bytes = ClusterProtocol.fromHex(hex) ?: return false
      return instance?.write(charUuid, bytes, note = null) ?: false
    }

    fun setWriteCharacteristic(serviceUuid: String, charUuid: String) {
      instance?.selectCharacteristic(serviceUuid, charUuid)
    }

    /** Called by NavBridge when a new instruction is parsed. */
    fun sendInstruction(p: ParsedInstruction) {
      val svc = instance ?: return
      val bytes = ClusterProtocol.encode(p)
      svc.write(null, bytes, note = "${p.maneuver} · ${p.distanceText}")
    }

    private fun ensureStarted(ctx: Context) {
      if (instance == null) {
        val i = Intent(ctx, BikeBluetoothService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(i)
        else ctx.startService(i)
      }
    }
  }

  private var adapter: BluetoothAdapter? = null
  private var gatt: BluetoothGatt? = null
  private var writeChar: BluetoothGattCharacteristic? = null
  private var scanning = false

  override fun onCreate() {
    super.onCreate()
    instance = this
    adapter = (getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
    startForeground(NOTIF_ID, buildNotification("Link idle"))
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onDestroy() {
    teardown()
    instance = null
    super.onDestroy()
  }

  // ---- Scanning -----------------------------------------------------------

  private val scanCallback = object : ScanCallback() {
    override fun onScanResult(callbackType: Int, result: ScanResult) {
      val dev = result.device
      val name = dev.name ?: result.scanRecord?.deviceName ?: "Unknown"
      val isBike = BIKE_NAME_RE.containsMatchIn(name)
      NavBridge.emitDevice(dev.address, name, result.rssi, isBike)
    }

    override fun onScanFailed(errorCode: Int) {
      scanning = false
      NavBridge.emitBleStatus("error", "scan failed ($errorCode)")
    }
  }

  private fun beginScan() {
    val scanner = adapter?.bluetoothLeScanner ?: run {
      NavBridge.emitBleStatus("error", "bluetooth off"); return
    }
    if (scanning) return
    scanning = true
    NavBridge.emitBleStatus("scanning")
    scanner.startScan(scanCallback)
  }

  private fun endScan() {
    if (!scanning) return
    adapter?.bluetoothLeScanner?.stopScan(scanCallback)
    scanning = false
    NavBridge.emitBleStatus("idle")
  }

  // ---- Connection ---------------------------------------------------------

  private fun connectTo(deviceId: String) {
    endScan()
    val device: BluetoothDevice = try {
      adapter?.getRemoteDevice(deviceId) ?: return
    } catch (e: IllegalArgumentException) {
      NavBridge.emitBleStatus("error", "bad address"); return
    }
    NavBridge.emitBleStatus("connecting", deviceId)
    gatt = device.connectGatt(this, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
  }

  private val gattCallback = object : BluetoothGattCallback() {
    override fun onConnectionStateChange(g: BluetoothGatt, status: Int, newState: Int) {
      when (newState) {
        BluetoothProfile.STATE_CONNECTED -> {
          NavBridge.emitBleStatus("connected", g.device.address)
          updateNotification("Connected · ${g.device.name ?: g.device.address}")
          g.discoverServices()
        }
        BluetoothProfile.STATE_DISCONNECTED -> {
          NavBridge.emitBleStatus("disconnected", g.device.address)
          updateNotification("Link idle")
        }
      }
    }

    override fun onServicesDiscovered(g: BluetoothGatt, status: Int) {
      if (status != BluetoothGatt.GATT_SUCCESS) return
      for (service in g.services) {
        for (ch in service.characteristics) {
          NavBridge.emitPacket(
            direction = "rx",
            hex = "",
            charUuid = ch.uuid.toString(),
            note = "char props=${ch.properties}",
          )
          // Auto-pick the first writable characteristic as a sensible default.
          if (writeChar == null && (ch.properties and
              (BluetoothGattCharacteristic.PROPERTY_WRITE or
                BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE)) != 0) {
            writeChar = ch
          }
        }
      }
    }

    @Deprecated("Deprecated in API 33")
    override fun onCharacteristicChanged(g: BluetoothGatt, ch: BluetoothGattCharacteristic) {
      NavBridge.emitPacket("rx", ClusterProtocol.toHex(ch.value ?: ByteArray(0)), ch.uuid.toString())
    }
  }

  private fun selectCharacteristic(serviceUuid: String, charUuid: String) {
    val service = gatt?.getService(UUID.fromString(serviceUuid)) ?: return
    writeChar = service.getCharacteristic(UUID.fromString(charUuid)) ?: writeChar
  }

  private fun write(charUuid: String?, bytes: ByteArray, note: String?): Boolean {
    val g = gatt ?: return false
    val target = if (charUuid != null) {
      g.services.flatMap { it.characteristics }.firstOrNull { it.uuid.toString().startsWith(charUuid, true) }
    } else writeChar
    target ?: return false

    val hex = ClusterProtocol.toHex(bytes)
    val ok = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      val type = if ((target.properties and BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE) != 0)
        BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
      else BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
      g.writeCharacteristic(target, bytes, type) == BluetoothGatt.GATT_SUCCESS
    } else {
      @Suppress("DEPRECATION")
      run {
        target.value = bytes
        g.writeCharacteristic(target)
      }
    }
    NavBridge.emitPacket("tx", hex, target.uuid.toString(), note)
    Log.d(TAG, "write $hex -> ${target.uuid} ok=$ok")
    return ok
  }

  private fun teardown() {
    endScan()
    gatt?.disconnect()
    gatt?.close()
    gatt = null
    writeChar = null
  }

  // ---- Foreground notification -------------------------------------------

  private fun buildNotification(text: String): Notification {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val mgr = getSystemService(NotificationManager::class.java)
      if (mgr.getNotificationChannel(CHANNEL_ID) == null) {
        mgr.createNotificationChannel(
          NotificationChannel(CHANNEL_ID, "Bike Nav Link", NotificationManager.IMPORTANCE_LOW),
        )
      }
    }
    return Notification.Builder(this, CHANNEL_ID)
      .setContentTitle("BajajNav")
      .setContentText(text)
      .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
      .setOngoing(true)
      .build()
  }

  private fun updateNotification(text: String) {
    getSystemService(NotificationManager::class.java).notify(NOTIF_ID, buildNotification(text))
  }
}
