package com.bajajnav.nav

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.lang.ref.WeakReference

/**
 * Process-wide event hub. The NotificationListenerService and the BLE service
 * run independently of the React lifecycle, so they publish here and this
 * object forwards to JS whenever a React context is available.
 */
object NavBridge {

  // Event names — keep in sync with src/native/NavigationBridge.ts
  const val EVENT_NAV = "onNavInstruction"
  const val EVENT_NAV_ENDED = "onNavigationEnded"
  const val EVENT_DEVICE = "onDeviceFound"
  const val EVENT_BLE_STATUS = "onBleStatus"
  const val EVENT_PACKET = "onPacket"
  const val EVENT_NOTIF_ACCESS = "onNotificationAccess"

  private var ctxRef: WeakReference<ReactApplicationContext>? = null

  /** Most recent parsed instruction; the BLE service consumes this. */
  @Volatile var lastInstruction: ParsedInstruction? = null
    private set

  /** Set true when forwarding parsed turns to the cluster is enabled. */
  @Volatile var mirroringEnabled: Boolean = true

  fun attachContext(ctx: ReactApplicationContext) {
    ctxRef = WeakReference(ctx)
  }

  private fun emit(event: String, payload: WritableMap?) {
    val ctx = ctxRef?.get() ?: return
    if (!ctx.hasActiveReactInstance()) return
    ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(event, payload)
  }

  fun emitInstruction(p: ParsedInstruction) {
    lastInstruction = p
    val map = Arguments.createMap().apply {
      putString("maneuver", p.maneuver)
      putString("instruction", p.instruction)
      putString("distanceText", p.distanceText)
      if (p.distanceMeters != null) putInt("distanceMeters", p.distanceMeters) else putNull("distanceMeters")
      putString("road", p.road)
      putString("eta", p.eta)
      putString("remaining", p.remaining)
      putDouble("timestamp", System.currentTimeMillis().toDouble())
    }
    emit(EVENT_NAV, map)

    if (mirroringEnabled) {
      BikeBluetoothService.sendInstruction(p)
    }
  }

  fun emitNavigationEnded() = emit(EVENT_NAV_ENDED, null)

  fun emitDevice(id: String, name: String, rssi: Int, isBike: Boolean) {
    emit(EVENT_DEVICE, Arguments.createMap().apply {
      putString("id", id)
      putString("name", name)
      putInt("rssi", rssi)
      putBoolean("isBike", isBike)
    })
  }

  fun emitBleStatus(status: String, detail: String? = null) {
    emit(EVENT_BLE_STATUS, Arguments.createMap().apply {
      putString("status", status)
      putString("detail", detail)
    })
  }

  fun emitPacket(direction: String, hex: String, charUuid: String?, note: String? = null) {
    emit(EVENT_PACKET, Arguments.createMap().apply {
      putString("direction", direction)
      putString("hex", hex)
      putString("charUuid", charUuid)
      putString("note", note)
      putDouble("timestamp", System.currentTimeMillis().toDouble())
    })
  }

  fun setNotificationAccessActive(active: Boolean) {
    emit(EVENT_NOTIF_ACCESS, Arguments.createMap().apply { putBoolean("active", active) })
  }
}
