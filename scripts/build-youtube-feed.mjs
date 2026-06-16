#!/usr/bin/env node
/**
 * WanderCraft — YouTube content feed builder (per-type)
 * =====================================================
 *
 * Goal: for every creator with a youtubeChannelId, pull their THREE most
 * recent items BY TYPE and tag each one correctly:
 *
 *   - latest regular upload   → type: 'videos'   (the /videos tab)
 *   - latest live stream      → type: 'streams'  (the /streams tab)
 *   - latest short            → type: 'shorts'   (the /shorts tab)
 *
 * Why tabs instead of RSS:
 *   YouTube's RSS feed (videos.xml) lists recent uploads but has NO signal for
 *   whether a video is/was a live stream — both use /watch?v= links. So streams
 *   would be miscategorized as videos. The channel tab pages DO separate the
 *   three types, so we read those. No API key, no quota.
 *
 * Dates: the /videos and /streams tabs expose a relative time ("3 months ago",
 * "Streamed 10 hours ago"); we parse those to an approximate ISO date for
 * sorting/display. The /shorts tab exposes no date, so we backfill it from the
 * channel's RSS feed (exact date) when the short is recent enough to appear
 * there, otherwise we approximate.
 *
 * Resilience: every fetch is fail-soft. A channel (or one of its tabs) that
 * errors is simply skipped — partial output beats failing the whole job.
 *
 * Output shape (consumed by js/modules/youtubeFeed.js):
 *   [{ id, title, channelTitle, channelId, type, publishedAt, link,
 *      thumbnail, viewCount? }, ...]
 *
 * Run locally:  node scripts/build-youtube-feed.mjs
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const OUTPUT_PATH = resolve(REPO_ROOT, 'data', 'videos.json');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
         + '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const RSS_BASE = 'https://www.youtube.com/feeds/videos.xml?channel_id=';
const CHANNEL_BASE = 'https://www.youtube.com/channel/';

const TABS = [
  { tab: 'videos',  type: 'videos' },
  { tab: 'streams', type: 'streams' },
  { tab: 'shorts',  type: 'shorts' },
];

const LIMIT = 45;   // total items to write (12 creators × up to 3 types = 36)

/* ============================================================
   Entry point
   ============================================================ */
async function main() {
  const { CREATORS } = await import(
    `file://${resolve(REPO_ROOT, 'js/data/creators.js')}`
  );
  const channels = CREATORS.filter((c) => c.youtubeChannelId);

  if (channels.length === 0) {
    console.log('[build-youtube-feed] No channel IDs — writing empty array.');
    await writeJson([]);
    return;
  }

  console.log(`[build-youtube-feed] Pulling videos/streams/shorts for ${channels.length} creator(s)...`);
  const settled = await Promise.allSettled(channels.map(buildForCreator));

  const items = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') items.push(...r.value);
    else console.warn(`[build-youtube-feed] ${channels[i].name} failed:`, r.reason?.message || r.reason);
  });

  // Newest first, then cap.
  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const out = items.slice(0, LIMIT);

  await writeJson(out);
  const byType = out.reduce((m, v) => ((m[v.type] = (m[v.type] || 0) + 1), m), {});
  console.log(`[build-youtube-feed] Wrote ${out.length} items`, byType,
    `from ${new Set(out.map((v) => v.channelId)).size} creators`);
}

/** Build up to 3 entries (one per type) for a single creator. */
async function buildForCreator(creator) {
  const id = creator.youtubeChannelId;
  // RSS gives exact dates for recent uploads (incl. shorts) — used to backfill.
  const rssDates = await fetchRssDates(id).catch(() => new Map());

  const results = await Promise.allSettled(
    TABS.map(async ({ tab, type }) => {
      const item = await fetchTabLatest(id, tab, type);
      if (!item) return null;
      const publishedAt =
        rssDates.get(item.id) ||
        relativeToISO(item.relDate) ||
        new Date().toISOString(); // last-resort: treat as just-now so it still shows
      return {
        id: item.id,
        title: item.title || '(untitled)',
        channelTitle: creator.name,
        channelId: id,
        type,
        publishedAt,
        link: type === 'shorts'
          ? `https://www.youtube.com/shorts/${item.id}`
          : `https://www.youtube.com/watch?v=${item.id}`,
        thumbnail: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        ...(item.views != null ? { viewCount: item.views } : {}),
      };
    }),
  );
  return results.filter((r) => r.status === 'fulfilled' && r.value).map((r) => r.value);
}

/* ============================================================
   Channel tab scraping
   ============================================================ */

