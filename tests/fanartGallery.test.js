import { describe, test, expect } from 'vitest';
import { applyFanArtFilter } from '../js/modules/fanartGallery.js';

const items = [
  { id: '1', type: 'artwork' },
  { id: '2', type: 'pixel' },
  { id: '3', type: 'builds' },
  { id: '4', type: 'pixel' },
  { id: '5', type: 'screenshots' },
];

describe('applyFanArtFilter', () => {
  test('returns every item when filter is "all"', () => {
    const out = applyFanArtFilter(items, 'all');
    expect(out).toHaveLength(items.length);
  });

  test('returns only items matching the type filter', () => {
    const out = applyFanArtFilter(items, 'pixel');
    expect(out).toHaveLength(2);
    expect(out.every((i) => i.type === 'pixel')).toBe(true);
  });

  test('returns an empty array when nothing matches', () => {
    expect(applyFanArtFilter(items, 'unknown-type')).toEqual([]);
  });

  test('does not mutate the input array', () => {
    const before = items.map((i) => i.id);
    applyFanArtFilter(items, 'pixel');
    expect(items.map((i) => i.id)).toEqual(before);
  });
});
