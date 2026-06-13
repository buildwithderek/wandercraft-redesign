/**
 * Adds a `.visible` class to elements as they scroll into view, so CSS can
 * play a fade/slide. One observer covers every revealable element on the page.
 */

const REVEAL_SELECTORS =
  '.creator-card, .merch-card, .section-header, .about-block, .fanart-item';

const REVEAL_THRESHOLD = 0.1;
const REVEAL_ROOT_MARGIN = '0px 0px -50px 0px';

export function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: just show everything immediately.
    document.querySelectorAll(REVEAL_SELECTORS).forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);  // one-shot reveal
        }
      });
    },
    { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN },
  );

  document.querySelectorAll(REVEAL_SELECTORS).forEach((el) => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

/** Called after dynamically inserted content (e.g., Load More) so new nodes get the same treatment. */
export function observeNewElements(nodeList) {
  if (!('IntersectionObserver' in window)) {
    nodeList.forEach((el) => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN },
  );
  nodeList.forEach((el) => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}
