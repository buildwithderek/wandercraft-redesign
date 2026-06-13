/**
 * Configuration for the static YouTube feed.
 *
 * The GitHub Action in .github/workflows/youtube-feed.yml runs hourly,
 * fetches each creator's YouTube RSS feed, and commits the result to
 * data/videos.json. The frontend just reads that file — no runtime
 * infrastructure, no API keys, no quotas.
 *
 * If the JSON is empty (file exists but contains []), or the fetch
 * fails (offline dev, missing file), the Content Dashboard falls back
 * to the static demo array in data/content.js.
 */

/**
 * Path to the static feed, relative to index.html.
 *
 * `data/` lives at the repo root next to index.html so it's served at
 * the same origin as the page — no CORS dance, no absolute URL.
 *
 * Override if you ever move the file (e.g. to a CDN).
 */
export const STATIC_FEED_PATH = 'data/videos.json';

/** Max number of videos the dashboard shows on first render. */
export const INITIAL_VIDEO_COUNT = 30;
