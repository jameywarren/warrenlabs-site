// The site's header and footer, defined once.
//
// warrenlabs.com is rendered by three different things: hand-written static HTML (the homepage,
// /design-review, /404), this Astro project, and gen_site.py in the monorepo (/plugins). Before
// this, each carried its own nav and no two agreed.
//
// nav.json is the canonical data, because gen_site.py is Python and cannot import a JS module.
// This file just re-exports it for Astro and adds the helpers. Edit nav.json, not this.
//
// Naming, deliberately: /collections/headphones is HEADPHONES (browse a headphone), /graphs is
// MEASUREMENTS (the measurement tool, named for what it grows into rather than for "compare",
// which is only its first job), and /measure is "Send yours in" so it never reads as a near
// duplicate of Measurements in the footer.
//
// The homepage's own sections (the work, about) are not in the nav: they are a short scroll from
// the top of the page they live on, and the logo goes home from everywhere else.

import nav from './nav.json';

export const NAV = nav.nav;
export const FOOTER_LINKS = nav.footerLinks;
export const FOOTER_META = nav.footerMeta;
export const MARK_PATH = nav.markPath;

/** Non-breaking-space a label so nav items never wrap mid-phrase. */
export const nbsp = (s) => s.replace(/ /g, '\u00a0');
