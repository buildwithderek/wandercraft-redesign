/**
 * Fan-art gallery: render + filter against an in-memory state, plus
 * the upload CTA which opens the contact modal.
 */

import { FAN_ART_ITEMS, FAN_ART_FILTERS } from '../data/fanart.js';
import { fanArtItemHTML } from '../components/fanartItem.js';
import { observeNewElements } from './scrollReveal.js';
import { openContactInfo } from '../components/modal.js';
import { UPLOAD_LINKS, CONTACT_EMAIL } from '../data/links.js';

const state = { filter: 'all' };

export function initFanArtGallery() {
  const grid = document.getElementById('fanartGrid');
  if (!grid) return;

  renderFilterBar();
  render(grid);
  bindUploadButton();
}

export function applyFanArtFilter(items, filter) {
  if (filter === 'all') return items;
  return items.filter((item) => item.type === filter);
}

function render(grid) {
  const visible = applyFanArtFilter(FAN_ART_ITEMS, state.filter);
  grid.innerHTML = visible.map(fanArtItemHTML).join('');
  observeNewElements(grid.querySelectorAll('.fanart-item'));
}

function renderFilterBar() {
  const bar = document.querySelector('.fanart-filters');
  if (!bar) return;
  bar.setAttribute('role', 'tablist');
  bar.innerHTML = FAN_ART_FILTERS.map(
    (f) => `
      <button
        type="button"
        role="tab"
        class="filter-btn ${f.value === state.filter ? 'active' : ''}"
        data-filter="${f.value}"
        aria-selected="${f.value === state.filter}">${f.label}</button>
    `,
  ).join('');

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    state.filter = btn.dataset.filter;
    bar.querySelectorAll('.filter-btn').forEach((b) => {
      const active = b === btn;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });
    const grid = document.getElementById('fanartGrid');
    if (grid) render(grid);
  });
}

function bindUploadButton() {
  const btn = document.querySelector('.fanart-upload .btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    openContactInfo({
      title: 'Share Your Creation',
      lead: `We'd love to feature your artwork, pixel art, screenshots, or builds.
             Send a few images and a short description — include your handle
             and which creator(s) inspired the piece.`,
      mailtoHref: UPLOAD_LINKS.fanArt,
      primaryLabel: `Email playwandercraft@gmail.com`,
    });
  });
}
