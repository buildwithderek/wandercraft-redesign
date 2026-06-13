import { describe, test, expect } from 'vitest';
import { parseViews } from '../js/utils/parseViews.js';

describe('parseViews', () => {
  test('parses "M" suffix as millions', () => {
    expect(parseViews('2.1M views')).toBe(2_100_000);
  });

  test('parses "K" suffix as thousands', () => {
    expect(parseViews('84K watching')).toBe(84_000);
  });

  test('parses "B" suffix as billions', () => {
    expect(parseViews('1.5B views')).toBe(1_500_000_000);
  });

  test('parses bare numbers with no suffix', () => {
    expect(parseViews('847')).toBe(847);
  });

  test('parses decimals correctly', () => {
    expect(parseViews('1.2K shares')).toBe(1_200);
  });

  test('is case-insensitive on the suffix letter', () => {
    expect(parseViews('5m total')).toBe(5_000_000);
  });

  test('returns 0 for unparseable strings so they sort to the bottom', () => {
    expect(parseViews('Live now')).toBe(0);
    expect(parseViews('')).toBe(0);
    expect(parseViews('LIVE')).toBe(0);
  });

  test('returns 0 for non-string input rather than throwing', () => {
    expect(parseViews(null)).toBe(0);
    expect(parseViews(undefined)).toBe(0);
    expect(parseViews(42)).toBe(0);
  });
});
