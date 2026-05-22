package com.bajajnav.nav

/** Result of parsing a Google Maps navigation notification. */
data class ParsedInstruction(
  val maneuver: String,
  val instruction: String,
  val distanceText: String,
  val distanceMeters: Int?,
  val road: String?,
  val eta: String?,
  val remaining: String?,
)

/**
 * Best-effort, locale-tolerant parsing of Maps notification text into a
 * normalised maneuver + distance. Keyword tables are intentionally broad;
 * extend them as new phrasings are observed in snoop/notification dumps.
 */
object NavParser {

  // Distance like "300 m", "1.2 km", "450 ft", "0.5 mi"
  private val DISTANCE_RE =
    Regex("""(\d+(?:[.,]\d+)?)\s?(km|m|mi|ft)\b""", RegexOption.IGNORE_CASE)

  // ETA clock like "12:45" possibly with am/pm
  private val ETA_RE = Regex("""\b(\d{1,2}:\d{2}\s?(?:[ap]m)?)\b""", RegexOption.IGNORE_CASE)

  private val maneuverKeywords: List<Pair<Regex, String>> = listOf(
    Regex("""u[- ]?turn""", RegexOption.IGNORE_CASE) to "uturn",
    Regex("""roundabout|rotary|circle""", RegexOption.IGNORE_CASE) to "roundabout",
    Regex("""sharp left""", RegexOption.IGNORE_CASE) to "sharp-left",
    Regex("""sharp right""", RegexOption.IGNORE_CASE) to "sharp-right",
    Regex("""slight left|keep left|bear left""", RegexOption.IGNORE_CASE) to "slight-left",
    Regex("""slight right|keep right|bear right""", RegexOption.IGNORE_CASE) to "slight-right",
    Regex("""fork.*left""", RegexOption.IGNORE_CASE) to "fork-left",
    Regex("""fork.*right""", RegexOption.IGNORE_CASE) to "fork-right",
    Regex("""merge""", RegexOption.IGNORE_CASE) to "merge",
    Regex("""turn left|left onto|left toward""", RegexOption.IGNORE_CASE) to "turn-left",
    Regex("""turn right|right onto|right toward""", RegexOption.IGNORE_CASE) to "turn-right",
    Regex("""destination|arrive|you have arrived""", RegexOption.IGNORE_CASE) to "destination",
    Regex("""head|continue|straight|go straight""", RegexOption.IGNORE_CASE) to "straight",
  )

  fun parse(
    title: String,
    text: String,
    subText: String,
    ticker: String,
    bigText: String,
  ): ParsedInstruction? {
    val haystack = listOf(title, text, subText, ticker, bigText)
      .filter { it.isNotBlank() }
      .joinToString(" · ")
    if (haystack.isBlank()) return null

    val maneuver = maneuverKeywords.firstOrNull { it.first.containsMatchIn(haystack) }?.second
      ?: return null // not a navigation notification we recognise

    // Nearest-turn distance is usually the first distance shown (in title/ticker).
    val turnSource = listOf(title, ticker, bigText, text).firstOrNull { DISTANCE_RE.containsMatchIn(it) }
      ?: haystack
    val distMatch = DISTANCE_RE.find(turnSource)
    val distanceText = distMatch?.value?.trim() ?: ""
    val distanceMeters = distMatch?.let { toMeters(it.groupValues[1], it.groupValues[2]) }

    // Remaining distance to destination + ETA tend to live in text/subText.
    val remaining = DISTANCE_RE.find(text)?.value?.trim()
      ?: DISTANCE_RE.find(subText)?.value?.trim()
    val eta = ETA_RE.find(text)?.value?.trim() ?: ETA_RE.find(subText)?.value?.trim()

    val road = extractRoad(title) ?: extractRoad(ticker)
    val instruction = title.ifBlank { ticker }.ifBlank { haystack }

    return ParsedInstruction(
      maneuver = maneuver,
      instruction = instruction,
      distanceText = distanceText,
      distanceMeters = distanceMeters,
      road = road,
      eta = eta,
      remaining = remaining,
    )
  }

  private fun toMeters(value: String, unit: String): Int? {
    val n = value.replace(',', '.').toDoubleOrNull() ?: return null
    return when (unit.lowercase()) {
      "km" -> (n * 1000).toInt()
      "m" -> n.toInt()
      "mi" -> (n * 1609.34).toInt()
      "ft" -> (n * 0.3048).toInt()
      else -> null
    }
  }

  /** Pull the road name after "onto"/"toward" if present. */
  private fun extractRoad(s: String): String? {
    val m = Regex("""(?:onto|toward|on)\s+(.+)$""", RegexOption.IGNORE_CASE).find(s) ?: return null
    return m.groupValues[1].trim().takeIf { it.isNotBlank() }
  }
}
