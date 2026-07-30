// The site's header and footer, defined once.
//
// warrenlabs.com is rendered by three different things: hand-written static HTML (the homepage,
// /design-review, /404), this Astro project (/attune, /learn, /products, /collections, /graphs,
// /measure, /support, /privacy), and gen_site.py in the monorepo (/plugins). Before this file
// they each carried their own nav, and no two agreed, so the links changed depending on which
// page you happened to land on.
//
// This is the source of truth. Astro imports it directly. tools/sync-chrome.mjs renders the same
// markup into the hand-written pages between their wl:header / wl:footer markers on every build.
//
// Editing the lists here changes every surface. Do not hand-edit a header or footer in a page.

/** Primary nav. `cta` renders as the outlined amber button at the end. */
export const NAV = [
  { href: '/#work', label: 'THE WORK' },
  { href: '/attune', label: 'ATTUNE' },
  { href: '/collections/headphones', label: 'MEASUREMENTS' },
  { href: '/learn', label: 'LEARN' },
  { href: '/#about', label: 'ABOUT' },
  { href: '/design-review/', label: 'DESIGN REVIEW', cta: true },
];

/** Footer links. Deliberately wider than the nav: this is where the deeper routes live. */
export const FOOTER_LINKS = [
  { href: '/', label: 'The lab' },
  { href: '/attune', label: 'Attune' },
  { href: '/collections/headphones', label: 'Headphones' },
  { href: '/graphs', label: 'Compare' },
  { href: '/measure', label: 'Measure' },
  { href: '/learn', label: 'Learn' },
  { href: '/plugins/', label: 'Plugins' },
  { href: '/design-review/', label: 'Design review' },
  { href: '/#patch', label: 'Contact' },
];

export const FOOTER_META = ['WARREN LABS · JAMEY WARREN', 'BUILT IN LIVINGSTON, MONTANA'];

/** The Warren Labs mark, as an inline SVG path. One definition, every surface. */
export const MARK_PATH =
  'M16 16 C20 38 28 62 39 62 C48 62 53 46 58 38 C63 30 70 30 76 38 C81 44 84 54 92 54 C99 54 103 46 106 40';

/** Non-breaking-space a label so nav items never wrap mid-phrase. */
export const nbsp = (s) => s.replace(/ /g, ' ');
