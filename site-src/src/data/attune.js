// Attune's App Store facts, in ONE place.
//
// Every customer-facing surface that names a platform, a system requirement or a store link reads
// from here: pages/attune.astro, pages/support.astro, components/CanJamHandout.astro. Before this
// file existed the handout carried the only correct iOS status and the landing page and support
// page carried a stale one, which is exactly the drift this prevents.
//
// Verified 2026-08-21 against the live App Store listing (id6792873303):
//   - macOS APPROVED and LIVE.  macOS 12 or later, Apple Silicon (M1 or later). NOT Intel.
//   - iOS APPROVED and LIVE as of 2026-08-21.  iPhone iOS 16+, iPad iPadOS 16+.
//   - Attune Pro is $39, one time, no subscription, and a Universal Purchase covering Mac and iOS.
//   - One bundle id, so ONE App Store link serves every platform. That is why there is a single
//     URL here and not two.
//
// APPLE VISION — DELIBERATELY NOT IN THE COPY. The store listing also shows
// "Apple Vision (visionOS 1.0 or later)", but that is the automatic iPad-compatibility entry Apple
// adds unless an app opts out; nothing here was built or tested for visionOS. Advertising it would
// be the exact overclaim this file exists to prevent. If Attune is ever genuinely tested there,
// change this comment and the strings together, not one of them.
//
// The iOS transition is DONE. IOS_STATUS is 'live'.

export const APP_STORE = 'https://apps.apple.com/app/attune-headphone-eq/id6792873303';

/** @type {'review' | 'live'} */
export const IOS_STATUS = 'live';

export const IOS_LIVE = IOS_STATUS === 'live';

// Prebuilt copy, so the conditional lives here once instead of at every call site. No em-dashes:
// these strings go straight onto the page. See messaging-spine.md §7.
export const ATTUNE = {
  /** Hero eyebrow and any "where do I get it" badge. */
  storeLine: IOS_LIVE
    ? 'Free · on the App Store for Mac, iPhone and iPad'
    : 'Free · on the Mac App Store · iPhone and iPad in review',

  /** Download button label. One link either way; only the wording narrows. */
  ctaLabel: IOS_LIVE ? 'Download on the App Store' : 'Download on the Mac App Store',

  /** Just the store's name, for sentences that supply their own verb. */
  storeName: IOS_LIVE ? 'App Store' : 'Mac App Store',

  /** The fine print under a CTA. */
  requirements: IOS_LIVE
    ? 'macOS 12 or later on Apple Silicon (M1 or later), or iOS 16 or later on iPhone and iPad'
    : 'macOS 12 or later on Apple Silicon (M1 or later). iPhone and iPad, iOS 16 or later, in review at Apple',

  /** The short status sentence used on the handout and anywhere a full line fits. */
  platformLine: IOS_LIVE
    ? 'Mac, iPhone and iPad, one download.'
    : 'Mac now. The iPhone and iPad version is in review at Apple, not approved yet.',

  /** Meta description platform clause. */
  metaPlatforms: IOS_LIVE ? 'Mac, iPhone and iPad' : 'Mac, with iPhone and iPad in review',

  /** schema.org operatingSystem. */
  operatingSystem: IOS_LIVE ? 'macOS 12, iOS 16' : 'macOS 12',
};
