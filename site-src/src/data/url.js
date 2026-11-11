// Absolute URLs for structured data, in the form the canonical uses.
//
// The canonical (Layout.astro) is built from Astro.url.pathname, which carries a trailing slash,
// so `/learn/x` in JSON-LD named a URL that only exists as a redirect to `/learn/x/`. abs() adds
// the slash unless the path already has one or ends in a file extension.
export const SITE = 'https://warrenlabs.com';
export const abs = (p) => new URL(p.endsWith('/') || /\.\w+$/.test(p) ? p : p + '/', SITE).href;
