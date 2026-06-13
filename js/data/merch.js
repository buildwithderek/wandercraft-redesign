/**
 * Merch grid. Each card renders a voxel mannequin styled with `--tee-color`
 * (CSS custom property), a name, a creator/collection label, and a price.
 *
 * `style` controls the mannequin shape (matches CSS classes in style.css):
 *   'tee'    — flat-front t-shirt
 *   'hoodie' — hoodie silhouette
 *   'cap'    — cap with logo block
 *
 * `badge` is optional and renders the corner pill.
 */

export const MERCH_ITEMS = [
  {
    id: 'explorer-tee',
    name: 'Explorer Tee',
    collection: 'WanderCraft Original',
    price: '$34.99',
    style: 'tee',
    teeColor: '#1B4965',
    design: 'W',
    badge: { label: 'New', variant: 'new' },
  },
  {
    id: 'forest-hoodie',
    name: 'Forest Hoodie',
    collection: 'AtlasVoyager Collection',
    price: '$64.99',
    style: 'hoodie',
    teeColor: '#2F6F4F',
    design: 'WC',
    badge: { label: 'Featured', variant: 'featured' },
  },
  {
    id: 'sunset-cap',
    name: 'Sunset Cap',
    collection: 'ReefRunner Collection',
    price: '$29.99',
    style: 'cap',
    teeColor: '#FF8C42',
    design: '',
    badge: null,
  },
  {
    id: 'four-oceans-tee',
    name: 'Four Oceans Tee',
    collection: 'Environmental Collection',
    price: '$39.99',
    style: 'tee',
    teeColor: '#4CAF7D',
    design: '4O',
    badge: { label: 'Eco', variant: 'eco' },
  },
];
