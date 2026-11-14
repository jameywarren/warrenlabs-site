// Caliper and Proof: the App Store facts the site restates, in ONE place on the site.
//
// THESE ARE DATED COPIES, NOT THE OWNERS. The owners live in each app's own repo (warren-labs
// DOCS.md, "Caliper's price" and "Proof's price"), which this build cannot read:
//   - Caliper is free, no paid tier: copied from caliper/docs/PRICING.md, 2026-11-11.
//     Released on iOS 2026-09-19 and macOS 2026-09-29 (caliper/docs/RELEASE-READINESS.md; checked
//     against the public App Store lookup 2026-11-11).
//   - Proof is a free app with one $79 unlock, no subscription and no trial: copied from
//     proof/docs/DESIGN.md §16.2b, 2026-11-11; the $79 copied from the same section, 2026-11-13.
//     On the App Store for iPhone and iPad since 2026-10-01 and for Mac since 2026-10-17 (checked
//     against the public App Store lookup 2026-11-11). App Store Connect shows macOS 1.0 and iOS 1.0
//     Ready for Sale (checked 2026-11-11, per proof/docs/TODO.md's top block; read 2026-11-13).
// When an owner changes, change it there first, then here. The homepage (wl:doors, stamped by
// tools/sync-chrome.mjs) and pages/proof.astro read this file.
//
// The homepage states no Proof price on purpose: /proof and its owner carry the number. /proof reads
// PROOF.unlock for its one visible price and its schema.org offers.
//
// Plain ESM with no Vite-only syntax: tools/sync-chrome.mjs imports it in plain Node.
// No em dashes: every string goes straight onto a page.

export const CALIPER = {
  name: 'Caliper',
  page: '/caliper/',
  store: 'https://apps.apple.com/app/caliper-headphone-measurement/id6813610070',
  /** One of the door-card status words: see STATUSES in tools/home-regions.mjs. */
  status: 'ON THE APP STORE',
  price: 'FREE',
  platforms: 'Mac and iPhone',
};

export const PROOF = {
  name: 'Proof',
  page: '/proof/',
  store: 'https://apps.apple.com/app/proof-audio-analyzer/id6813702023',
  status: 'ON THE APP STORE',
  price: 'FREE · ONE UNLOCK, NO SUBSCRIPTION',
  platforms: 'Mac, iPad and iPhone',
  /** A full sentence for a status line. */
  storeLine: 'Free on the App Store for Mac, iPad and iPhone, with one unlock and no subscription.',
  /** The one in-app purchase, US. `amount` is the schema.org Offer price; `display` is for people. */
  unlock: { amount: '79', currency: 'USD', display: '$79' },
};
