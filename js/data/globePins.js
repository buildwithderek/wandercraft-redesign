/**
 * Decorative location pins for the 3D globe.
 *
 * The real WanderCraft creators play on a Minecraft server, not in specific
 * cities — so the globe pins are stylized "creators worldwide" markers
 * rather than per-creator geo points. Each pin opens a popup that links to
 * the #creators section.
 *
 * Coordinates use radians (lat: −π/2..π/2, lon: 0..2π). See utils/geo.js.
 */

export const GLOBE_PINS = [
  { id: 'na',     label: 'North America', sub: 'Wanderers worldwide', color: '#FF8C42', initials: 'NA', pin: { lat:  0.85, lon: -1.4  } },
  { id: 'eu',     label: 'Europe',        sub: 'Wanderers worldwide', color: '#4CAF7D', initials: 'EU', pin: { lat:  0.85, lon:  0.1  } },
  { id: 'asia',   label: 'Asia',          sub: 'Wanderers worldwide', color: '#1B4965', initials: 'AS', pin: { lat:  0.6,  lon:  1.9  } },
  { id: 'oce',    label: 'Oceania',       sub: 'Wanderers worldwide', color: '#D9C3A5', initials: 'OC', pin: { lat: -0.45, lon:  2.5  } },
  { id: 'sa',     label: 'South America', sub: 'Wanderers worldwide', color: '#2F6F4F', initials: 'SA', pin: { lat: -0.55, lon: -1.1  } },
  { id: 'africa', label: 'Africa',        sub: 'Wanderers worldwide', color: '#FF8C42', initials: 'AF', pin: { lat: -0.05, lon:  0.35 } },
];
