/**
 * One masonry tile in the fan-art gallery.
 *
 * Two render modes:
 *   - `item.image` set → render an <img> with the colored placeholder
 *     behind it. If the image fails to load (404, broken path), the
 *     onerror handler hides the <img> so the placeholder shows through
 *     instead of a broken-image icon.
 *   - no image → just the gradient placeholder block.
 *
 * Either way the height comes from `item.height`, so the masonry layout
 * doesn't depend on the image actually loading.
 */

import { ICONS } from './icons.js';

export function fanArtItemHTML(item) {
  const hasImage = !!item.image;

  // Inline <img> only renders when we have a path. If it errors we hide
  // the img and the colored placeholder underneath stays visible.
  const imageMarkup = hasImage
    ? `<img class="fanart-image"
           src="${item.image}"
           alt="${escapeAttr(item.title)} by ${escapeAttr(item.artist)}"
           loading="lazy"
           onerror="this.style.display='none'">`
    : '';

  return `
    <div class="fanart-item reveal"
         data-id="${item.id}"
         data-type="${item.type}"
         data-likes="${item.likes}">
      <div class="fanart-placeholder"
           style="height: ${item.height}px;
                  background: linear-gradient(135deg, ${item.color}33, ${item.color}11);
                  border: 1px solid ${item.color}44;">
        <div class="fanart-placeholder-block" style="background: ${item.color}"></div>
        ${imageMarkup}
        <button type="button"
                class="fanart-likes"
                data-id="${item.id}"
                data-base-likes="${item.likes}"
                aria-pressed="false"
                aria-label="Like ${escapeAttr(item.title)} by ${escapeAttr(item.artist)}">
          ${ICONS.heart(14)}
          <span class="fanart-like-count">${item.likes.toLocaleString()}</span>
        </button>
      </div>
      <div class="fanart-overlay">
        <h4>${item.title}</h4>
        <p>by ${item.artist}</p>
      </div>
    </div>
  `;
}

/** Tiny HTML-attribute escape so titles with quotes don't break the markup. */
function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
