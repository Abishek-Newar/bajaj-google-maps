package com.bajajnav.nav

import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * JS-facing API for the notification listener + BLE service. Registered via
 * [NavigationBridgePackage]. Mirrors src/native/NavigationBridge.ts.
 */
class NavigationBridgeModule(private val reactCtx: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactCtx) {

  init {
    NavBridge.attachContext(reactCtx)
  }

  override fun getName() = "NavigationBridge"

  // ---- Permissions --------------------------------------------------------

  @ReactMethod
  fun isNotificationAccessGranted(promise: Promise) {
    val enabled = Settings.Secure.getString(
      reactCtx.contentResolver, "enabled_notification_listeners",
    ) ?: ""
    promise.resolve(enabled.contains(reactCtx.packageName))
  }

  @ReactMethod
  fun openNotificationAccessSettings() {
    val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    reactCtx.startActivity(intent)
  }

  // ---- BLE control --------------------------------------------------------

  // Block bodies (not expression bodies) so each method's return type is Unit
  // (= void). The TurboModule interop parser rejects a @ReactMethod that returns
  // a non-void type unless it's marked synchronous — and one bad method makes the
  // entire native module fail to load.
  @ReactMethod fun startScan() { BikeBluetoothService.startScan(reactCtx) }
  @ReactMethod fun stopScan() { BikeBluetoothService.stopScan() }
  @ReactMethod fun connect(deviceId: String) { BikeBluetoothService.connect(reactCtx, deviceId) }
  @ReactMethod fun disconnect() { BikeBluetoothService.disconnect() }

  @ReactMethod
  fun setWriteCharacteristic(serviceUuid: String, charUuid: String) {
    BikeBluetoothService.setWriteCharacteristic(serviceUuid, charUuid)
  }

  @ReactMethod
  fun writeHex(charUuid: String?, hex: String, promise: Promise) {
    promise.resolve(BikeBluetoothService.writeHex(charUuid, hex))
  }

  @ReactMethod
  fun setMirroringEnabled(enabled: Boolean) {
    NavBridge.mirroringEnabled = enabled
  }

  // ---- Event emitter bookkeeping (no-ops; required by RN NativeEventEmitter)

  @ReactMethod fun addListener(eventName: String) {}
  @ReactMethod fun removeListeners(count: Int) {}
}
