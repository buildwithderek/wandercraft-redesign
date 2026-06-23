/**
 * Minecraft skin renderer URLs.
 *
 * We use starlightskins.lunareclipse.studio for the big full-body hero render
 * (the "Walking" pose looks closest to playwandercraft's character shots).
 * mc-heads.net is the fallback — same idea, simpler renders, but it's the
 * most rock-solid free service if Starlight is down.
 *
 * Both services accept a username. Skin updates the moment the player
 * updates it in-game — no asset pipeline required.
 */

// Documented endpoint per https://news.lunareclipse.studio/article/nr_starlight_skinapi
// Example: https://starlightskins.lunareclipse.studio/skin-render/marching/Astra_plays/full
// `/render/` happens to also respond for some poses but isn't the documented
// path — sticking to `/skin-render/` makes failures rarer and more consistent.
const STARLIGHT_BASE = 'https://starlightskins.lunareclipse.studio/skin-render';
const MINOTAR_BASE   = 'https://minotar.net';
const MC_HEADS_BASE  = 'https://mc-heads.net';

/**
 * Full-body render. `pose` must be a real Starlightskins render type
 * (see VALID_POSES below). Unknown poses fall back to "default" rather
 * than 404 because the API treats unknown paths as failures.
 *
 * `width` is the rendered pixel width — larger = sharper but slower.
 */
export function fullBodySkinUrl(username, { pose = 'default', width = 600 } = {}) {
  if (!username) return '';

  const safePose = normalizePose(pose);

  return `${STARLIGHT_BASE}/${safePose}/${encodeURIComponent(username)}/full?width=${width}`;
}

/**
 * Complete list of poses Starlightskins actually serves (lowercased).
 * Source: https://github.com/rinckodev/starlightskinapi README.
 * Updating this list when LES ships new poses is the only required change.
 */
export const VALID_POSES = new Set([
  'default', 'marching', 'walking', 'crouching', 'crossed', 'crisscross',
  'cheering', 'relaxing', 'trudging', 'cowering', 'pointing', 'lunging',
  'dungeons', 'facepalm', 'sleeping', 'dead', 'archer', 'mojavatar',
  'ultimate', 'isometric', 'head', 'bitzel', 'pixel', 'ornament',
]);

/** Lower-case a pose name and fall back to "default" if it's not real. */
function normalizePose(pose) {
  const lower = String(pose || '').toLowerCase();
  return VALID_POSES.has(lower) ? lower : 'default';
}

/**
 * Front-facing full body from minotar.net. This is the PRIMARY fallback when
 * Starlight is down: unlike mc-heads (which can return an empty 200 for a
 * username), minotar reliably returns real PNG bytes for every IGN we've
 * tested. `size` is the render width in px; pixelated rendering keeps it crisp.
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
 * Ordered list of fallback renderers to try, in turn, when the primary
 * Starlight render fails: minotar first (reliable), mc-heads last (best
 * effort). setupSkinLoaders() walks this chain on successive <img> errors.
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
