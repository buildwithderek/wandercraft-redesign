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
 *   likes   starting like count (visitors can +1 from the heart; their like is
 *           remembered per-browser in localStorage — there's no shared backend)
 *   height  tile height in px (masonry layout)
 *   color   placeholder gradient shown until the image loads / if it 404s
 *   image   path under assets/fanArt/ (capital A)
 *
 * NOTE: zuottz_sketch.png and sixty_seven.png are not in the repo yet — drop
 * those two files into assets/fanArt/ and they'll replace the placeholders.
 */

export const FAN_ART_ITEMS = [
  { id: 'sensei-talon',       title: 'SenseiTalon — Awakening',   artist: 'Pavisian', type: 'artwork',     likes: 24, height: 320, color: '#8B2D8C', image: 'assets/fanArt/fan_art3.png' },
  { id: 'wandercraft-roster', title: 'WanderCraft Roster',        artist: 'Community', type: 'artwork',    likes: 31, height: 300, color: '#A8D5BA', image: 'assets/fanArt/fan_art2.png' },
  { id: 'zuottz-sketch',      title: 'zuottz',                    artist: 'Charlie',  type: 'artwork',     likes: 12, height: 360, color: '#5B6B4A', image: 'assets/fanArt/zuottz_sketch.png' },
  { id: 'sixty-seven',        title: '67',                        artist: 'Wanderers', type: 'screenshots', likes: 18, height: 280, color: '#C0392B', image: 'assets/fanArt/sixty_seven.png' },
];
