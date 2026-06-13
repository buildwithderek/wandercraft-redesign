/**
 * Merch grid renderer + Shop Now / Visit Full Store handlers.
 *
 * Until the real Fourthwall storefront ships, every CTA opens a contact modal
 * pre-filled with the product name. That keeps the buttons functional today
 * without faking a checkout flow.
 */

import { MERCH_ITEMS } from '../data/merch.js';
import { merchCardHTML } from '../components/merchCard.js';
import { STORE_LINKS, CONTACT_EMAIL } from '../data/links.js';
import { openContactInfo } from '../components/modal.js';

export function initMerch() {
  const grid = document.querySelector('.merch-grid');
  if (grid) {
    grid.innerHTML = MERCH_ITEMS.map(merchCardHTML).join('');
    grid.addEventListener('click', onShopClick);
  }

  const fullStoreBtn = document.querySelector('.merch-fourthwall .btn');
  if (fullStoreBtn) {
    fullStoreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openContactInfo({
        title: 'WanderCraft Full Store',
        lead: `Our Fourthwall storefront is launching soon. In the meantime,
               drop us a note and we'll let you know the moment it's live.`,
        mailtoHref: STORE_LINKS.fullStore,
        primaryLabel: `Email ${CONTACT_EMAIL}`,
      });
    });
  }
}

function onShopClick(e) {
  const btn = e.target.closest('[data-shop-product]');
  if (!btn) return;
  const productName = btn.dataset.shopProduct;
  openContactInfo({
    title: `${productName}`,
    lead: `Check out our shop.`,
    mailtoHref: STORE_LINKS.shopProduct(productName),
    primaryLabel: `WanderCraft Shop`,
  });
}
