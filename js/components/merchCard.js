/**
 * One merch card. The Shop Now CTA is wired in modules/merch.js to either:
 *   - jump straight to the real Fourthwall product URL when present, or
 *   - open the contact modal pre-filled with the product name (today's path,
 *     since the store isn't live yet).
 */

export function merchCardHTML(item) {
  const badgeMarkup = item.badge
    ? `<span class="merch-badge ${item.badge.variant}">${item.badge.label}</span>`
    : '';

  return `
    <div class="merch-card" data-id="${item.id}">
      <div class="merch-image">
        <div class="voxel-mannequin">
          <div class="mannequin-body ${item.style}" style="--tee-color: ${item.teeColor}">
            ${item.design ? `<div class="tee-design">${item.design}</div>` : ''}
            ${item.style === 'cap' ? `<div class="tee-design cap-logo"></div>` : ''}
          </div>
        </div>
        ${badgeMarkup}
      </div>
      <div class="merch-info">
        <h3>${item.name}</h3>
        <p class="merch-creator">${item.collection}</p>
        <p class="merch-price">${item.price}</p>
        <button class="btn btn-small btn-primary"
                data-shop-product="${item.name}"
                aria-label="Shop ${item.name}">Shop Now</button>
      </div>
    </div>
  `;
}
