# BajajNav — Google Maps TBT bridge for the Bajaj Pulsar N160

Reads Google Maps turn-by-turn navigation from the Android notification stream
and relays it over BLE to the bike's instrument cluster, so you can navigate
with Google Maps while turn arrows still show on the dashboard.

> **Android only.** iOS forbids reading other apps' notifications.

## Status by phase

| Phase | What | State |
|-------|------|-------|
| 0 | RN + TS scaffold, "Pulsar" dark design system | ✅ done |
| 1 | Full UI (Dashboard, Bluetooth, Dev Console, Snoop Guide) on mock data | ✅ done |
| 2 | Kotlin `NotificationListenerService` → JS bridge | ✅ written, needs device |
| 3 | Kotlin BLE foreground service (scan/connect/write) | ✅ written, needs device |
| 4 | Real cluster protocol — gated on snoop-log diff | ⏳ placeholder bytes |

The JS layer auto-detects the native module: with it present (real device build)
the screens use live data; without it (Metro on a sim, Jest) they fall back to
mock data so the UI is always demoable.

## Build & run (Android)

The Android Gradle build needs **JDK 17** (not the system default 25):

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME=$HOME/Library/Android/sdk

npm install
npx react-native run-android      # device or emulator
```

On first launch, grant in this order:
1. **Notification access** — Settings → Notification access → enable BajajNav
   (the app deep-links here via the bridge).
2. **Nearby devices / Bluetooth** and (Android ≤11) **Location** for BLE scan.
3. **Notifications** permission so the foreground-service notice can show.

## Phase 4 — the go/no-go gate

`src/.../ClusterProtocol.kt` currently encodes a **guessed** frame
(`AA 02 <id> <distHi> <distLo> <xor>`). Before trusting it:

1. Follow the in-app **Snoop Guide** to capture the official app's BLE traffic.
2. Diff the ATT-write payloads for two *identical* turn prompts.
   - **Identical bytes** → static protocol → copy the real frame into
     `ClusterProtocol.kt`. Project is feasible.
   - **Different each time** → session nonce / encryption → simple replay won't
     work; scope changes significantly.

## Cluster simulator (no bike needed)

`tools/ble_cluster_sim.py` advertises a mock `PULSAR-N160` GATT peripheral that
decodes the placeholder protocol and ACKs writes:

```bash
pip install bless
python3 tools/ble_cluster_sim.py
```

Scan for it from the app's Bluetooth screen, connect, and send packets from the
Dev Console to validate the transport end-to-end.

## Layout

```
App.tsx                       app entry
src/theme/        design tokens (colors, spacing, type)
src/components/   Card, buttons, ManeuverIcon, TabIcon …
src/screens/      Dashboard, Bluetooth, DeveloperConsole, SnoopGuide
src/navigation/   bottom-tab navigator
src/native/       typed JS wrapper around the Kotlin bridge
src/data/mock.ts  mock data for sim/dev
android/app/src/main/java/com/bajajnav/nav/
    GoogleMapsNotificationListener.kt   Phase 2
    NavParser.kt                        notification → maneuver/distance
    BikeBluetoothService.kt             Phase 3 foreground BLE service
    ClusterProtocol.kt                  Phase 4 frame encode/decode (placeholder)
    NavBridge.kt                        event hub → JS
    NavigationBridgeModule.kt / Package native module registration
tools/ble_cluster_sim.py                mock cluster peripheral
```
