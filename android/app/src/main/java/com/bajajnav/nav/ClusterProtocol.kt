package com.bajajnav.nav

/**
 * Phase 4 — maps a parsed instruction to the byte packet the Bajaj cluster
 * expects on its write characteristic.
 *
 * ⚠ PLACEHOLDER MAPPING. These bytes are a plausible-looking guess and WILL be
 * replaced once the snoop-log diff (see SnoopGuideScreen) confirms the real
 * frame format: header, maneuver id, distance encoding and checksum. Do not
 * assume the cluster will react correctly to these until that gate passes.
 */
object ClusterProtocol {

  private const val HEADER = 0xAA
  private const val CMD_NAV = 0x02

  // Maneuver -> single-byte icon id (guessed; confirm against capture).
  private val maneuverId: Map<String, Int> = mapOf(
    "straight" to 0x00,
    "turn-left" to 0x01,
    "turn-right" to 0x02,
    "slight-left" to 0x03,
    "slight-right" to 0x04,
    "sharp-left" to 0x05,
    "sharp-right" to 0x06,
    "uturn" to 0x07,
    "roundabout" to 0x08,
    "merge" to 0x09,
    "fork-left" to 0x0A,
    "fork-right" to 0x0B,
    "destination" to 0x0F,
  )

  /**
   * Frame: [HEADER][CMD_NAV][maneuverId][distHi][distLo][checksum]
   * distance encoded as big-endian metres clamped to 0xFFFF.
   * checksum = XOR of all preceding bytes.
   */
  fun encode(p: ParsedInstruction): ByteArray {
    val id = maneuverId[p.maneuver] ?: 0x00
    val dist = (p.distanceMeters ?: 0).coerceIn(0, 0xFFFF)
    val bytes = mutableListOf(HEADER, CMD_NAV, id, (dist shr 8) and 0xFF, dist and 0xFF)
    val checksum = bytes.fold(0) { acc, b -> acc xor b } and 0xFF
    bytes.add(checksum)
    return bytes.map { it.toByte() }.toByteArray()
  }

  fun toHex(bytes: ByteArray): String =
    bytes.joinToString(" ") { "%02X".format(it.toInt() and 0xFF) }

  /** Parse a user-entered hex string ("AA 02 01") into bytes; null if invalid. */
  fun fromHex(hex: String): ByteArray? {
    val clean = hex.replace(Regex("""[^0-9a-fA-F]"""), "")
    if (clean.isEmpty() || clean.length % 2 != 0) return null
    return clean.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
  }
}
