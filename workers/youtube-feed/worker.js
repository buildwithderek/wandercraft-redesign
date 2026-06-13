/**
 * WanderCraft — YouTube RSS Aggregator (Cloudflare Worker)
 * =========================================================
 *
 * Fetches the public, no-auth, no-quota RSS feed for each requested
 * channel and returns a merged, sorted JSON array of recent videos.
 *
 * Why RSS? YouTube publishes each channel's most recent uploads at
 *
 *     https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxx
 *
 * with NO API key, NO quota, and ~15 entries per channel. This Worker
 * is purely a CORS-friendly proxy + XML→JSON converter. If you ever
 * outgrow what RSS gives you (older videos, exact view counts, etc.),
 * swap this Worker out for the YouTube Data API version without
 * changing any frontend code — the response shape stays the same.
 *
 * --------------------------------------------------------------------
 * DEPLOYING THIS WORKER (one-time setup, ~5 minutes)
 * --------------------------------------------------------------------
 *
 * 1. Install the Cloudflare CLI:
 *      npm install -g wrangler
 *
 * 2. Log in to your Cloudflare account:
 *      wrangler login
 *
 * 3. From this directory (workers/youtube-feed/), deploy:
 *      wrangler deploy
 *
 *    Wrangler reads wrangler.toml in this same folder. After deploy
 *    it prints a URL like:
 *      https://wandercraft-youtube-feed.<your-subdomain>.workers.dev
 *
 * 4. Paste that URL into js/data/youtubeConfig.js (WORKER_BASE_URL).
 *
 * 5. Open the page, scroll to the Content Dashboard. Done — the cards
 *    are now real YouTube videos pulled live.
 *
 * --------------------------------------------------------------------
 * REQUEST FORMAT
 * --------------------------------------------------------------------
 *
 *   GET /videos?channels=UC1,UC2,UC3&limit=30
 *
 *   channels  Comma-separated list of YouTube channel IDs (UCxxxxx).
 *             Max ~50 (queries beyond that may hit the URL length limit).
 *   limit     Optional. Max items to return. Defaults to 30.
 *
 * --------------------------------------------------------------------
 * RESPONSE FORMAT
 * --------------------------------------------------------------------
 *
 *   [
 *     {
 *       "id":          "abc123XYZ",
 *       "title":       "Surviving 100 Days in Arctic Iceland",
 *       "channelTitle":"AtlasVoyager",
 *       "channelId":   "UCxxxxxxxxxxx",
 *       "thumbnail":   "https://i3.ytimg.com/vi/abc123XYZ/hqdefault.jpg",
 *       "publishedAt": "2026-05-30T15:22:11Z",
 *       "link":        "https://www.youtube.com/watch?v=abc123XYZ",
 *       "viewCount":   2143829   // best-effort; missing on some feeds
 *     },
 *     ...
 *   ]
 *
 * Sorted by publishedAt descending. If individual channel fetches fail
 * they're silently skipped — partial results beat a 500.
 *
 * --------------------------------------------------------------------
 * CACHING
 * --------------------------------------------------------------------
 *
 * Cloudflare's edge cache holds responses for `CACHE_TTL_SECONDS`
 * (default 10 min). Channels are fetched with `cf: { cacheTtl: ... }`
 * so the same RSS feed isn't re-fetched on every Worker request.
 * YouTube's RSS endpoint serves stale cached XML quickly — totally
 * fine for "most-recent uploads."
 */

const CACHE_TTL_SECONDS = 600;        // 10 minutes
const DEFAULT_LIMIT = 30;
const YT_RSS_BASE = 'https://www.youtube.com/feeds/videos.xml?channel_id=';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request) {
    // Pre-flight check for browsers.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const url = new URL(request.url);

    // Health check at root.
    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ ok: true, service: 'wandercraft-youtube-feed' });
    }

    if (url.pathname !== '/videos') {
      return json({ error: 'Not found' }, 404);
    }

    const channelsParam = url.searchParams.get('channels') || '';
    const channels = channelsParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (channels.length === 0) {
      return json({ error: 'No channels supplied. Pass ?channels=UC1,UC2,...' }, 400);
    }

    const limit = Math.min(
      parseInt(url.searchParams.get('limit'), 10) || DEFAULT_LIMIT,
      200,
    );

    // Fetch every channel feed in parallel. Failures are tolerated:
    // missing channels just contribute zero videos.
    const settled = await Promise.allSettled(channels.map(fetchChannelFeed));
    const videos = [];
    for (const result of settled) {
      if (result.status === 'fulfilled') videos.push(...result.value);
    }

    // Merge, sort newest-first, trim to limit.
    videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const sliced = videos.slice(0, limit);

    return json(sliced);
  },
};

