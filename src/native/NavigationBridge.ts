/**
 * Typed wrapper around the native `NavigationBridge` module (Kotlin). When the
 * native module is unavailable (iOS, Metro on a sim without the build, Jest)
 * `isNative` is false and callers should fall back to mock behaviour so the UI
 * stays demoable. Event names mirror NavBridge.kt.
 */
import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';
import { BleStatus, Maneuver, NavInstruction } from '../types';

const Native = NativeModules.NavigationBridge as NativeBridgeSpec | undefined;
export const isNative = !!Native;

interface NativeBridgeSpec {
  isNotificationAccessGranted(): Promise<boolean>;
  openNotificationAccessSettings(): void;
  startScan(): void;
  stopScan(): void;
  connect(deviceId: string): void;
  disconnect(): void;
  setWriteCharacteristic(serviceUuid: string, charUuid: string): void;
  writeHex(charUuid: string | null, hex: string): Promise<boolean>;
  setMirroringEnabled(enabled: boolean): void;
  addListener(event: string): void;
  removeListeners(count: number): void;
}

// ---- Event payloads -------------------------------------------------------

export interface DeviceFoundEvent { id: string; name: string; rssi: number; isBike: boolean }
export interface BleStatusEvent { status: BleStatus; detail?: string | null }
export interface PacketEvent {
  direction: 'tx' | 'rx';
  hex: string;
  charUuid?: string | null;
  note?: string | null;
  timestamp: number;
}
export interface NavInstructionEvent extends Omit<NavInstruction, 'maneuver'> { maneuver: Maneuver }

type EventMap = {
  onNavInstruction: NavInstructionEvent;
  onNavigationEnded: undefined;
  onDeviceFound: DeviceFoundEvent;
  onBleStatus: BleStatusEvent;
  onPacket: PacketEvent;
  onNotificationAccess: { active: boolean };
};

// Lazily build the emitter on first use. Doing this at module load can throw in
// release/Hermes builds (the constructor inspects the native module), which
// would poison the whole module's exports — so keep import side-effect-free.
let emitter: NativeEventEmitter | null | undefined;
function getEmitter(): NativeEventEmitter | null {
  if (emitter !== undefined) return emitter;
  try {
    emitter = isNative ? new NativeEventEmitter(NativeModules.NavigationBridge) : null;
  } catch {
    emitter = null;
  }
  return emitter;
}

function on<K extends keyof EventMap>(
  event: K,
  cb: (payload: EventMap[K]) => void,
): EmitterSubscription | null {
  const e = getEmitter();
  if (!e) return null;
  return e.addListener(event as string, cb as (p: unknown) => void);
}

// ---- Public API (safe no-ops when native is absent) -----------------------

export const NavigationBridge = {
  isNative,

  isNotificationAccessGranted: () => Native?.isNotificationAccessGranted() ?? Promise.resolve(false),
  openNotificationAccessSettings: () => Native?.openNotificationAccessSettings(),

  startScan: () => Native?.startScan(),
  stopScan: () => Native?.stopScan(),
  connect: (deviceId: string) => Native?.connect(deviceId),
  disconnect: () => Native?.disconnect(),
  setWriteCharacteristic: (svc: string, ch: string) => Native?.setWriteCharacteristic(svc, ch),
  writeHex: (charUuid: string | null, hex: string) => Native?.writeHex(charUuid, hex) ?? Promise.resolve(false),
  setMirroringEnabled: (enabled: boolean) => Native?.setMirroringEnabled(enabled),

  onNavInstruction: (cb: (p: NavInstructionEvent) => void) => on('onNavInstruction', cb),
  onNavigationEnded: (cb: () => void) => on('onNavigationEnded', cb),
  onDeviceFound: (cb: (p: DeviceFoundEvent) => void) => on('onDeviceFound', cb),
  onBleStatus: (cb: (p: BleStatusEvent) => void) => on('onBleStatus', cb),
  onPacket: (cb: (p: PacketEvent) => void) => on('onPacket', cb),
  onNotificationAccess: (cb: (p: { active: boolean }) => void) => on('onNotificationAccess', cb),
};
