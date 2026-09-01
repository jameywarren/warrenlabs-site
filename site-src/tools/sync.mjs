// Copy the built Astro routes into the repo root so GitHub Pages serves them alongside the
// hand-written pages.
//
// Only the routes listed in ROUTES are published, and only those directories are cleaned before
// each copy. That matters: the repo root also holds hand-written files (index.html, 404.html,
// css/, js/, plugins/, changes/) and a blanket copy would clobber them.
//
// Run via `npm run build` from site-src/.

import { cp, rm, mkdir, readdir, stat, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, '..', 'dist');
const ROOT = join(here, '..', '..');

// Built route -> path at the repo root. Anything not listed here stays out of the published site.
//
// **THIS IS AN ALLOWLIST, AND FORGETTING IT IS SILENT.** A new page builds into dist/, the build
// prints it as a success, and it simply never reaches the site — no error, no warning, nothing at
// the published URL. /loaners was authored, built, committed and pushed on 2026-08-05 and was not
// live, because of exactly this. **Adding a page means adding it here.**
//
// (The old note here explained why 'graphs' was excluded — it used to be a viewer for the gated
// 319-curve archive with no static fallback. Both halves of that are now wrong: the archive is not
// published at all, and /graphs serves our own EARS Pro measurements inlined at build time.)
const ROUTES = [
  'attune', 'learn', 'graphs', 'products', 'collections', 'measure', 'support', 'privacy',
  // Legal pages. FastSpring will not activate a store whose site lacks live links to terms,
  // privacy and a refund policy, so if any of these three drops off this list the store cannot
  // go live -- and, as with canjam/card below, it fails silently as a 404.
  'terms', 'refunds',
  'loaners',   // + /loaners/print, the one-page leave-behind
  'tune',      // Attune's "Send to Device" WebHID page — source of truth is attune/companion/tune.html
  // The CanJam SoCal handout, at two URLs so report scans can be told from everything else. Both
  // are noindex and both are dropped from the sitemap in astro.config.mjs. They are QR targets on
  // printed paper: if either is missing from this list it 404s at the show, silently, per the
  // warning above.
  'canjam', 'card',
];
// Astro's hashed asset bundle, plus the audio the Attune demos play.
const ASSETS = ['_astro', 'audio', 'wl'];   // wl/ = vendored wl-web runtime (wl-plot.js)

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

async function main() {
  if (!(await exists(DIST))) {
    console.error('sync: no dist/ — run `astro build` first');
    process.exit(1);
  }

  let copied = 0;
  for (const name of [...ROUTES, ...ASSETS]) {
    const from = join(DIST, name);
    if (!(await exists(from))) {
      console.warn(`sync: skip ${name} (not in dist)`);
      continue;
    }
    const to = join(ROOT, name);
    await rm(to, { recursive: true, force: true });
    await mkdir(dirname(to), { recursive: true });
    await cp(from, to, { recursive: true });
    const n = (await readdir(from, { recursive: true })).length;
    console.log(`sync: ${name}/ (${n} entries)`);
    copied += 1;
  }

  // sitemap: Astro emits sitemap-index.xml + sitemap-N.xml describing only these routes. Copy
  // them so the migrated pages are discoverable; the hand-written pages are not in it yet.
  for (const f of await readdir(DIST)) {
    if (!f.startsWith('sitemap')) continue;
    await cp(join(DIST, f), join(ROOT, f));
    console.log(`sync: ${f}`);
  }

  // Guardrail: never let the Astro build's own index.html or 404.html reach the root, where they
  // would replace the hand-written homepage and error page.
  for (const f of ['index.html', '404.html']) {
    const stray = join(DIST, f);
    if (await exists(stray)) {
      const rootFile = join(ROOT, f);
      const s = await stat(rootFile).catch(() => null);
      if (!s) continue;
      console.log(`sync: leaving ${f} alone (hand-written)`);
    }
  }

  console.log(`sync: ${copied} route group(s) published to ${ROOT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
