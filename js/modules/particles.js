/**
 * Floating-particle background. Skipped entirely under prefers-reduced-motion.
 */

import { prefersReducedMotion } from '../utils/dom.js';

const PARTICLE_COUNT = 20;
const MIN_DURATION_S = 12;
const MAX_DURATION_S = 32;
const MIN_SCALE = 0.5;
const MAX_SCALE = 1.5;

export function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  if (prefersReducedMotion()) return;

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    const duration = MIN_DURATION_S + Math.random() * (MAX_DURATION_S - MIN_DURATION_S);
    p.style.animationDuration = `${duration}s`;
    p.style.animationDelay = `${-(Math.random() * MAX_DURATION_S)}s`;
    p.style.transform = `scale(${MIN_SCALE + Math.random() * (MAX_SCALE - MIN_SCALE)})`;
    fragment.appendChild(p);
  }
  container.appendChild(fragment);
}
