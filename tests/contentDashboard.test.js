import { describe, test, expect } from 'vitest';
import { applyFilterAndSort } from '../js/modules/contentDashboard.js';

/**
 * Hand-built fixture so the tests don't depend on the real CONTENT_ITEMS
 * file (which is content the designers will rewrite).
 */
const items = [
  { id: 'a', title: 'A', creator: 'Zed',    type: 'videos',  views: '1.0M views', date: 'today' },
  { id: 'b', title: 'B', creator: 'Atlas',  type: 'shorts',  views: '500K views', date: 'today' },
  { id: 'c', title: 'C', creator: 'Maxine', type: 'videos',  views: '2.5M views', date: 'today' },
  { id: 'd', title: 'D', creator: 'Atlas',  type: 'streams', views: '10K watching', date: 'now' },
  { id: 'e', title: 'E', creator: 'Zed',    type: 'bts',     views: '120K views', date: 'today' },
];

describe('applyFilterAndSort', () => {
  test('returns every item when filter is "all" and sort is "recent"', () => {
    const out = applyFilterAndSort(items, { filter: 'all', sort: 'recent' });
    expect(out).toHaveLength(items.length);
    expect(out.map((i) => i.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  test('filters by content type', () => {
    const out = applyFilterAndSort(items, { filter: 'videos', sort: 'recent' });
    expect(out.map((i) => i.id)).toEqual(['a', 'c']);
  });

  test('sorts by popularity (highest view count first) within the filter', () => {
    const out = applyFilterAndSort(items, { filter: 'all', sort: 'popular' });
    expect(out[0].id).toBe('c');   // 2.5M
    expect(out[1].id).toBe('a');   // 1.0M
    expect(out[2].id).toBe('b');   // 500K
    expect(out[3].id).toBe('e');   // 120K
    expect(out[4].id).toBe('d');   // 10K
  });

  test('sorts by creator name alphabetically', () => {
    const out = applyFilterAndSort(items, { filter: 'all', sort: 'creator' });
    const creators = out.map((i) => i.creator);
    expect(creators).toEqual(['Atlas', 'Atlas', 'Maxine', 'Zed', 'Zed']);
  });

  test('filter and sort compose: "videos" filter + "popular" sort applies both', () => {
    const out = applyFilterAndSort(items, { filter: 'videos', sort: 'popular' });
    expect(out.map((i) => i.id)).toEqual(['c', 'a']);
  });

  test('does not mutate the input array', () => {
    const before = items.map((i) => i.id);
    applyFilterAndSort(items, { filter: 'all', sort: 'popular' });
    expect(items.map((i) => i.id)).toEqual(before);
  });

  test('returns an empty array when no item matches the filter', () => {
    const out = applyFilterAndSort(items, { filter: 'nonexistent', sort: 'recent' });
    expect(out).toEqual([]);
  });
});
