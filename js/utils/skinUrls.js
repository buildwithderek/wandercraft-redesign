/**
 * Minecraft skin renderer URLs.
 *
 * The hero cards use a true 3D full-body render (nmsr.nickac.dev — NickAc's
 * Minecraft Skin Renderer). It's fast, renders the second/overlay layer with
 * real depth, accepts a plain username, and has been far more reliable than
 * starlightskins.lunareclipse.studio (which had repeated multi-hour 502s).
 *
 * If the 3D render doesn't come back in time, the loader falls back to a flat
 * 2D body from minotar.net, then mc-heads.net. See skinFallbackChain() and
 * setupSkinLoaders() in components/creatorCard.js.
 *
 * Everything keys off the username, so a skin updates the moment the player
 * changes it in-game — no asset pipeline required.
 */

const NMSR_BASE      = 'https://nmsr.nickac.dev';
const MINOTAR_BASE   = 'https://minotar.net';
const MC_HEADS_BASE  = 'https://mc-heads.net';

/**
 * 3D full-body render (the primary, "hero" look).
 *
 * `mode` is an NMSR render type:
 *   - 'fullbody'    front-facing 3D body (default card render)
 *   - 'fullbodyiso' isometric 3/4 angle (used for the hover swap)
 * See https://nmsr.nickac.dev for the full list. An unknown mode would 404,
 * so callers should stick to the two above.
 */
export function fullBodySkinUrl(username, { mode = 'fullbody' } = {}) {
  if (!username) return '';
  return `${NMSR_BASE}/${mode}/${encodeURIComponent(username)}`;
}

/**
 * Front-facing flat 2D body from minotar.net. This is the FIRST fallback when
 * the 3D render is slow or down: unlike mc-heads (which can return an empty
 * 200 for a username), minotar reliably returns real PNG bytes for every IGN
 * we've tested. `size` is the render width in px; pixelated rendering keeps it
 * crisp.
 */
export function minotarBodyUrl(username, size = 300) {
  if (!username) return '';
  return `${MINOTAR_BASE}/body/${encodeURIComponent(username)}/${size}.png`;
}

/**
 * Simple front-facing full body from mc-heads. Kept as the LAST-resort
 * fallback. Note: mc-heads sometimes serves an empty 200 (0-byte PNG) for a
 * username, which the browser treats as an undecodable image — that's why it
 * sits behind minotar in the chain rather than in front of it.
 */
export function fullBodyFallbackUrl(username) {
  if (!username) return '';
  return `${MC_HEADS_BASE}/body/${encodeURIComponent(username)}/right`;
}

/**
 * Ordered list of flat 2D fallback renderers, tried in turn when the 3D
 * render fails or stalls: minotar first (reliable), mc-heads last (best
 * effort). setupSkinLoaders() walks this chain on each <img> error/timeout.
 */
export function skinFallbackChain(username) {
  if (!username) return [];
  return [minotarBodyUrl(username), fullBodyFallbackUrl(username)];
}

/** Head-only avatar — handy for compact UIs (footer credits, pin popups). */
export function headSkinUrl(username, size = 64) {
  if (!username) return '';
  return `${MC_HEADS_BASE}/avatar/${encodeURIComponent(username)}/${size}`;
}
