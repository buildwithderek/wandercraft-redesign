/**
 * One creator card — playwandercraft.com/creators layout.
 *
 * Layout: full-body Minecraft skin render on top, name (H2), role in small
 * caps below, "Read Bio" link at the bottom. A 🔴 LIVE badge appears in the
 * top-right corner when the creator is streaming (driven by liveStatus.js).
 *
 * The skin URL is auto-generated from the creator's Minecraft username via
 * starlightskins.lunareclipse.studio. On hover, the image swaps to an
 * "emote" pose (Cheering, Wave, etc.) — the swap is wired by
 * initializeSkinHoverEffects(), which modules/creators.js calls after
 * rendering the grid.
 */

import { fullBodySkinUrl, fullBodyFallbackUrl } from '../utils/skinUrls.js';
import { ROLE_VARIANTS } from '../data/creators.js';
import {
  bioUrlFor,
  twitchUrlFor,
  youtubeUrlFor,
  youtubeLiveUrlFor,
  tiktokUrlFor,
  tiktokLiveUrlFor,
} from '../data/links.js';
import { SOCIAL_ICONS } from './icons.js';

/**
 * Map of friendly emote names → real Starlightskins pose names.
 *
 * Verified against the official RenderTypes list:
 *   https://github.com/rinckodev/starlightskinapi (the official wrapper)
 *
 * Valid poses are: default, marching, walking, crouching, crossed,
 * crisscross, cheering, relaxing, trudging, cowering, pointing, lunging,
 * dungeons, facepalm, sleeping, dead, archer, mojavatar, ultimate,
 * isometric, head, bitzel, pixel, ornament.
 *
 * Names not in that list (Jump, Wave, Dance, Kick, Run...) are mapped to
 * the closest real pose so the URL never 404s. Anything unmapped falls
 * through to `cheering` — a recognizable, animated hover default.
 */
const EMOTE_POSE_MAP = {
  // Direct matches (already valid pose names)
  cheering:    'cheering',
  pointing:    'pointing',
  crossed:     'crossed',
  crisscross:  'crisscross',
  walking:     'walking',
  marching:    'marching',
  trudging:    'trudging',
  cowering:    'cowering',
  crouching:   'crouching',
  lunging:     'lunging',
  facepalm:    'facepalm',
  sleeping:    'sleeping',
  archer:      'archer',
  relaxing:    'relaxing',
  ultimate:    'ultimate',
  default:     'default',

  // Friendly intent aliases → closest real pose
  wave:        'cheering',    // raised arm
  point:       'pointing',
  crossedarms: 'crossed',
  arms:        'crossed',
  dance:       'crisscross',  // most "dance-like" of the real poses
  dab:         'crisscross',
  jump:        'lunging',     // forward-leap, mid-air feel
  kick:        'lunging',
  lunge:       'lunging',
  relax:       'relaxing',
  sleep:       'sleeping',
  crouch:      'crouching',
  walk:        'walking',
  run:         'marching',    // no Running pose exists; Marching has motion
  running:     'marching',
  march:       'marching',
  standing:    'default',
};

function resolveHoverPose(emote) {
  if (!emote) return 'cheering';
  return EMOTE_POSE_MAP[String(emote).toLowerCase()] || 'cheering';
}

/**
 * Per-platform pill row shown in the top-right of each card image.
 *
 * Each pill is a link to the creator's channel on that platform. While
 * the creator is offline the pill is muted/subtle; when liveStatus reports
 * them live, modules/creators.js adds `.is-live`, which switches the link
 * to the platform's /live URL and unhides the LIVE dot.
 *
 * Hooks for the dashboard layer:
 *   data-platform="twitch|youtube|tiktok"
 *   data-live-for="<creatorId>"
 *
 * Only platforms with a handle on this creator are rendered. A creator
 * with only a Twitch handle gets one pill; a creator on all three gets
 * three pills.
 */
