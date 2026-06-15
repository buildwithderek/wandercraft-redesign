#!/usr/bin/env node
/**
 * WanderCraft — YouTube feed builder
 * ==================================
 *
 * Reads CREATORS from js/data/creators.js, fetches the public RSS feed
 * for every creator with a youtubeChannelId, parses to JSON, and writes
 * the merged + sorted result to data/videos.json.
 *
 * Intended to be run by the GitHub Action in .github/workflows/youtube-feed.yml,
 * which executes on a cron and commits the regenerated JSON back to the repo.
 *
 * Can also be run locally to test:
 *   node scripts/build-youtube-feed.mjs
 *
 * The site's frontend (js/modules/youtubeFeed.js) fetches data/videos.json
 * directly — no Worker, no API key, no quota, no runtime infrastructure.
 *
 * --------------------------------------------------------------------
 * RSS endpoint (no auth, no quota):
 *   https://www.youtube.com/feeds/videos.xml?channel_id={UCxxxxxxxxxxx}
 *
 * Output shape (matches the frontend's content-card adapter):
 *   [
 *     { id, title, channelTitle, channelId, publishedAt, link,
 *       thumbnail, viewCount? },
 *     ...
 *   ]
 *
 * If a single channel feed fails, that channel is silently skipped —
 * partial output beats failing the whole job.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve repo root (one dir up from scripts/) so paths are stable
// regardless of where the Action's working directory is.
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const OUTPUT_PATH = resolve(REPO_ROOT, 'data', 'videos.json');

const YT_RSS_BASE = 'https://www.youtube.com/feeds/videos.xml?channel_id=';
const LIMIT = 60;        // total videos to write to the JSON
const PER_CHANNEL = 2;   // newest videos taken from EACH creator, so one prolific
                         // channel can't crowd everyone else out — and every
                         // creator fits inside the frontend's INITIAL_VIDEO_COUNT
                         // window (js/data/youtubeConfig.js), so all of them show.

/* ============================================================
   Entry point
   ============================================================ */

async function main() {
  // Import the creators list. Using a relative path that works from
  // the repo root because the Action checks out into the workspace root.
  const { CREATORS } = await import(
    `file://${resolve(REPO_ROOT, 'js/data/creators.js')}`
  );

  const channels = CREATORS
    .map((c) => c.youtubeChannelId)
    .filter(Boolean);

  if (channels.length === 0) {
    console.log('[build-youtube-feed] No channel IDs in creators.js — writing empty array.');
    await writeJson([]);
    return;
  }

  console.log(`[build-youtube-feed] Fetching ${channels.length} channel(s)...`);
  const settled = await Promise.allSettled(channels.map(fetchChannelFeed));

  const videos = [];
  for (let i = 0; i < settled.length; i++) {
    const result = settled[i];
    if (result.status === 'fulfilled') {
      // Keep only each channel's newest PER_CHANNEL videos before merging, so a
      // high-volume creator doesn't monopolize the global LIMIT and every
      // creator with uploads gets represented on the dashboard.
      const newestForChannel = result.value
        .slice()
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
        .slice(0, PER_CHANNEL);
      videos.push(...newestForChannel);
    } else {
      console.warn(`[build-youtube-feed] ${channels[i]} failed:`, result.reason?.message || result.reason);
    }
  }

  // Merge all channels, sort newest first, trim to LIMIT.
  videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const out = videos.slice(0, LIMIT);

  await writeJson(out);
  console.log(`[build-youtube-feed] Wrote ${out.length} videos to ${OUTPUT_PATH}`);
}

async function writeJson(arr) {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  // Stable formatting (2-space indent + trailing newline) so git diffs
  // stay small and reviewable when the Action commits the file.
  await writeFile(OUTPUT_PATH, JSON.stringify(arr, null, 2) + '\n');
}

/* ============================================================
   Per-channel fetch + parse
   ============================================================ */

async function fetchChannelFeed(channelId) {
  const res = await fetch(YT_RSS_BASE + encodeURIComponent(channelId));
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for channel ${channelId}`);
  }
  const xml = await res.text();
  return parseAtomFeed(xml);
}

/**
 * Tiny regex-based Atom parser. Mirrors workers/youtube-feed/worker.js.
 * If you ever update one, update the other — or extract this into a
 * shared file imported by both.
 */
function parseAtomFeed(xml) {
  const entries = xml.split(/<entry>/i).slice(1);
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

function pick(text, regex, group = 1) {
  const m = text.match(regex);
  return m ? m[group].trim() : '';
}

function decodeXml(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}

/* ============================================================
   Run
   ============================================================ */
main().catch((err) => {
  console.error('[build-youtube-feed] FATAL:', err);
  process.exit(1);
});
