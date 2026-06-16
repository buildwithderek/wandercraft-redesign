/**
 * Content dashboard items. Each entry renders one card in the "Latest Adventures"
 * grid and is filterable by `type` and sortable by views or creator.
 *
 * `type` must be one of: 'videos' | 'shorts' | 'streams' | 'bts'
 * (see CONTENT_FILTERS). `views` is the human string we display; the sort
 * function in modules/filters.js parses it via parseViews().
 *
 * The first INITIAL_VISIBLE_COUNT items render immediately. The rest are queued
 * and revealed by the Load More button — that's why this is one flat array
 * rather than two; the queue is purely a render-time concern.
 */

export const CONTENT_ITEMS = [
  {
    id: 'arctic-100-days',
    title: 'Surviving 100 Days in Arctic Iceland',
    creator: 'AtlasVoyager',
    type: 'videos',
    views: '2.1M views',
    date: '3 days ago',
    duration: '42:18',
    color: '#1B4965',
  },
  {
    id: 'temple-build',
    title: 'Building a Japanese Temple in Survival',
    creator: 'LunaTerraforms',
    type: 'videos',
    views: '1.4M views',
    date: '1 week ago',
    duration: '28:45',
    color: '#2F6F4F',
  },
  {
    id: 'cave-discovery',
    title: 'Underwater Cave Discovery!',
    creator: 'ReefRunner',
    type: 'shorts',
    views: '5.8M views',
    date: '2 days ago',
    duration: '0:59',
    color: '#4CAF7D',
  },
  {
    id: 'mountain-marathon',
    title: 'LIVE: Mountain Base Building Marathon',
    creator: 'SummitSeeker',
    type: 'streams',
    views: '84K watching',
    date: 'Live now',
    duration: 'LIVE',
    color: '#ef4444',
  },
  {
    id: 'remote-filming',
    title: 'How We Film in Remote Locations',
    creator: 'AtlasVoyager',
    type: 'bts',
    views: '890K views',
    date: '5 days ago',
    duration: '18:32',
    color: '#FF8C42',
  },
  {
    id: 'speed-treehouse',
    title: 'Speed Building a Treehouse',
    creator: 'LunaTerraforms',
    type: 'shorts',
    views: '3.2M views',
    date: '4 days ago',
    duration: '0:45',
    color: '#2F6F4F',
  },
  {
    id: 'reef-doc',
    title: 'The Great Barrier Reef — A Voxel Documentary',
    creator: 'ReefRunner',
    type: 'videos',
    views: '4.7M views',
    date: '2 weeks ago',
    duration: '1:12:04',
    color: '#1B4965',
  },
  {
    id: 'summit-day-1',
    title: 'Summit to Sea Challenge — Day 1',
    creator: 'SummitSeeker',
    type: 'videos',
    views: '1.9M views',
    date: '1 week ago',
    duration: '35:22',
    color: '#FF8C42',
  },
  {
    id: 'base-camp',
    title: 'Setting Up Camp at Base Camp',
    creator: 'SummitSeeker',
    type: 'bts',
    views: '420K views',
    date: '3 days ago',
    duration: '12:10',
    color: '#D9C3A5',
  },
  // Below this line: items revealed by Load More.
  {
    id: 'volcano-expedition',
    title: 'Volcano Expedition — Lava Camera Survives',
    creator: 'AtlasVoyager',
    type: 'videos',
    views: '1.2M views',
    date: '2 weeks ago',
    duration: '24:08',
    color: '#FF8C42',
  },
  {
    id: 'kyoto-shrine-short',
    title: 'A Shrine I Found in 60 Seconds',
    creator: 'LunaTerraforms',
    type: 'shorts',
    views: '2.6M views',
    date: '6 days ago',
    duration: '0:58',
    color: '#4CAF7D',
  },
  {
    id: 'reef-livestream',
    title: 'LIVE: Reef Cleanup Marathon',
    creator: 'ReefRunner',
    type: 'streams',
    views: '12K watching',
    date: 'Live now',
    duration: 'LIVE',
    color: '#1B4965',
  },
  {
    id: 'patagonia-storm-bts',
    title: 'How We Filmed Through a Patagonia Storm',
    creator: 'SummitSeeker',
    type: 'bts',
    views: '230K views',
    date: '4 days ago',
    duration: '14:55',
    color: '#D9C3A5',
  },
];

/** Number of items rendered before Load More is clicked. */
export const INITIAL_VISIBLE_COUNT = 9;

/** Filter buttons in the content section. value matches CONTENT_ITEMS[].type. */
export const CONTENT_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'videos', label: 'Videos' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'streams', label: 'Streams' },
];

/** Sort options shown in the dropdown. */
export const CONTENT_SORTS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'creator', label: 'Creator' },
];

/** Map content type → CSS badge class & display label. */
export const CONTENT_BADGES = {
  videos: { className: 'badge-video', label: 'Video' },
  shorts: { className: 'badge-short', label: 'Short' },
  streams: { className: 'badge-stream', label: 'Stream' },
  bts: { className: 'badge-bts', label: 'BTS' },
};
