// Copy the built Astro routes into the repo root so GitHub Pages serves them alongside the
// hand-written pages.
//
// Only the routes listed in ROUTES are published, and only those directories are cleaned before
// each copy. That matters: the repo root also holds hand-written files (index.html, 404.html,
// css/, js/, design-review/, plugins/, changes/) and a blanket copy would clobber them.
//
// Run via `npm run build` from site-src/.

import { cp, rm, mkdir, readdir, stat, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, '..', 'dist');
const ROOT = join(here, '..', '..');

// Built route -> path at the repo root. Anything not listed here stays out of the published site.
// NOTE: 'graphs' is deliberately absent. That page is purely the gated 319-curve archive
// viewer: it fetches /api/archive from the DigitalOcean gate service and has no static
// fallback, so on GitHub Pages it renders a permanent "not on this server" state. The source
// stays in src/pages/graphs.astro; add 'graphs' back here once there is data to show.
const ROUTES = ['attune', 'learn', 'measure', 'support', 'privacy'];
// Astro's hashed asset bundle, plus the audio the Attune demos play.
const ASSETS = ['_astro', 'audio'];

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
