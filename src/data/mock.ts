/**
 * Mock data so the entire UI is navigable and demoable before the native
 * notification listener and BLE service are wired in (Phases 2-3).
 */
import { BleDevice, GattCharacteristic, NavInstruction, PacketLog } from '../types';

export const mockRoute: NavInstruction[] = [
  {
    maneuver: 'turn-right',
    instruction: 'Turn right onto Baner Road',
    distanceText: '300 m',
    distanceMeters: 300,
    road: 'Baner Road',
    eta: '12:45',
    remaining: '4.2 km',
    timestamp: Date.now(),
  },
  {
    maneuver: 'roundabout',
    instruction: 'At the roundabout, take the 2nd exit',
    distanceText: '850 m',
    distanceMeters: 850,
    road: 'Pashan-Sus Road',
    eta: '12:46',
    remaining: '3.9 km',
    timestamp: Date.now() - 4000,
  },
  {
    maneuver: 'slight-left',
    instruction: 'Keep left toward NH48',
    distanceText: '1.2 km',
    distanceMeters: 1200,
    road: 'NH48',
    eta: '12:48',
    remaining: '3.1 km',
    timestamp: Date.now() - 8000,
  },
  {
    maneuver: 'destination',
    instruction: 'Your destination is on the right',
    distanceText: '50 m',
    distanceMeters: 50,
    road: 'Hinjawadi Phase 2',
    eta: '12:52',
    remaining: '50 m',
    timestamp: Date.now() - 12000,
  },
];

export const mockDevices: BleDevice[] = [
  { id: 'C8:3A:7F:11:02:9D', name: 'Bajaj Ride Connect', rssi: -52, isBike: true, connected: false },
  { id: 'F4:12:9B:55:7A:01', name: 'PULSAR-N160', rssi: -61, isBike: true, connected: false },
  { id: 'A0:9E:1A:33:CD:42', name: 'Mi Smart Band 7', rssi: -78, isBike: false, connected: false },
  { id: '7C:01:0A:88:19:EF', name: 'JBL Flip 6', rssi: -83, isBike: false, connected: false },
];

export const mockCharacteristics: GattCharacteristic[] = [
  { serviceUuid: '0000fff0-0000-1000-8000-00805f9b34fb', uuid: '0000fff1-0000-1000-8000-00805f9b34fb', properties: ['write', 'writeNoResponse'] },
  { serviceUuid: '0000fff0-0000-1000-8000-00805f9b34fb', uuid: '0000fff2-0000-1000-8000-00805f9b34fb', properties: ['notify'] },
  { serviceUuid: '0000180a-0000-1000-8000-00805f9b34fb', uuid: '00002a29-0000-1000-8000-00805f9b34fb', properties: ['read'] },
];

export const mockPacketLog: PacketLog[] = [
  { id: '1', direction: 'tx', hex: 'AA 02 01 2C 01 D4', charUuid: '0000fff1', timestamp: Date.now() - 2000, note: 'Turn right · 300m' },
  { id: '2', direction: 'rx', hex: 'AA 02 80 00 82', timestamp: Date.now() - 1800, note: 'ACK' },
  { id: '3', direction: 'tx', hex: 'AA 02 05 03 52 5C', charUuid: '0000fff1', timestamp: Date.now() - 800, note: 'Roundabout · 850m' },
];
