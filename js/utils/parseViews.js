/**
 * Parse a human view-count string into a comparable number.
 *
 * Examples:
 *   "2.1M views"     → 2_100_000
 *   "84K watching"   → 84_000
 *   "847"            → 847
 *   "Live now"       → 0
 *
 * Returns 0 for anything we can't parse — that intentionally sinks unparseable
 * items to the bottom of "Most Popular" sort instead of throwing.
 */
export function parseViews(text) {
  if (typeof text !== 'string') return 0;

  // Match the first number (with optional decimal) followed by an optional K/M/B suffix.
  const match = text.match(/([\d.]+)\s*([KMB]?)/i);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  if (Number.isNaN(num)) return 0;

  const suffix = (match[2] || '').toUpperCase();
  const multiplier = { B: 1_000_000_000, M: 1_000_000, K: 1_000 }[suffix] ?? 1;
  return num * multiplier;
}
