/**
 * Fan-art gallery items. Renders into a CSS-driven masonry layout.
 *
 * `height` is the visual height of the placeholder tile (px). Once real
 * images replace the placeholders, this can be removed in favor of intrinsic
 * image dimensions.
 *
 * `type` must be one of: 'artwork' | 'pixel' | 'builds' | 'screenshots'
 * (see FAN_ART_FILTERS).
 */

export const FAN_ART_ITEMS = [
  // Real fan-art submissions, served from assets/fanArt/ (NB: capital A).
  // If you remove a file, the colored placeholder shows through — safe to
  // swap images in/out without breaking the gallery.
  { id: 'fan-art-1', title: 'Forest Village Scene',        artist: 'ChefDan',  type: 'pixel',   likes: 0, height: 300, color: '#4CAF7D', image: 'assets/fanArt/fan_art1.png' },
  { id: 'fan-art-2', title: 'SenseiTalon — Awakening',     artist: 'Pavisian', type: 'artwork', likes: 0, height: 360, color: '#8B2D8C', image: 'assets/fanArt/fan_art2.png' },
  { id: 'fan-art-3', title: 'WanderCraft Chibi Roster',    artist: 'Unknown',  type: 'artwork', likes: 0, height: 280, color: '#A8D5BA', image: 'assets/fanArt/fan_art3.png' },
  { id: 'fan-art-4', title: 'WanderCraft Season 2 Poster', artist: 'Unknown',  type: 'artwork', likes: 0, height: 240, color: '#1E9FD6', image: 'assets/fanArt/fan_art4.png' },

  // Demo placeholders below — keep, replace with more real art, or delete.
  { id: 'sunset-mountains', title: 'Sunset Over Voxel Mountains', artist: 'PixelPainter42', type: 'artwork', likes: 2847, height: 280, color: '#FF8C42' },
  { id: 'atlas-portrait', title: 'AtlasVoyager Fan Portrait', artist: 'CubeArtist', type: 'pixel', likes: 1923, height: 200, color: '#1B4965' },
  { id: 'ocean-temple', title: 'Ocean Temple Build', artist: 'BuilderMax', type: 'builds', likes: 3401, height: 320, color: '#2F6F4F' },
  { id: 'northern-lights', title: 'Northern Lights Screenshot', artist: 'WanderFan99', type: 'screenshots', likes: 1204, height: 180, color: '#4CAF7D' },
  { id: 'logo-pixel', title: 'WanderCraft Logo Pixel Art', artist: 'RetroPixels', type: 'pixel', likes: 4521, height: 240, color: '#FF8C42' },
  { id: 'underwater-kingdom', title: 'Underwater Kingdom', artist: 'DeepSeaBuilder', type: 'builds', likes: 2156, height: 360, color: '#1B4965' },
  { id: 'desert-oasis', title: 'Desert Oasis Painting', artist: 'ArtByNature', type: 'artwork', likes: 1876, height: 260, color: '#D9C3A5' },
  { id: 'mountain-panorama', title: 'Mountain Base Panorama', artist: 'SummitFan', type: 'screenshots', likes: 987, height: 190, color: '#2F6F4F' },
  { id: 'character-lineup', title: 'Voxel Character Lineup', artist: 'CubeArtist', type: 'pixel', likes: 3102, height: 220, color: '#4CAF7D' },
  { id: 'forest-treehouse', title: 'Forest Canopy Treehouse', artist: 'TreeBuilder', type: 'builds', likes: 2789, height: 300, color: '#2F6F4F' },
  { id: 'reef-fanart', title: 'Reef Runner Fan Art', artist: 'OceanPainter', type: 'artwork', likes: 1543, height: 250, color: '#1B4965' },
  { id: 'volcanic-base', title: 'Volcanic Island Base', artist: 'LavaKing', type: 'builds', likes: 3890, height: 340, color: '#FF8C42' },
];

export const FAN_ART_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'artwork', label: 'Artwork' },
  { value: 'pixel', label: 'Pixel Art' },
  { value: 'builds', label: 'Builds' },
  { value: 'screenshots', label: 'Screenshots' },
];
