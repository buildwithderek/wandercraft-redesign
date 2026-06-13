/**
 * One merch card. The whole card is an anchor to the live product page on
 * shopwandercraft.com (opens in a new tab), so there's no JS click handling —
 * it's a real link. The "Shop Now" pill is a styled span, not a nested anchor
 * (nesting <a> inside <a> is invalid HTML).
 */

export function merchCardHTML(item) {
  const badgeMarkup = item.badge
    ? `<span class="merch-badge ${item.badge.variant}">${item.badge.label}</span>`
    : '';

  return `
    <a class="merch-card" href="${item.url}" target="_blank" rel="noopener noreferrer"
       data-id="${item.id}" aria-label="${item.name} — ${item.price}, shop on WanderCraft store">
      <div class="merch-image">
        <img class="merch-photo" src="${item.image}" alt="${item.name}"
             loading="lazy" referrerpolicy="no-referrer">
        ${badgeMarkup}
      </div>
      <div class="merch-info">
        <p class="merch-category">${item.category}</p>
        <h3 class="merch-name">${item.name}</h3>
        <div class="merch-footer">
          <span class="merch-price">${item.price}</span>
          <span class="merch-shop">Shop Now <span aria-hidden="true">→</span></span>
        </div>
      </div>
    </a>
  `;
}