function renderPlatformPills(creator) {
  const entries = [
    {
      key: 'twitch',
      handle: creator.twitchUsername,
      profileHref: creator.twitchUsername && twitchUrlFor(creator.twitchUsername),
      liveHref: creator.twitchUsername && twitchUrlFor(creator.twitchUsername),
    },
    {
      key: 'youtube',
      handle: creator.youtubeHandle,
      profileHref: creator.youtubeHandle && youtubeUrlFor(creator.youtubeHandle),
      liveHref: creator.youtubeHandle && youtubeLiveUrlFor(creator.youtubeHandle),
    },
    {
      key: 'tiktok',
      handle: creator.tiktokHandle,
      profileHref: creator.tiktokHandle && tiktokUrlFor(creator.tiktokHandle),
      liveHref: creator.tiktokHandle && tiktokLiveUrlFor(creator.tiktokHandle),
    },
  ];

  const pills = entries
    .filter((e) => e.handle)
    .map((e) => {
      const icon = SOCIAL_ICONS[e.key];
      return `
        <a class="platform-pill platform-pill--${icon.cssClass}"
           href="${e.profileHref}"
           data-platform="${e.key}"
           data-live-for="${creator.id}"
           data-profile-href="${e.profileHref}"
           data-live-href="${e.liveHref}"
           target="_blank"
           rel="noopener noreferrer"
           aria-label="${creator.name} on ${icon.label}">
          <span class="platform-pill-icon" aria-hidden="true">${icon.svg}</span>
          <span class="platform-pill-live" aria-hidden="true">
            <span class="platform-pill-dot"></span>LIVE
          </span>
        </a>`;
    })
    .join('');

  return pills ? `<div class="platform-pills">${pills}</div>` : '';
}

/**
 * Wire hover swaps on every .creator-skin image in `root`.
 *
 * Minimal by design — default ↔ hover. Network hardening (load
 * progression, fallback chain, broken-image recovery) is the job of
 * setupSkinLoaders() below; keeping the hover function this small means
 * any future bug is obvious at a glance.
 *
 * Must be called AFTER the cards have been rendered into the DOM
 * (modules/creators.js handles this).
 */
export function initializeSkinHoverEffects(root = document) {
  const skins = root.querySelectorAll('.creator-skin');

  skins.forEach((skin) => {
    const defaultSrc = skin.dataset.default;
    const hoverSrc   = skin.dataset.hover;
    if (!defaultSrc || !hoverSrc) return;

    skin.addEventListener('mouseenter', () => { skin.src = hoverSrc; });
    skin.addEventListener('mouseleave', () => { skin.src = defaultSrc; });
  });
}

/** Keep the old (misspelled) name working for callers that already imported it. */
export const intializeSkinHoverEffects = initializeSkinHoverEffects;

/**
 * Progressive skin loader — the second half of the 4-state model.
 *
 *   skeleton  : instant, blocky Minecraft shimmer (always renders)
 *   loading   : skeleton stays visible while the <img> fetches
 *   loaded    : .skin-loaded class fades the image in over the skeleton
 *   failed    : swap to mc-heads.net fallback once; if THAT 404s, give up
 *               (data-failed guard prevents recursion)
 *
 * Why this is its own function (not part of initializeSkinHoverEffects):
 * the two concerns are independent. Loading happens once per page; hover
 * happens many times. Splitting them keeps teardown semantics clean and
 * lets either be reused without dragging the other along.
 *
 * Returns a teardown via AbortController so listeners don't linger
 * after grid re-renders.
 */
