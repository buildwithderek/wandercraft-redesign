/**
 * Smoke test runner for environments without Vitest installed.
 *
 *   node tests/run-without-vitest.mjs
 *
 * Re-implements the small subset of `describe`/`test`/`expect` we use, then
 * runs the pure-function suites (parseViews, geo, contentDashboard,
 * fanartGallery, dom). Component and modal tests need JSDOM and are skipped.
 *
 * The real test suite lives in tests/*.test.js and runs under `npm test`.
 * This file exists so the rewrite can be verified end-to-end even when
 * the package isn't installed.
 */

let passed = 0;
let failed = 0;
const failures = [];
const pending = [];     // promises returned by async tests so we can await them

function describe(name, fn) {
  console.log(`\n• ${name}`);
  fn();
}

function test(name, fn) {
  // Always wrap in async so we can await both sync and async test bodies.
  const promise = (async () => {
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      failed++;
      failures.push({ name, err });
      console.log(`  ✗ ${name}`);
      console.log(`    ${err.message}`);
    }
  })();
  pending.push(promise);
}

function expect(actual) {
  return {
    toBe(expected) {
      if (!Object.is(actual, expected)) {
        throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeCloseTo(expected, precision = 2) {
      const diff = Math.abs(actual - expected);
      if (diff > Math.pow(10, -precision) / 2) {
        throw new Error(`expected ~${expected}, got ${actual} (diff ${diff})`);
      }
    },
    toBeTruthy() {
      if (!actual) throw new Error(`expected truthy, got ${actual}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`expected falsy, got ${actual}`);
    },
    toHaveLength(n) {
      if (actual?.length !== n) {
        throw new Error(`expected length ${n}, got ${actual?.length}`);
      }
    },
    toContain(item) {
      const ok = Array.isArray(actual) ? actual.includes(item) : String(actual).includes(item);
      if (!ok) throw new Error(`expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`);
    },
  };
}

// ===== parseViews =====
const { parseViews } = await import('../js/utils/parseViews.js');
describe('parseViews', () => {
  test('parses "M" suffix as millions', () => expect(parseViews('2.1M views')).toBe(2_100_000));
  test('parses "K" suffix as thousands', () => expect(parseViews('84K watching')).toBe(84_000));
  test('parses "B" suffix as billions', () => expect(parseViews('1.5B views')).toBe(1_500_000_000));
  test('parses bare numbers with no suffix', () => expect(parseViews('847')).toBe(847));
  test('parses decimals correctly', () => expect(parseViews('1.2K shares')).toBe(1_200));
  test('is case-insensitive on the suffix letter', () => expect(parseViews('5m total')).toBe(5_000_000));
  test('returns 0 for unparseable strings', () => {
    expect(parseViews('Live now')).toBe(0);
    expect(parseViews('')).toBe(0);
    expect(parseViews('LIVE')).toBe(0);
  });
  test('returns 0 for non-string input', () => {
    expect(parseViews(null)).toBe(0);
    expect(parseViews(undefined)).toBe(0);
    expect(parseViews(42)).toBe(0);
  });
});

// ===== geo =====
const { latLonToCartesian, isLandPoint, CONTINENTS } = await import('../js/utils/geo.js');
describe('latLonToCartesian', () => {
  test('point at lat=0, lon=0 maps to (radius, 0, 0)', () => {
    const { x, y, z } = latLonToCartesian(0, 0, 3);
    expect(x).toBeCloseTo(3);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(0);
  });
  test('point at north pole has y == radius', () => {
    const { x, y, z } = latLonToCartesian(Math.PI / 2, 0, 5);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(5);
    expect(z).toBeCloseTo(0);
  });
  test('all points lie on the sphere of given radius', () => {
    for (let i = 0; i < 50; i++) {
      const lat = (Math.random() - 0.5) * Math.PI;
      const lon = Math.random() * Math.PI * 2;
      const { x, y, z } = latLonToCartesian(lat, lon, 4);
      const distance = Math.sqrt(x * x + y * y + z * z);
      expect(distance).toBeCloseTo(4, 5);
    }
  });
});
describe('isLandPoint', () => {
  test('Europe bounding box is land', () => expect(isLandPoint(0.7, 0.2)).toBe(true));
  test('mid-Pacific is not land', () => expect(isLandPoint(0, 3.6)).toBe(false));
  test('negative longitude resolves correctly (North America)', () => expect(isLandPoint(0.9, -1.0)).toBe(true));
  test('high south latitude with no continent is not land', () => expect(isLandPoint(-1.4, 1.0)).toBe(false));
  test('accepts custom continents', () => {
    const custom = [{ latMin: 0, latMax: 0.1, lonMin: 0, lonMax: 0.1 }];
    expect(isLandPoint(0.05, 0.05, custom)).toBe(true);
    expect(isLandPoint(0.5, 0.5, custom)).toBe(false);
  });
  test('covers the major continents', () => {
    const names = CONTINENTS.map((c) => c.name);
    for (const n of ['Europe', 'NorthAmerica', 'SouthAmerica', 'Africa', 'Asia', 'Australia']) {
      expect(names).toContain(n);
    }
  });
});

// ===== applyFilterAndSort =====
const { applyFilterAndSort } = await import('../js/modules/contentDashboard.js');
const fixture = [
  { id: 'a', creator: 'Zed',    type: 'videos',  views: '1.0M views' },
  { id: 'b', creator: 'Atlas',  type: 'shorts',  views: '500K views' },
  { id: 'c', creator: 'Maxine', type: 'videos',  views: '2.5M views' },
  { id: 'd', creator: 'Atlas',  type: 'streams', views: '10K watching' },
  { id: 'e', creator: 'Zed',    type: 'bts',     views: '120K views' },
];
describe('applyFilterAndSort', () => {
  test('filter=all + sort=recent returns source order', () => {
    expect(applyFilterAndSort(fixture, { filter: 'all', sort: 'recent' }).map((i) => i.id))
      .toEqual(['a', 'b', 'c', 'd', 'e']);
  });
  test('filter by type', () => {
    expect(applyFilterAndSort(fixture, { filter: 'videos', sort: 'recent' }).map((i) => i.id))
      .toEqual(['a', 'c']);
  });
  test('sort by popularity', () => {
    const out = applyFilterAndSort(fixture, { filter: 'all', sort: 'popular' });
    expect(out.map((i) => i.id)).toEqual(['c', 'a', 'b', 'e', 'd']);
  });
  test('sort by creator', () => {
    const out = applyFilterAndSort(fixture, { filter: 'all', sort: 'creator' });
    expect(out.map((i) => i.creator)).toEqual(['Atlas', 'Atlas', 'Maxine', 'Zed', 'Zed']);
  });
  test('filter and sort compose', () => {
    const out = applyFilterAndSort(fixture, { filter: 'videos', sort: 'popular' });
    expect(out.map((i) => i.id)).toEqual(['c', 'a']);
  });
  test('does not mutate input', () => {
    const before = fixture.map((i) => i.id);
    applyFilterAndSort(fixture, { filter: 'all', sort: 'popular' });
    expect(fixture.map((i) => i.id)).toEqual(before);
  });
  test('returns empty array on no matches', () => {
    expect(applyFilterAndSort(fixture, { filter: 'nope', sort: 'recent' })).toEqual([]);
  });
});

// ===== liveStatus =====
const { parseDecapiUptime, decapiProvider } = await import('../js/modules/liveStatus.js');
describe('parseDecapiUptime', () => {
  test('uptime string starting with a number is live', () => expect(parseDecapiUptime('2 hours, 15 minutes')).toBe(true));
  test('"is offline" is not live', () => expect(parseDecapiUptime('senseitalon is offline')).toBe(false));
  test('"User not found" is not live', () => expect(parseDecapiUptime('User not found')).toBe(false));
  test('empty / non-string is not live', () => {
    expect(parseDecapiUptime('')).toBe(false);
    expect(parseDecapiUptime(null)).toBe(false);
    expect(parseDecapiUptime(42)).toBe(false);
  });
});
describe('decapiProvider', () => {
  test('returns true on live uptime response', async () => {
    const fakeFetch = async () => ({ ok: true, text: async () => '2 hours, 15 minutes' });
    expect(await decapiProvider('x', fakeFetch)).toBe(true);
  });
  test('returns false on offline response', async () => {
    const fakeFetch = async () => ({ ok: true, text: async () => 'x is offline' });
    expect(await decapiProvider('x', fakeFetch)).toBe(false);
  });
  test('returns false on fetch error', async () => {
    const fakeFetch = async () => { throw new Error('net'); };
    expect(await decapiProvider('x', fakeFetch)).toBe(false);
  });
});

// ===== applyFanArtFilter =====
const { applyFanArtFilter } = await import('../js/modules/fanartGallery.js');
const artItems = [
  { id: '1', type: 'artwork' },
  { id: '2', type: 'pixel' },
  { id: '3', type: 'builds' },
  { id: '4', type: 'pixel' },
];
describe('applyFanArtFilter', () => {
  test('all → every item', () => expect(applyFanArtFilter(artItems, 'all')).toHaveLength(4));
  test('filters by type', () => {
    const out = applyFanArtFilter(artItems, 'pixel');
    expect(out).toHaveLength(2);
  });
  test('empty on no match', () => expect(applyFanArtFilter(artItems, 'nope')).toEqual([]));
});

// Wait for any async tests to finish before printing the summary.
await Promise.all(pending);

// ===== summary =====
console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log('─'.repeat(40));

if (failed > 0) {
  console.log('\nFAILURES:');
  for (const f of failures) console.log(`  • ${f.name}: ${f.err.message}`);
  process.exit(1);
}
process.exit(0);
