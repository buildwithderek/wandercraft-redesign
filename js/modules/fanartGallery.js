/**
 * Fan-art gallery: renders the top 4 featured pieces and lets visitors like them.
 *
 * Likes have no backend — a visitor's like is remembered per-browser in
 * localStorage, so the count is "starting likes + 1 if you've liked it." It
 * persists across reloads on the same device but isn't shared between users.
 *
 * The "Upload Art" CTA is a plain link to the WanderCraft Discord (see
 * index.html), so there's no JS to wire for it here.
 */

import { FAN_ART_ITEMS } from '../data/fanart.js';
import { fanArtItemHTML } from '../components/fanartItem.js';
import { observeNewElements } from './scrollReveal.js';

/** Only the first N items render — keeps the gallery a curated showcase. */
const TOP_N = 4;

/**
 * localStorage key holding the map of { [itemId]: true } the visitor has liked.
 * Bump the version suffix to wipe everyone's likes back to zero on next load.
 */
const LIKES_KEY = 'wc:fanart:liked:v2';

export function initFanArtGallery() {
  const grid = document.getElementById('fanartGrid');
  if (!grid) return;

  render(grid);
  hydrateLikes(grid);
  grid.addEventListener('click', onLikeClick);
}

/**
 * Kept as a pure helper (filters by type) even though the gallery no longer
 * shows filter chips — it's covered by tests and handy if filtering returns.
 */
export function applyFanArtFilter(items, filter) {
  if (filter === 'all') return items;
  return items.filter((item) => item.type === filter);
}

function render(grid) {
  const visible = FAN_ART_ITEMS.slice(0, TOP_N);
  grid.innerHTML = visible.map(fanArtItemHTML).join('');
  observeNewElements(grid.querySelectorAll('.fanart-item'));
}

/* ---------- likes ---------- */

function readLiked() {
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY)) || {};
  } catch {
    return {};
  }
}

function writeLiked(map) {
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify(map));
  } catch {
    /* storage disabled (private mode) — likes just won't persist this session. */
  }
}

/** Paint the saved liked-state onto each tile after first render. */
function hydrateLikes(grid) {
  const liked = readLiked();
  grid.querySelectorAll('.fanart-likes').forEach((btn) => {
    setLikeState(btn, !!liked[btn.dataset.id]);
  });
}

function onLikeClick(e) {
  const btn = e.target.closest('.fanart-likes');
  if (!btn) return;
  const liked = readLiked();
  const isNowLiked = !liked[btn.dataset.id];

  if (isNowLiked) liked[btn.dataset.id] = true;
  else delete liked[btn.dataset.id];
  writeLiked(liked);

  setLikeState(btn, isNowLiked);
  // Retrigger the pop animation.
  btn.classList.remove('pop');
  void btn.offsetWidth;
  if (isNowLiked) btn.classList.add('pop');
}

function setLikeState(btn, isLiked) {
  const base = Number(btn.dataset.baseLikes) || 0;
  const count = base + (isLiked ? 1 : 0);
  btn.classList.toggle('is-liked', isLiked);
  btn.setAttribute('aria-pressed', String(isLiked));
  const countEl = btn.querySelector('.fanart-like-count');
  if (countEl) countEl.textContent = count.toLocaleString();
}
