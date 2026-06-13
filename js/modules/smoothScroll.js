/**
 * Smooth-scroll for in-page anchors. Respects prefers-reduced-motion: under
 * that setting we just jump (which is what the OS-level reduced-motion API
 * actually wants anyway).
 */

import { prefersReducedMotion } from '../utils/dom.js';

export function initSmoothScroll() {
  const anchors = document.querySelectorAll('a[href^="#"]');
  anchors.forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  });
}
