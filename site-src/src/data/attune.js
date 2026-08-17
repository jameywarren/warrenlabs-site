// Attune's App Store facts, in ONE place.
//
// Every customer-facing surface that names a platform, a system requirement or a store link reads
// from here: pages/attune.astro, pages/support.astro, components/CanJamHandout.astro. Before this
// file existed the handout carried the only correct iOS status and the landing page and support
// page carried a stale one, which is exactly the drift this prevents.
//
// Verified 2026-08-16 against ~/Projects/attune (docs/SUBMISSION-STATUS.md, docs/messaging-spine.md §8):
//   - macOS 1.0.2 APPROVED and LIVE.  macOS 12 or later, Apple Silicon only. NOT universal, NOT Intel.
//   - iOS 1.0.2 SUBMITTED, WAITING FOR REVIEW.  iOS 16 or later, iPhone and iPad.
//   - iOS has NEVER been approved. 1.0.2 is its first release. DO NOT IMPLY OTHERWISE.
//   - Attune Pro is $39, one time, no subscription, and a Universal Purchase covering Mac and iOS.
//   - It is a Universal Purchase on ONE bundle id, so ONE App Store link serves both platforms the
//     moment iOS clears review. That is why there is a single URL here and not two.
//
// WHEN iOS IS APPROVED: set IOS_STATUS to 'live'. That is the whole edit, site-wide.

export const APP_STORE = 'https://apps.apple.com/app/attune-headphone-eq/id6792873303';

/** @type {'review' | 'live'} */
export const IOS_STATUS = 'review';

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
