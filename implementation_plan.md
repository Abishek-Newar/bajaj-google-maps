# Google Maps TBT Navigation for Bajaj Pulsar N160 (React Native)

This project builds an Android application that intercepts turn-by-turn (TBT) navigation directions from Google Maps and transmits them via Bluetooth Low Energy (BLE) to the dashboard console of a Bajaj Pulsar N160 (or similar Bajaj bikes utilizing the Bajaj Ride Connect protocol).

Since the official Bajaj Ride Connect app suffers from routing issues, this custom app serves as a bridge, allowing the user to navigate using the superior Google Maps engine while still receiving turn-by-turn prompts on their bike's physical cluster.

---

## Feasibility & Strategy

### Phase 1: Core App & Protocol Debugger
- Build the native Android notification listener and background BLE service.
- Build a **Developer Console** in the React Native UI that displays the bike's GATT service/characteristic UUIDs and allows writing custom hex byte packets.
- Provide an **HCI Snoop Log Guide** to help you capture official Bluetooth logs.

### Phase 2: Protocol Integration
- Decompile the official app (`com.bajajconnect.rideapp`) or analyze the captured Bluetooth snoop log to extract the byte packet format (headers, turn icon IDs, distance formatting, and checksums).
- Hardcode the discovered protocol mapping into the Kotlin service to automatically send the correct bytes when Google Maps notifications are received.

---

## User Review Required

> **Android-Only Target**
> This app must run on Android. iOS does not allow third-party apps to read system notifications or background notifications of other apps (like Google Maps) due to strict sandboxing. 

---

## Architecture Overview

The application will be built using **React Native (TS/JS)** for a premium, interactive UI/UX, combined with a native **Kotlin Android Service** for bulletproof background execution and notification listening.

```
[Google Maps App] 
       │ (Posts Navigation Notification)
       ▼
[Android System]
       │ (Intercepted by)
       ▼
[GoogleMapsNotificationListenerService]
       │ (Extracts Direction & Distance)
       ▼
[BikeBluetoothService] (Foreground Service)
       │ (Sends Hex Bytes via BLE)
       ▼
[Bajaj Pulsar N160 Dashboard]
```

### Key Components

1. **GoogleMapsNotificationListenerService (Kotlin Native)**:
   - Extends Android's native `NotificationListenerService`.
   - Listens for notifications from `com.google.android.apps.maps`.
   - Parses the text and icons to extract turn directions (e.g., Turn Left, Turn Right, Roundabout) and distances (e.g., "300 m", "1.5 km").
   - Works fully in the background, even when the phone is locked.

2. **BikeBluetoothService (Kotlin Native / BLE)**:
   - Manages scanning, connection, and data transmission to the bike's BLE module.
   - Run as an Android **Foreground Service** with a persistent status bar notification to prevent the OS from killing the BLE connection while riding.

3. **React Native Dashboard & Control UI**:
   - Designed with a premium, high-tech Pulsar aesthetic (sleek dark mode, neon blue/teal accents, carbon fiber patterns, and smooth transitions).
   - **Dashboard**: Displays active navigation data (direction, distance, street name) parsed from Google Maps in real-time.
   - **BLE Connection Manager**: Handles scanning, listing, pairing, and status indication.
   - **Developer Protocol Tester**: A console to manually send custom hex packets to the bike’s BLE characteristics to test and reverse-engineer the dashboard display.
   - **Snoop Log Guide**: Interactive instructions on how to capture Bluetooth logs.

---

## Proposed Changes

We will initialize a React Native project in `/Users/abishek/projects/bajaj-google-maps`.

### Project Setup
- `package.json`: React Native core, TypeScript dependencies, and styling libraries.

### Native Android Source Code (Kotlin)
- `GoogleMapsNotificationListener.kt`: Implements `NotificationListenerService` to parse maps directions.
- `BikeBluetoothService.kt`: Implements background `ForegroundService` to handle GATT connections and writes.
- `NavigationBridgeModule.kt`: React Native bridge module exposing custom BLE scan/write APIs to Javascript.
- `NavigationBridgePackage.kt`: Registers the bridge module.
- `AndroidManifest.xml`: Declares BLE, location, foreground service, and notification listener permissions.

### React Native App (TypeScript)
- `App.tsx`: Application entry point and layout.
- `src/screens/DashboardScreen.tsx`: Navigation dashboard and notifications log.
- `src/screens/BluetoothScreen.tsx`: Scan and connection manager.
- `src/screens/DeveloperConsoleScreen.tsx`: Hex command console and automation runner.
- `src/screens/SnoopGuideScreen.tsx`: HCI Bluetooth log guide.

---

## Verification Plan

### Automated/Simulation Tests
1. **Notification Interception Test**:
   - Inside the app, trigger a mock Google Maps notification and verify that the app intercepts and parses it correctly.
2. **BLE Mock Simulator**:
   - Python script simulating a BLE peripheral representing the bike console to verify pairing and writes.

### Manual Verification
1. **System Permissions**:
   - Grant Notification Access, Bluetooth, and Location permissions and verify they are active.
2. **Google Maps Test**:
   - Start route on Google Maps and verify details show on phone app.
3. **BLE Protocol Discovery**:
   - Connect to Pulsar console and scan characteristics list.
