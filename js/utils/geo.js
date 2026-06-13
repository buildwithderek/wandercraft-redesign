/**
 * Geometry helpers shared by the globe and the creator pin overlay.
 *
 * Coordinate convention (matches Three.js scene in globe.js):
 *   lat: −π/2 to π/2 (south pole → north pole)
 *   lon: 0 to 2π     (with 0 ≈ prime meridian, increasing eastward)
 *
 * Continents are modeled as lat/lon bounding boxes, not real geography. That's
 * deliberate: the globe is stylized and we don't want a heavy GeoJSON payload
 * for a decorative voxel earth.
 */

/** Convert spherical (lat, lon, radius) to Cartesian (x, y, z). */
export function latLonToCartesian(lat, lon, radius) {
  const cosLat = Math.cos(lat);
  return {
    x: radius * cosLat * Math.cos(lon),
    y: radius * Math.sin(lat),
    z: radius * cosLat * Math.sin(lon),
  };
}

/** Continent bounding boxes — purely stylized, not georeferenced. */
export const CONTINENTS = [
  { latMin: 0.35,  latMax: 1.15,  lonMin: -0.3,  lonMax:  0.55, name: 'Europe' },
  { latMin: 0.55,  latMax: 1.25,  lonMin: -1.8,  lonMax: -0.4,  name: 'NorthAmerica' },
  { latMin: -0.1,  latMax: 0.55,  lonMin: -1.5,  lonMax: -1.0,  name: 'CentralAmerica' },
  { latMin: -0.85, latMax: -0.05, lonMin: -1.2,  lonMax: -0.45, name: 'SouthAmerica' },
  { latMin: -0.6,  latMax: 0.55,  lonMin: -0.25, lonMax:  0.75, name: 'Africa' },
  { latMin: 0.15,  latMax: 1.1,   lonMin:  0.5,  lonMax:  2.5,  name: 'Asia' },
  { latMin: -0.45, latMax: 0.05,  lonMin:  1.6,  lonMax:  2.7,  name: 'Australia' },
  { latMin: 0.8,   latMax: 1.2,   lonMin: -0.65, lonMax: -0.15, name: 'Greenland' },
  { latMin: 0.08,  latMax: 0.6,   lonMin:  0.9,  lonMax:  1.5,  name: 'MiddleEast' },
  { latMin: -0.3,  latMax: 0.35,  lonMin:  1.0,  lonMax:  1.55, name: 'India' },
  { latMin: 0.0,   latMax: 0.4,   lonMin:  1.5,  lonMax:  2.2,  name: 'SEAsia' },
  { latMin: 0.5,   latMax: 1.05,  lonMin:  1.8,  lonMax:  2.7,  name: 'Russia' },
];

/**
 * True if the point falls inside one of the stylized continent boxes.
 *
 * Longitudes can be negative in the input, so we normalize to 0..2π before
 * comparing. A box that wraps the antimeridian (lonMin > lonMax) is handled
 * with an OR check.
 */
export function isLandPoint(lat, lon, continents = CONTINENTS) {
  const TAU = Math.PI * 2;
  const normalizedLon = lon < 0 ? lon + TAU : lon;

  for (const c of continents) {
    if (lat < c.latMin || lat > c.latMax) continue;

    let cMin = c.lonMin < 0 ? c.lonMin + TAU : c.lonMin;
    let cMax = c.lonMax < 0 ? c.lonMax + TAU : c.lonMax;

    const wraps = cMin > cMax;
    const hit = wraps
      ? normalizedLon >= cMin || normalizedLon <= cMax
      : normalizedLon >= cMin && normalizedLon <= cMax;

    if (hit) return true;
  }
  return false;
}
