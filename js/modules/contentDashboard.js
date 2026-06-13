/**
 * The "Latest Adventures" content dashboard.
 *
 * Single source of truth: an in-memory `state` object. Filter and sort changes
 * mutate state, then we re-render. That fixes the original bug where toggling
 * a filter after sorting lost the sort (because the old code worked by
 * toggling display:none on already-rendered cards).
 *
 * Load More appends from a queue rather than fetching — the data is bundled,
 * the queue is just "items not yet rendered."
 */

import {
  CONTENT_ITEMS,
  CONTENT_FILTERS,
  CONTENT_SORTS,
  INITIAL_VISIBLE_COUNT,
} from '../data/content.js';
import { contentCardHTML } from '../components/contentCard.js';
import { parseViews } from '../utils/parseViews.js';
import { fetchLatestVideos } from './youtubeFeed.js';

/** How many additional items to reveal per Load More click. */
const LOAD_MORE_BATCH = 6;

/**
 * The dashboard's data source. Starts pointing at the static demo array.
 * If the Worker is configured and the fetch succeeds, this gets swapped
 * to the live videos and the grid re-renders. Static fallback means the
 * dashboard is never blank — even before the Worker is deployed.
 */
let items = CONTENT_ITEMS;

const state = {
  filter: 'all',
  sort: 'recent',
  visibleCount: INITIAL_VISIBLE_COUNT,
};

export function initContentDashboard() {
  const grid = document.getElementById('contentGrid');
  if (!grid) return;

  renderFilterBar();
  renderSortDropdown();
  render(grid);            // immediate static render
  bindLoadMore(grid);

  // Try the live source. If anything is missing (Worker not configured,
  // network down, no channel IDs filled in), fetchLatestVideos returns
  // null and we keep the static render.
  hydrateFromWorker(grid);
}

async function hydrateFromWorker(grid) {
  const live = await fetchLatestVideos();
  if (!live || live.length === 0) return;
  items = live;
  state.visibleCount = INITIAL_VISIBLE_COUNT;
  render(grid);
}

/* ---------- internal helpers ---------- */

/**
 * Apply the current filter, then sort. Pure: takes the full source list,
 * returns the displayed slice. Easy to unit-test.
 */
export function applyFilterAndSort(items, { filter, sort }) {
  const filtered = filter === 'all'
    ? items
    : items.filter((item) => item.type === filter);

  if (sort === 'popular') {
    return [...filtered].sort((a, b) => parseViews(b.views) - parseViews(a.views));
  }
  if (sort === 'creator') {
    return [...filtered].sort((a, b) => a.creator.localeCompare(b.creator));
  }
  // 'recent' = source order, which is already chronological-newest-first.
  return filtered;
}

function render(grid) {
  const visible = applyFilterAndSort(items, state).slice(0, state.visibleCount);
  grid.innerHTML = visible.map((item, i) => contentCardHTML(item, i)).join('');

  updateLoadMoreState();
}

function renderFilterBar() {
  const bar = document.querySelector('.content-filters');
  if (!bar) return;
  bar.setAttribute('role', 'tablist');
  bar.innerHTML = CONTENT_FILTERS.map(
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
    state.visibleCount = INITIAL_VISIBLE_COUNT;  // reset pagination on filter change
    bar.querySelectorAll('.filter-btn').forEach((b) => {
      const active = b === btn;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });
    const grid = document.getElementById('contentGrid');
    if (grid) render(grid);
  });
}

function renderSortDropdown() {
  const select = document.getElementById('contentSort');
  if (!select) return;
  select.innerHTML = CONTENT_SORTS.map(
    (s) => `<option value="${s.value}">${s.label}</option>`,
  ).join('');
  select.value = state.sort;

  select.addEventListener('change', () => {
    state.sort = select.value;
    const grid = document.getElementById('contentGrid');
    if (grid) render(grid);
  });
}

function bindLoadMore(grid) {
  const btn = document.getElementById('loadMore');
  if (!btn) return;

  btn.addEventListener('click', () => {
    state.visibleCount += LOAD_MORE_BATCH;
    btn.textContent = 'Loading...';
    btn.disabled = true;

    // Tiny delay so the loading state is visible — purely UX polish.
    setTimeout(() => {
      render(grid);
      btn.disabled = false;
      btn.textContent = 'Load More';
      updateLoadMoreState();
    }, 250);
  });
}

function updateLoadMoreState() {
  const btn = document.getElementById('loadMore');
  if (!btn) return;
  const total = applyFilterAndSort(items, state).length;
  if (state.visibleCount >= total) {
    btn.textContent = 'All caught up!';
    btn.disabled = true;
    btn.setAttribute('aria-disabled', 'true');
    btn.style.opacity = '0.5';
  } else {
    btn.disabled = false;
    btn.removeAttribute('aria-disabled');
    btn.style.opacity = '';
    btn.textContent = 'Load More';
  }
}
