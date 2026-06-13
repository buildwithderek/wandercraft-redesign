/**
 * Builds the footer's "Connect" column from links.js so external URLs
 * stay in one place. The other columns are static section anchors and
 * remain in HTML.
 */

import { COMMUNITY_LINKS, CONTACT_EMAIL, mailto } from '../data/links.js';

export function initFooter() {
  const connectColumn = document.querySelector('.footer-col[data-col="connect"]');
  if (!connectColumn) return;

  connectColumn.innerHTML = `
    <h4>Connect</h4>
    <a href="${COMMUNITY_LINKS.discord}" target="_blank" rel="noopener noreferrer">Discord</a>
    <a href="${COMMUNITY_LINKS.twitter}" target="_blank" rel="noopener noreferrer">Twitter</a>
    <a href="${COMMUNITY_LINKS.youtube}" target="_blank" rel="noopener noreferrer">YouTube</a>
    <a href="${mailto('WanderCraft — hello')}">Contact</a>
  `;

  // Also ensure the copyright contact is wired.
  const contactNode = document.querySelector('.footer-bottom .footer-contact');
  if (contactNode) {
    contactNode.innerHTML = `Reach us: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`;
  }
}
