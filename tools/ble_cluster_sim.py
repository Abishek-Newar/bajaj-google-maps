#!/usr/bin/env python3
"""
Mock Bajaj cluster BLE peripheral for Phase 1/3 verification.

Advertises a GATT service that mimics the bike's write characteristic so the
app can scan, connect, and write packets without the real bike. Decodes the
placeholder ClusterProtocol frame and prints the maneuver/distance it would
display, plus sends an ACK back on the notify characteristic.

Requires a BLE-capable host and the `bless` package:
    pip install bless

Run:
    python3 tools/ble_cluster_sim.py
"""
import asyncio
import logging

try:
    from bless import (  # type: ignore
        BlessServer,
        BlessGATTCharacteristic,
        GATTCharacteristicProperties,
        GATTAttributePermissions,
    )
except ImportError:
    raise SystemExit("Install dependencies first:  pip install bless")

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("cluster-sim")

# Must match mock.ts / ClusterProtocol.kt
SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb"
WRITE_UUID = "0000fff1-0000-1000-8000-00805f9b34fb"
NOTIFY_UUID = "0000fff2-0000-1000-8000-00805f9b34fb"

MANEUVERS = {
    0x00: "straight", 0x01: "turn-left", 0x02: "turn-right",
    0x03: "slight-left", 0x04: "slight-right", 0x05: "sharp-left",
    0x06: "sharp-right", 0x07: "u-turn", 0x08: "roundabout",
    0x09: "merge", 0x0A: "fork-left", 0x0B: "fork-right", 0x0F: "destination",
}


def decode(frame: bytes) -> str:
    """Decode [AA][02][id][distHi][distLo][xor] -> human string."""
    if len(frame) != 6 or frame[0] != 0xAA or frame[1] != 0x02:
        return f"<unrecognised frame: {frame.hex(' ')}>"
    checksum = 0
    for b in frame[:-1]:
        checksum ^= b
    valid = (checksum & 0xFF) == frame[5]
    maneuver = MANEUVERS.get(frame[2], f"0x{frame[2]:02X}")
    dist = (frame[3] << 8) | frame[4]
    flag = "OK" if valid else "BAD CHECKSUM"
    return f"{maneuver}  in {dist} m   [{flag}]"


def make_write_handler(server: BlessServer):
    def on_write(characteristic: BlessGATTCharacteristic, value: bytearray, **_):
        frame = bytes(value)
        log.info("RX  %s   ->  %s", frame.hex(" ").upper(), decode(frame))
        # ACK on the notify characteristic.
        ack = bytes([0xAA, 0x02, 0x80, 0x00, 0x82])
        notify = server.get_characteristic(NOTIFY_UUID)
        if notify is not None:
            notify.value = bytearray(ack)
            server.update_value(SERVICE_UUID, NOTIFY_UUID)
            log.info("TX  %s   (ACK)", ack.hex(" ").upper())
    return on_write


async def main():
    server = BlessServer(name="PULSAR-N160")
    server.write_request_func = make_write_handler(server)

    await server.add_new_service(SERVICE_UUID)
    await server.add_new_characteristic(
        SERVICE_UUID, WRITE_UUID,
        GATTCharacteristicProperties.write | GATTCharacteristicProperties.write_without_response,
        None, GATTAttributePermissions.writeable,
    )
    await server.add_new_characteristic(
        SERVICE_UUID, NOTIFY_UUID,
        GATTCharacteristicProperties.notify,
        bytearray(b"\x00"), GATTAttributePermissions.readable,
    )

    await server.start()
    log.info("Cluster sim advertising as 'PULSAR-N160' — write to %s", WRITE_UUID)
    log.info("Ctrl-C to stop.\n")
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        await server.stop()


if __name__ == "__main__":
    asyncio.run(main())