/** Fetch a channel tab and return its newest item of that type, or null. */
async function fetchTabLatest(channelId, tab, type) {
  const res = await fetch(`${CHANNEL_BASE}${channelId}/${tab}`, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-US' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${tab}`);
  const data = extractInitialData(await res.text());
  if (!data) return null;
  return firstGridItem(data, type);
}

/**
 * Find the channel's primary content grid (richGridRenderer) and return the
 * newest item for the requested type. Handles the modern lockupViewModel
 * (videos/streams) and shortsLockupViewModel (shorts).
 *
 * Streams caveat: YouTube redirects /streams to the channel's /videos content
 * when a channel has NEVER livestreamed, so the grid is full of regular
 * uploads. A genuine past stream's metadata reads "Streamed …", so for the
 * streams tab we only accept items carrying that marker — otherwise a
 * non-streaming channel's latest upload would be mislabeled as a stream.
 *
 * Returns null when nothing qualifies (e.g. a channel with no real streams).
 */
function firstGridItem(data, type) {
  for (const node of walk(data)) {
    const contents = node.richGridRenderer?.contents;
    if (!contents) continue;

    for (const it of contents) {
      const content = it.richItemRenderer?.content;
      if (!content) continue;

      if (type === 'shorts') {
        const sv = content.shortsLockupViewModel;
        if (!sv) continue;
        const id = sv.entityId?.replace('shorts-shelf-item-', '');
        if (!id) continue;
        return {
          id,
          title: sv.overlayMetadata?.primaryText?.content,
          relDate: null, // shorts tab carries no date; backfilled from RSS
          views: parseViews(sv.overlayMetadata?.secondaryText?.content),
        };
      }

      // videos & streams both use lockupViewModel.
      const lv = content.lockupViewModel;
      if (!lv?.contentId) continue;
      const meta = lv.metadata?.lockupMetadataViewModel;
      const rows = (meta?.metadata?.contentMetadataViewModel?.metadataRows || [])
        .flatMap((r) => (r.metadataParts || []).map((p) => p.text?.content))
        .filter(Boolean);

      // Only count it as a stream if YouTube marks it as one ("Streamed …").
      if (type === 'streams' && !rows.some((t) => /streamed/i.test(t))) continue;

      return {
        id: lv.contentId,
        title: meta?.title?.content,
        relDate: rows.find((t) => /ago$/i.test(t)) || null,
        views: parseViews(rows.find((t) => /view/i.test(t))),
      };
    }
    return null; // only the first (primary) grid matters
  }
  return null;
}

/** Pull the embedded ytInitialData JSON via brace-balancing (string-aware). */
function extractInitialData(html) {
  let i = html.indexOf('ytInitialData');
  if (i < 0) return null;
  i = html.indexOf('{', i);
  if (i < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      try { return JSON.parse(html.slice(i, j + 1)); } catch { return null; }
    }
  }
  return null;
}

function* walk(o) {
  if (o && typeof o === 'object') {
    yield o;
    for (const k of Object.keys(o)) yield* walk(o[k]);
  }
}

/* ============================================================
   RSS (date backfill) + parsing helpers
   ============================================================ */

/** Map of { videoId → ISO published } for the channel's recent uploads. */
async function fetchRssDates(channelId) {
  const res = await fetch(RSS_BASE + encodeURIComponent(channelId));
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
  const xml = await res.text();
  const map = new Map();
  for (const raw of xml.split(/<entry>/i).slice(1)) {
    const id = (raw.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i) || [])[1];
    const pub = (raw.match(/<published>([^<]+)<\/published>/i) || [])[1];
    if (id && pub) map.set(id, new Date(pub).toISOString());
  }
  return map;
}

/** "3 months ago" / "Streamed 10 hours ago" → approximate ISO. */
function relativeToISO(text) {
  if (!text) return null;
  const m = text.replace(/^streamed\s+/i, '')
    .match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const secs = { second: 1, minute: 60, hour: 3600, day: 86400,
    week: 604800, month: 2629800, year: 31557600 }[m[2].toLowerCase()];
  return new Date(Date.now() - n * secs * 1000).toISOString();
}

/** "1.2K views" / "4.4M views" / "280 views" → number. */
function parseViews(text) {
  if (!text) return null;
  const m = text.match(/([\d.]+)\s*([KMB]?)/i);
  if (!m) return null;
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[(m[2] || '').toUpperCase()] || 1;
  return Math.round(parseFloat(m[1]) * mult);
}

/* ============================================================
   Output
   ============================================================ */
async function writeJson(arr) {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(arr, null, 2) + '\n');
}

main().catch((err) => {
  console.error('[build-youtube-feed] FATAL:', err);
  process.exit(1);
});
