/**
 * Tiny DOM helpers. Kept dependency-free so they can be unit-tested
 * with JSDOM and reused across modules.
 */

/**
 * Build an element from a tag, optional attribute map, and optional children.
 * Children can be strings (text), nodes, or nested arrays.
 *
 *   el('button', { class: 'btn', 'aria-label': 'Close' }, 'OK')
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value === true ? '' : value);
    }
  }

  appendChildren(node, children);
  return node;
}

function appendChildren(parent, children) {
  if (children == null || children === false) return;
  if (Array.isArray(children)) {
    children.forEach((c) => appendChildren(parent, c));
  } else if (typeof children === 'string' || typeof children === 'number') {
    parent.appendChild(document.createTextNode(String(children)));
  } else if (children instanceof Node) {
    parent.appendChild(children);
  }
}

/** Replace a node's children with new children — no innerHTML wipe footguns. */
export function replaceChildren(parent, ...children) {
  while (parent.firstChild) parent.removeChild(parent.firstChild);
  children.forEach((c) => appendChildren(parent, c));
}

/** Read a CSS variable from :root (or any element). */
export function readCssVar(name, root = document.documentElement) {
  return getComputedStyle(root).getPropertyValue(name).trim();
}

/** Single-line check: does the user prefer reduced motion? */
export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
