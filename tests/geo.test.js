import { describe, test, expect } from 'vitest';
import { latLonToCartesian, isLandPoint, CONTINENTS } from '../js/utils/geo.js';

describe('latLonToCartesian', () => {
  test('point at lat=0, lon=0 maps to (radius, 0, 0)', () => {
    const { x, y, z } = latLonToCartesian(0, 0, 3);
    expect(x).toBeCloseTo(3);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(0);
  });

  test('point at the north pole has y == radius', () => {
    const { x, y, z } = latLonToCartesian(Math.PI / 2, 0, 5);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(5);
    expect(z).toBeCloseTo(0);
  });

  test('point at lat=0, lon=π/2 lies on positive z axis', () => {
    const { x, y, z } = latLonToCartesian(0, Math.PI / 2, 1);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(1);
  });

  test('all returned points lie on the sphere of given radius', () => {
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
  test('identifies a point inside the Europe bounding box as land', () => {
    // Europe is latMin: 0.35 → latMax: 1.15, lonMin: -0.3 → lonMax: 0.55
    expect(isLandPoint(0.7, 0.2)).toBe(true);
  });

  test('identifies a deep-ocean point as not land', () => {
    // Mid-Pacific — no continent box covers (lat ~0, lon ~3.6).
    expect(isLandPoint(0, 3.6)).toBe(false);
  });

  test('handles negative longitudes by normalizing to 0..2π', () => {
    // North America: latMin 0.55 → 1.25, lonMin -1.8 → lonMax -0.4
    expect(isLandPoint(0.9, -1.0)).toBe(true);
  });

  test('returns false when latitude is outside every continent band', () => {
    // Latitudinal "no man's land" near the south polar circle — no continent here.
    expect(isLandPoint(-1.4, 1.0)).toBe(false);
  });

  test('accepts a custom continents list', () => {
    const custom = [{ latMin: 0, latMax: 0.1, lonMin: 0, lonMax: 0.1 }];
    expect(isLandPoint(0.05, 0.05, custom)).toBe(true);
    expect(isLandPoint(0.5, 0.5, custom)).toBe(false);
  });

  test('continent definitions cover at least the 7 named continents', () => {
    const names = CONTINENTS.map((c) => c.name);
    for (const expected of ['Europe', 'NorthAmerica', 'SouthAmerica', 'Africa', 'Asia', 'Australia']) {
      expect(names).toContain(expected);
    }
  });
});