export function setupSkinLoaders(root = document) {
  const skins = root.querySelectorAll('.creator-skin');
  const controller = new AbortController();
  const { signal } = controller;

  skins.forEach((skin) => {
    const fallbackUrl = skin.dataset.fallback;

    // The loader is concerned with the INITIAL render only. Once the first
    // load resolves (success or fallback), this flag flips and subsequent
    // errors are ignored — otherwise a hover URL failure would trigger
    // markFailed and clobber the hover behavior by force-swapping `src` to
    // the fallback. That's the bug we're solving here.
    let initialResolved = false;

    const markLoaded = () => {
      initialResolved = true;
      skin.classList.add('skin-loaded');
      const skeleton = skin.previousElementSibling;
      if (skeleton && skeleton.classList.contains('skin-skeleton')) {
        skeleton.classList.add('skin-skeleton--hidden');
      }
    };

    const markFailed = () => {
      // Hover-triggered errors arrive after initialResolved is true. Let
      // them bubble harmlessly — mouseleave restores the default URL.
      if (initialResolved) return;

      if (skin.dataset.failed === 'true') {
        // Fallback URL also failed. Accept defeat, reveal whatever's
        // there so the card has something rather than an infinite shimmer.
        initialResolved = true;
        skin.classList.add('skin-loaded', 'skin-failed');
        return;
      }
      skin.dataset.failed = 'true';
      if (fallbackUrl && skin.src !== fallbackUrl) {
        // Swap to mc-heads. The next `load` event will fire markLoaded;
        // if THAT also errors, the data-failed branch above closes things out.
        skin.src = fallbackUrl;
      } else {
        markLoaded();
      }
    };

    // Three states the image can be in when JS reaches it:
    //   complete + naturalWidth > 0  →  loaded already (cached)
    //   complete + naturalWidth == 0 →  failed BEFORE JS attached
    //   not complete                 →  still in flight; wait for events
    if (skin.complete) {
      if (skin.naturalWidth > 0) markLoaded();
      else markFailed();
    } else {
      // load is `once: true` because we only need to know about the FIRST
      // successful load. error is NOT `once: true` because we may need it
      // to fire twice (initial failure → fallback failure). The
      // initialResolved guard inside markFailed handles all later cases.
      skin.addEventListener('load',  markLoaded, { signal, once: true });
      skin.addEventListener('error', markFailed, { signal });
    }
  });

  return () => controller.abort();
}

export function creatorCardHTML(creator) {
  const roleVariant = ROLE_VARIANTS[creator.role] || 'creative';
  // `walking` is a real Starlightskins pose; `running` is not (it would
  // silently fall back to default). See utils/skinUrls.js VALID_POSES.
  const skinUrl = fullBodySkinUrl(creator.mcUsername, {
    pose: 'walking',
    width: 600,
  });
  // Per-creator hover pose. Falls back to 'cheering' when `emote` is missing,
  // and maps friendly emote names (Wave, Jump, Dance) to real Starlightskins
  // poses via EMOTE_POSE_MAP above.
  const emoteSkin = fullBodySkinUrl(creator.mcUsername, {
    pose: resolveHoverPose(creator.emote),
    width: 600,
  });
  const fallbackUrl = fullBodyFallbackUrl(creator.mcUsername);
  const bioHref = bioUrlFor(creator.id);

  // Build the per-platform pill row. Only platforms with a handle render.
  // Each pill has data-platform + data-live-for so modules/creators.js
  // can flip a `.is-live` class when the poller reports live.
  const platformPills = renderPlatformPills(creator);

  // The skeleton is a sibling of the <img> (NOT a child) so the image's
  // z-index can sit above it without the skeleton clipping. Both are
  // absolutely positioned inside .creator-v2-image; setupSkinLoaders
  // hides the skeleton once .skin-loaded is on the image.
  return `
    <article class="creator-v2-card" data-creator="${creator.id}">
      <div class="creator-v2-image">
        <div class="skin-skeleton" aria-hidden="true"></div>
        <img
          class="creator-skin"
          src="${skinUrl}"
          data-default="${skinUrl}"
          data-fallback="${fallbackUrl}"
          alt="${creator.name}'s Minecraft skin"
          loading="lazy">

        ${platformPills}
      </div>

      <div class="creator-v2-meta">
        <h2 class="creator-v2-name">${creator.name}</h2>
        <p class="creator-v2-role creator-v2-role--${roleVariant}">${creator.role}</p>
      </div>

      <a class="creator-v2-bio" href="${bioHref}" target="_blank" rel="noopener noreferrer">
        Read Bio
      </a>
    </article>
  `;
  console.log(emoteSkin)
}
