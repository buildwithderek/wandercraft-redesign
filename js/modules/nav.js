/**
 * Top navigation: scroll-state styling, mobile toggle, active-link highlight.
 */

import { NAV_LINKS } from '../data/nav.js';

const SCROLL_SHRINK_THRESHOLD = 50;       // px scrolled before nav shrinks
const ACTIVE_SECTION_OFFSET = 200;        // top offset for "current section"

export function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const linksContainer = document.getElementById('navLinks');
  if (!nav || !toggle || !linksContainer) return;

  const navAnchors = linksContainer.querySelectorAll('.nav-link');

  // 1. Scroll behavior — shrink nav, update active link.
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > SCROLL_SHRINK_THRESHOLD);
    updateActiveSection(navAnchors);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // 2. Mobile menu toggle, with proper aria state.
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'navLinks');
  toggle.addEventListener('click', () => {
    const isOpen = linksContainer.classList.toggle('open');
    toggle.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // 3. Clicking a link closes the mobile menu.
  navAnchors.forEach((link) => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      linksContainer.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Initial state on load (handles refreshes mid-page).
  onScroll();
}

function updateActiveSection(anchors) {
  let bestId = null;
  let bestTop = -Infinity;
  const offset = ACTIVE_SECTION_OFFSET;

  for (const { id } of NAV_LINKS) {
    const section = document.getElementById(id);
    if (section) {
      const top = section.getBoundingClientRect().top;
      // Consider sections that are above or at the offset
      if (top <= offset && top > bestTop) {
        bestTop = top;
        bestId = id;
      }
    }
  }

  // Fallback to the first section if none match (e.g., at very top)
  if (bestId === null) {
    bestId = NAV_LINKS[0].id;
  }

  anchors.forEach((a) => {
    a.classList.toggle('active', a.getAttribute('href') === `#${bestId}`);
  });
}