/* ============================================================
   Per-channel fetch + parse
   ============================================================ */

async function fetchChannelFeed(channelId) {
  const res = await fetch(YT_RSS_BASE + encodeURIComponent(channelId), {
    cf: { cacheTtl: CACHE_TTL_SECONDS, cacheEverything: true },
  });
  if (!res.ok) return [];
  const xml = await res.text();
  return parseAtomFeed(xml);
}

/**
 * Tiny regex-based Atom parser.
 *
 * The YouTube feed is small (~15 entries, ~30KB) and well-formed, so we
 * skip pulling in a full XML library. If YouTube ever changes the feed
 * structure this will need updating — but the format has been stable
 * since 2015.
 *
 * Tags we extract per <entry>:
 *   <yt:videoId>       → id
 *   <title>            → title
 *   <author><name>     → channelTitle
 *   <yt:channelId>     → channelId
 *   <published>        → publishedAt
 *   <link rel=...>     → link
 *   <media:thumbnail>  → thumbnail
 *   <media:statistics views="..." />  → viewCount (best-effort)
 */
function parseAtomFeed(xml) {
  const entries = xml.split(/<entry>/i).slice(1);   // discard everything before first <entry>
  const videos = [];

  for (const raw of entries) {
    const entry = raw.split(/<\/entry>/i)[0];
    if (!entry) continue;

    const id            = pick(entry, /<yt:videoId>([^<]+)<\/yt:videoId>/i);
    if (!id) continue;
    const title         = decodeXml(pick(entry, /<title>([\s\S]*?)<\/title>/i));
    const channelTitle  = decodeXml(pick(entry, /<author>\s*<name>([\s\S]*?)<\/name>/i));
    const channelId     = pick(entry, /<yt:channelId>([^<]+)<\/yt:channelId>/i);
    const publishedAt   = pick(entry, /<published>([^<]+)<\/published>/i);
    // Accept either single or double quotes — YouTube uses double, but
    // staying permissive makes the parser less fragile if the feed shape
    // ever shifts. `(["'])` captures the opening quote so it can be reused
    // to match the closing one with a backreference.
    const link          = pick(entry, /<link\s+[^>]*href=(["'])([^"']+)\1/i, 2);
    const thumbnail     = pick(entry, /<media:thumbnail\s+url=(["'])([^"']+)\1/i, 2);
    const viewCountRaw  = pick(entry, /<media:statistics\s+[^>]*views=(["'])(\d+)\1/i, 2);
    const viewCount     = viewCountRaw ? parseInt(viewCountRaw, 10) : undefined;

    videos.push({
      id,
      title,
      channelTitle,
      channelId,
      publishedAt,
      link,
      thumbnail: thumbnail || `https://i3.ytimg.com/vi/${id}/hqdefault.jpg`,
      ...(viewCount !== undefined ? { viewCount } : {}),
    });
  }
  return videos;
}

/**
 * Nth capture group of a regex against text, or empty string.
 * Defaults to group 1 — pass `group=2` etc. when an earlier group
 * captured a delimiter (e.g. a quote character we wanted to match).
 */
function pick(text, regex, group = 1) {
  const m = text.match(regex);
  return m ? m[group].trim() : '';
}

/** Decode the handful of XML/HTML entities YouTube emits. */
function decodeXml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/* ============================================================
   Helpers
   ============================================================ */
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Browser cache the same as edge cache, so repeated reloads
      // don't repoll the Worker.
      'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
      ...CORS_HEADERS,
    },
  });
}
