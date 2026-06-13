/**
 * Smoke test for the Worker's RSS parser. Imports the parsing logic
 * by re-running the regexes here against representative fixtures.
 *
 * Run with: node workers/youtube-feed/_parser-smoke.mjs
 * (Standalone — doesn't depend on vitest or any npm packages.)
 */

function pick(text, regex, group = 1) {
  const m = text.match(regex);
  return m ? m[group].trim() : '';
}
function decodeXml(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}
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
    videos.push({
      id, title, channelTitle, channelId, publishedAt, link,
      thumbnail: thumbnail || `https://i3.ytimg.com/vi/${id}/hqdefault.jpg`,
      viewCount: viewCountRaw ? parseInt(viewCountRaw, 10) : undefined,
    });
  }
  return videos;
}

// Realistic YT-style fixture, double-quoted attributes.
const doubleQuoted = `<feed>
  <entry>
    <id>yt:video:abc123</id>
    <yt:videoId>abc123</yt:videoId>
    <yt:channelId>UC_atlasvoyager</yt:channelId>
    <title>Surviving 100 Days in Arctic Iceland &amp; the Aurora</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=abc123"/>
    <author><name>AtlasVoyager</name></author>
    <published>2026-05-30T15:22:11+00:00</published>
    <media:group>
      <media:thumbnail url="https://i3.ytimg.com/vi/abc123/hqdefault.jpg" width="480" height="360"/>
      <media:statistics views="2143829"/>
    </media:group>
  </entry>
  <entry>
    <id>yt:video:xyz789</id>
    <yt:videoId>xyz789</yt:videoId>
    <yt:channelId>UC_lunaterraforms</yt:channelId>
    <title>Quick Build Tip</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=xyz789"/>
    <author><name>LunaTerraforms</name></author>
    <published>2026-05-29T08:15:00+00:00</published>
  </entry>
</feed>`;

const doubleQuotedResults = parseAtomFeed(doubleQuoted);

// Same fixture but single-quoted to confirm parser robustness.
const singleQuoted = doubleQuoted.replace(/"/g, "'");
const singleQuotedResults = parseAtomFeed(singleQuoted);

const check = (name, pass) => {
  console.log(`${pass ? '✓' : '✗'} ${name}`);
  if (!pass) process.exitCode = 1;
};

check('parses 2 entries (double-quoted)',       doubleQuotedResults.length === 2);
check('id is extracted',                        doubleQuotedResults[0].id === 'abc123');
check('title is extracted + entity-decoded',    doubleQuotedResults[0].title === 'Surviving 100 Days in Arctic Iceland & the Aurora');
check('channelTitle is extracted',              doubleQuotedResults[0].channelTitle === 'AtlasVoyager');
check('channelId is extracted',                 doubleQuotedResults[0].channelId === 'UC_atlasvoyager');
check('publishedAt is extracted',               doubleQuotedResults[0].publishedAt === '2026-05-30T15:22:11+00:00');
check('link is extracted',                      doubleQuotedResults[0].link === 'https://www.youtube.com/watch?v=abc123');
check('thumbnail is extracted',                 doubleQuotedResults[0].thumbnail === 'https://i3.ytimg.com/vi/abc123/hqdefault.jpg');
check('viewCount parsed as integer',            doubleQuotedResults[0].viewCount === 2143829);
check('missing viewCount → undefined (graceful)', doubleQuotedResults[1].viewCount === undefined);
check('missing thumbnail → default fallback',   doubleQuotedResults[1].thumbnail === 'https://i3.ytimg.com/vi/xyz789/hqdefault.jpg');
check('single-quoted feed also parses',         singleQuotedResults[0].viewCount === 2143829);
check('single-quoted link extracted',           singleQuotedResults[0].link === 'https://www.youtube.com/watch?v=abc123');
