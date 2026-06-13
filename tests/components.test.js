import { describe, test, expect } from 'vitest';
import { creatorCardHTML } from '../js/components/creatorCard.js';
import { contentCardHTML } from '../js/components/contentCard.js';
import { fanArtItemHTML } from '../js/components/fanartItem.js';
import { merchCardHTML } from '../js/components/merchCard.js';

/** Parse an HTML string into a DocumentFragment so we can query it. */
function parse(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content;
}

describe('creatorCardHTML (playwandercraft layout)', () => {
  const creator = {
    id: 'senseitalon',
    name: 'SenseiTalon',
    role: 'FOUNDER',
    mcUsername: 'SenseiTalon',
    twitchUsername: 'senseitalon',
  };

  test('renders the creator name as a heading', () => {
    const frag = parse(creatorCardHTML(creator));
    expect(frag.querySelector('h2').textContent.trim()).toBe('SenseiTalon');
  });

  test('renders the role in upper-case under the name', () => {
    const frag = parse(creatorCardHTML(creator));
    expect(frag.querySelector('.creator-v2-role').textContent).toBe('FOUNDER');
  });

  test('applies the matching role variant class for styling', () => {
    const founder = parse(creatorCardHTML(creator));
    expect(founder.querySelector('.creator-v2-role--founder')).toBeTruthy();

    const admin = parse(creatorCardHTML({ ...creator, role: 'HEAD ADMIN' }));
    expect(admin.querySelector('.creator-v2-role--head-admin')).toBeTruthy();

    const wanderer = parse(creatorCardHTML({ ...creator, role: 'CREATIVE WANDERER' }));
    expect(wanderer.querySelector('.creator-v2-role--creative')).toBeTruthy();
  });

  test('embeds the Minecraft skin URL from starlightskins', () => {
    const frag = parse(creatorCardHTML(creator));
    const img = frag.querySelector('img');
    expect(img.getAttribute('src')).toContain('starlightskins.lunareclipse.studio');
    expect(img.getAttribute('src')).toContain('SenseiTalon');
  });

  test('image has a fallback URL wired via onerror', () => {
    const frag = parse(creatorCardHTML(creator));
    const img = frag.querySelector('img');
    expect(img.getAttribute('onerror')).toContain('mc-heads.net');
  });

  test('image uses lazy loading', () => {
    const frag = parse(creatorCardHTML(creator));
    expect(frag.querySelector('img').getAttribute('loading')).toBe('lazy');
  });

  test('renders a hidden LIVE badge when twitchUsername is set', () => {
    const frag = parse(creatorCardHTML(creator));
    const badge = frag.querySelector('.creator-v2-live');
    expect(badge).toBeTruthy();
    expect(badge.hasAttribute('hidden')).toBe(true);
    expect(badge.getAttribute('href')).toBe('https://www.twitch.tv/senseitalon');
  });

  test('omits the LIVE badge entirely when twitchUsername is missing', () => {
    const frag = parse(creatorCardHTML({ ...creator, twitchUsername: null }));
    expect(frag.querySelector('.creator-v2-live')).toBeFalsy();
  });

  test('exposes data-creator for DOM lookups by id', () => {
    const frag = parse(creatorCardHTML(creator));
    expect(frag.querySelector('.creator-v2-card').dataset.creator).toBe('senseitalon');
  });
});

describe('contentCardHTML', () => {
  const item = {
    id: 'arctic-100',
    title: 'Surviving 100 Days',
    creator: 'AtlasVoyager',
    type: 'videos',
    views: '2.1M views',
    date: '3 days ago',
    duration: '42:18',
    color: '#1B4965',
  };

  test('renders title, creator, and views', () => {
    const frag = parse(contentCardHTML(item, 0));
    expect(frag.querySelector('h3').textContent).toBe('Surviving 100 Days');
    expect(frag.querySelector('.content-creator-name').textContent).toBe('AtlasVoyager');
    expect(frag.querySelector('.content-views-date').textContent).toContain('2.1M');
  });

  test('exposes the type as data-type for the filter to read', () => {
    const frag = parse(contentCardHTML(item, 0));
    expect(frag.querySelector('.content-card').dataset.type).toBe('videos');
  });

  test('staggers entry animation via animation-delay style', () => {
    const frag = parse(contentCardHTML(item, 4));
    expect(frag.querySelector('.content-card').getAttribute('style')).toContain('animation-delay: 0.32s');
  });

  test('renders the correct badge label for the content type', () => {
    const frag = parse(contentCardHTML(item, 0));
    expect(frag.querySelector('.content-badge').textContent).toBe('Video');

    const short = parse(contentCardHTML({ ...item, type: 'shorts' }, 0));
    expect(short.querySelector('.content-badge').textContent).toBe('Short');
  });
});

describe('fanArtItemHTML', () => {
  const item = { id: 'a', title: 'Sunset', artist: 'Pixel42', type: 'artwork', likes: 1234, height: 200, color: '#FF8C42' };

  test('renders title, artist, and like count formatted with commas', () => {
    const frag = parse(fanArtItemHTML(item));
    expect(frag.querySelector('h4').textContent).toBe('Sunset');
    expect(frag.querySelector('p').textContent).toBe('by Pixel42');
    expect(frag.querySelector('.fanart-likes').textContent).toContain('1,234');
  });

  test('exposes type as data-type for filtering', () => {
    const frag = parse(fanArtItemHTML(item));
    expect(frag.querySelector('.fanart-item').dataset.type).toBe('artwork');
  });
});

describe('merchCardHTML', () => {
  const base = {
    id: 'tee',
    name: 'Explorer Tee',
    category: 'T-Shirt',
    price: '$34.99',
    image: 'https://cdn.example.com/tee.jpg',
    url: 'https://shopwandercraft.com/products/explorer-tee',
    badge: null,
  };

  test('the whole card is a link to the live product page', () => {
    const frag = parse(merchCardHTML(base));
    const card = frag.querySelector('a.merch-card');
    expect(card).toBeTruthy();
    expect(card.getAttribute('href')).toBe('https://shopwandercraft.com/products/explorer-tee');
    expect(card.getAttribute('target')).toBe('_blank');
    expect(card.getAttribute('rel')).toBe('noopener noreferrer');
  });

  test('renders the product photo, name, category, and price', () => {
    const frag = parse(merchCardHTML(base));
    expect(frag.querySelector('.merch-photo').getAttribute('src')).toBe('https://cdn.example.com/tee.jpg');
    expect(frag.querySelector('.merch-photo').getAttribute('alt')).toBe('Explorer Tee');
    expect(frag.querySelector('.merch-name').textContent).toBe('Explorer Tee');
    expect(frag.querySelector('.merch-category').textContent).toBe('T-Shirt');
    expect(frag.querySelector('.merch-price').textContent).toBe('$34.99');
  });

  test('omits the badge when item.badge is null', () => {
    const frag = parse(merchCardHTML(base));
    expect(frag.querySelector('.merch-badge')).toBeFalsy();
  });

  test('renders the badge with its variant class when present', () => {
    const frag = parse(merchCardHTML({ ...base, badge: { label: 'New', variant: 'new' } }));
    const badge = frag.querySelector('.merch-badge');
    expect(badge).toBeTruthy();
    expect(badge.classList.contains('new')).toBe(true);
    expect(badge.textContent).toBe('New');
  });
});
