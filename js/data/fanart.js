/**
 * Fan-art gallery — the top 4 featured pieces.
 *
 * The gallery renders only the first 4 items here (see modules/fanartGallery.js),
 * so this is an ordered "featured" list: put the piece you want first, first.
 *
 * Fields:
 *   id      stable key (also the localStorage key suffix for likes)
 *   title   shown in the hover overlay
 *   artist  credited below the title
 *   type    'artwork' | 'pixel' | 'builds' | 'screenshots'
 *   likes   starting like count — kept at 0 so the number only goes up when a
 *           real visitor taps the heart. Each browser can add one like, and it's
 *           remembered locally (localStorage); there's no shared backend, so the
 *           count isn't aggregated across different people/devices.
 *   height  tile height in px (masonry layout)
 *   color   placeholder gradient shown until the image loads / if it 404s
 *   image   path under assets/fanArt/ (capital A)
 */

export const FAN_ART_ITEMS = [
  { id: 'sensei-talon',  title: 'Besties', artist: 'Community',  type: 'artwork',     likes: 0, height: 320, color: '#8B2D8C', image: 'assets/fanArt/fanart1.png' },
  { id: 'chibi-roster',  title: 'WanderCraft Roster',      artist: 'Community',  type: 'artwork',     likes: 0, height: 300, color: '#A8D5BA', image: 'assets/fanArt/fan_art2.png' },
  { id: 'the-wanderers', title: 'The Wanderers',           artist: 'Community',  type: 'artwork',     likes: 0, height: 240, color: '#C9D4E3', image: 'assets/fanArt/the_wanderers.png' },
  { id: 'sixty-seven',   title: '67',                      artist: 'Wanderers',  type: 'screenshots', likes: 0, height: 280, color: '#C0392B', image: 'assets/fanArt/sixty_seven.gif' },
];
