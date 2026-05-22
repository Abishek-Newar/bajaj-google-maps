package com.bajajnav.nav

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

/**
 * Phase 2 — listens for Google Maps navigation notifications, parses the
 * maneuver + distance, and hands the result to [NavBridge] which forwards it
 * to JavaScript and (when connected) to the BLE service.
 *
 * Note: Maps encodes the turn arrow primarily as the notification icon, which
 * is expensive to classify. We parse the text fields defensively instead;
 * this is the documented fragile point of the project.
 */
class GoogleMapsNotificationListener : NotificationListenerService() {

  companion object {
    private const val TAG = "BajajNavListener"
    const val MAPS_PACKAGE = "com.google.android.apps.maps"
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    if (sbn.packageName != MAPS_PACKAGE) return

    val extras = sbn.notification.extras ?: return
    val title = extras.getCharSequence("android.title")?.toString().orEmpty()
    val text = extras.getCharSequence("android.text")?.toString().orEmpty()
    val sub = extras.getCharSequence("android.subText")?.toString().orEmpty()
    val ticker = sbn.notification.tickerText?.toString().orEmpty()
    val big = extras.getCharSequence("android.bigText")?.toString().orEmpty()

    val parsed = NavParser.parse(
      title = title,
      text = text,
      subText = sub,
      ticker = ticker,
      bigText = big,
    ) ?: return

    Log.d(TAG, "Parsed maneuver=${parsed.maneuver} dist=${parsed.distanceText}")
    NavBridge.emitInstruction(parsed)
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification) {
    if (sbn.packageName == MAPS_PACKAGE) {
      NavBridge.emitNavigationEnded()
    }
  }

  override fun onListenerConnected() {
    NavBridge.setNotificationAccessActive(true)
  }

  override fun onListenerDisconnected() {
    NavBridge.setNotificationAccessActive(false)
  }
}
