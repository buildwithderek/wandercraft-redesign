/**
 * Tracks the cursor over .btn elements and exposes its position as CSS
 * variables, which style.css consumes for a radial-gradient hover glow.
 *
 * Uses event delegation on document instead of attaching a listener to every
 * button, so dynamically inserted buttons (e.g. shop CTAs rendered after
 * load) get the effect for free.
 */
export function initButtonGlow() {
  document.addEventListener('mousemove', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
    btn.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
  });
}
