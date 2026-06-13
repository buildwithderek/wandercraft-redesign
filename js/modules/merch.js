/**
 * Merch grid renderer.
 *
 * Cards are real anchors to live product pages on shopwandercraft.com (wired in
 * components/merchCard.js), and the "Visit Full Store" CTA in index.html is a
 * plain link to the store home. So this module's only job is to paint the grid.
 */

import { MERCH_ITEMS } from '../data/merch.js';
import { merchCardHTML } from '../components/merchCard.js';

export function initMerch() {
  const grid = document.querySelector('.merch-grid');
  if (!grid) return;
  grid.innerHTML = MERCH_ITEMS.map(merchCardHTML).join('');
}
