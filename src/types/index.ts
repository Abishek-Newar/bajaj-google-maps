/** Domain types shared across the app. */

/** Turn maneuvers we can parse from Google Maps notifications. */
export type Maneuver =
  | 'straight'
  | 'turn-left'
  | 'turn-right'
  | 'slight-left'
  | 'slight-right'
  | 'sharp-left'
  | 'sharp-right'
  | 'uturn'
  | 'roundabout'
  | 'merge'
  | 'fork-left'
  | 'fork-right'
  | 'destination'
  | 'unknown';

/** A single navigation instruction extracted from a Maps notification. */
export interface NavInstruction {
  maneuver: Maneuver;
  /** Human-readable instruction, e.g. "Turn left onto MG Road". */
  instruction: string;
  /** Raw distance string as shown by Maps, e.g. "300 m". */
  distanceText: string;
  /** Normalised distance in metres (best-effort). */
  distanceMeters: number | null;
  /** Street / road name when available. */
  road?: string;
  /** Estimated time of arrival text, e.g. "12:45". */
  eta?: string;
  /** Total remaining distance to destination, e.g. "4.2 km". */
  remaining?: string;
  timestamp: number;
}

/** Connection lifecycle for the BLE link to the bike. */
export type BleStatus =
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface BleDevice {
  id: string; // MAC / peripheral id
  name: string;
  rssi: number;
  isBike: boolean; // heuristic match for Bajaj cluster
  connected: boolean;
}

export interface GattCharacteristic {
  uuid: string;
  serviceUuid: string;
  properties: Array<'read' | 'write' | 'writeNoResponse' | 'notify' | 'indicate'>;
}

/** A log entry in the developer console. */
export interface PacketLog {
  id: string;
  direction: 'tx' | 'rx';
  hex: string;
  charUuid?: string;
  timestamp: number;
  note?: string;
}

export type PermissionState = 'granted' | 'denied' | 'unknown';

export interface AppPermissions {
  notificationAccess: PermissionState;
  bluetooth: PermissionState;
  location: PermissionState;
}
