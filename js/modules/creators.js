/**
 * Renders the creators grid as a multi-platform live-status dashboard.
 *
 * Three layers stack on top of the cards:
 *   1. A header showing how many creators are currently live across any
 *      platform — updates in real time as the poller flips them.
 *   2. A filter bar (All / Live now / Twitch / YouTube / TikTok) that hides
 *      cards not matching the active filter.
 *   3. The cards themselves, with one platform pill per channel a creator
 *      has. Pills get `.is-live` when the poller reports them live, which
 *      triggers the pulsing LIVE indicator and swaps the link to the
 *      platform's /live URL.
 */

import { CREATORS } from '../data/creators.js';
import {
  creatorCardHTML,
  initializeSkinHoverEffects,
  setupSkinLoaders,
} from '../components/creatorCard.js';
import { observeNewElements } from './scrollReveal.js';
import * as liveStatus from './liveStatus.js';

/** Filter bar options. */
const FILTERS = [
  { id: 'all',     label: 'All' },
  { id: 'live',    label: 'Live Now' },
  { id: 'twitch',  label: 'Twitch'  },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok',  label: 'TikTok'  },
];

/** Field on a creator object holding the handle for a given platform. */
const HANDLE_FIELD = {
  twitch:  'twitchUsername',
  youtube: 'youtubeHandle',
  tiktok:  'tiktokHandle',
};

let activeFilter = 'all';

export function initCreators() {
  const section = document.getElementById('creators');
  const grid = section && section.querySelector('.creators-grid');
  if (!grid) return;

  injectDashboardHeader(section);
  injectFilterBar(section, grid);

  grid.innerHTML = CREATORS.map(creatorCardHTML).join('');
  const cards = grid.querySelectorAll('.creator-v2-card');
  observeNewElements(cards);

  const teardownLoaders = setupSkinLoaders(grid);
  initializeSkinHoverEffects(grid);

  // Start polling. Built-in Twitch provider runs against decapi.me; YouTube
  // and TikTok use the noop providers until a Worker is wired in.
  liveStatus.start(CREATORS);

  // React to per-(creator, platform) transitions.
  const unsub = liveStatus.subscribe((creatorId, platform, snap) => {
    const pill = grid.querySelector(
      `.platform-pill[data-platform="${platform}"][data-live-for="${creatorId}"]`,
    );
    if (pill) {
      const target = snap.isLive
        ? pill.dataset.liveHref
        : pill.dataset.profileHref;
      if (target) pill.href = target;
      pill.classList.toggle('is-live', snap.isLive);
    }
    updateCardLiveFlag(grid, creatorId);
    updateLiveCount();
    applyFilter(grid);
  });

  // Initial header/filter render with whatever the cache reports right now.
  updateLiveCount();
  applyFilter(grid);

  window.addEventListener('beforeunload', () => {
    unsub();
    teardownLoaders();
    liveStatus.stop();
  });
}

/* ============================================================
   Dashboard chrome
   ============================================================ */

function injectDashboardHeader(section) {
  if (!section || section.querySelector('.creator-dashboard-meta')) return;
  const header = section.querySelector('.section-header');
  if (!header) return;
  const meta = document.createElement('p');
  meta.className = 'creator-dashboard-meta';
  meta.innerHTML = `
    <span class="creator-live-pulse" aria-hidden="true"></span>
    <span class="creator-live-count" data-live-count="0">0</span> live now
    <span class="creator-live-divider" aria-hidden="true">·</span>
    <span>${CREATORS.length} creators</span>
  `;
  header.appendChild(meta);
}

function injectFilterBar(section, grid) {
  if (!section || section.querySelector('.creator-filter-bar')) return;
  const bar = document.createElement('div');
  bar.className = 'creator-filter-bar';
  bar.setAttribute('role', 'tablist');
  bar.innerHTML = FILTERS.map(
    (f) => `
      <button type="button"
              role="tab"
              class="creator-filter-btn ${f.id === activeFilter ? 'is-active' : ''}"
              data-filter="${f.id}"
              aria-selected="${f.id === activeFilter}">${f.label}</button>
    `,
  ).join('');

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.creator-filter-btn');
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    bar.querySelectorAll('.creator-filter-btn').forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
    });
    applyFilter(grid);
  });

  // Insert the bar between the section-header and the grid so it sits
  // above the cards but below the title — typical dashboard layout.
  grid.parentElement.insertBefore(bar, grid);
}

/* ============================================================
   State → DOM sync
   ============================================================ */

/** Add `.creator-v2-card--live` whenever the creator is live on any platform. */
function updateCardLiveFlag(grid, creatorId) {
  const card = grid.querySelector(`.creator-v2-card[data-creator="${creatorId}"]`);
  if (!card) return;
  card.classList.toggle('creator-v2-card--live', liveStatus.anyLiveFor(creatorId));
}

/** Recompute the "N live now" counter. */
function updateLiveCount() {
  const node = document.querySelector('.creator-live-count');
  if (!node) return;
  const count = CREATORS.filter((c) => liveStatus.anyLiveFor(c.id)).length;
  node.textContent = String(count);
  node.dataset.liveCount = String(count);
  document.querySelector('.creator-dashboard-meta')
    ?.classList.toggle('has-live', count > 0);
}

/** Apply the active filter — hide cards that don't match. */
function applyFilter(grid) {
  const cards = grid.querySelectorAll('.creator-v2-card');
  for (const card of cards) {
    const id = card.dataset.creator;
    const show = cardMatchesFilter(id);
    card.toggleAttribute('hidden', !show);
  }
}

function cardMatchesFilter(creatorId) {
  if (activeFilter === 'all') return true;
  if (activeFilter === 'live') return liveStatus.anyLiveFor(creatorId);

  // Platform filters — show only creators with a handle on that platform.
  const platform = activeFilter;
  const creator = CREATORS.find((c) => c.id === creatorId);
  return !!(creator && creator[HANDLE_FIELD[platform]]);
}
