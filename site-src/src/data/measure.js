// Send one in (mail-in measurement): the price, the two lanes and the turnaround, in ONE place.
//
// THIS FILE IS THE OWNER of these facts (registered in warren-labs DOCS.md, 2026-11-11). Before it
// existed, $89 was hand-typed seven times in pages/measure.astro and again on the homepage, and no
// document owned it. pages/measure.astro and the homepage (index.html, the wl:measure region
// stamped by tools/sync-chrome.mjs) both read it now. Change a price or a promise here and nowhere
// else.
//
// Plain ESM with no Vite-only syntax: tools/sync-chrome.mjs imports it in plain Node.
// No em dashes: every string goes straight onto a page.

/** What a unit that is not on the requested list costs to measure. Typed once, here. */
const OFF_LIST_PRICE = '$89';

export const MEASURE = {
  offListPrice: OFF_LIST_PRICE,

  /** Short lane labels, for a spec table. */
  onListLane: 'Free, both ways',
  offListLane: `${OFF_LIST_PRICE}, postage on you`,

  /** The turnaround as a reader says it, and what it means. Keep the two in agreement. */
  turnaround: 'About a week',
  turnaroundDefined: 'within about five business days of arrival',
};
