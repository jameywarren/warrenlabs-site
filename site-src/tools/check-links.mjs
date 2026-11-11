// Fail the build if any published page links to one of our own pages without its trailing slash.
//
// GitHub Pages serves /learn/x/ and answers /learn/x with a 301 to it. Every canonical, every
// sitemap entry and every structured-data URL on this site uses the slash form, so a slashless
// in-body link points a crawler at a redirect and splits the signal between two spellings of one
// page. Until 2026-11-11 185 links in site-src and the hand-written home page did exactly that.
//
// What passes: a root-relative href that ends in "/", ends in a file extension (/favicon.ico,
// /plugins/guides/level-manual.html), or is "/" followed by a fragment or query on a path that
// itself passes (/attune/?yours=..., /#patch). Absolute URLs, "//" and relative hrefs are not
// checked.
//
// It runs right after check-copy in `npm run build`, over the same tree: the repo root, i.e. what
// GitHub Pages serves. Fix a failure at its source (site-src/, the hand-written page, or
// tools/gen_site.py in the monorepo for /plugins), then rebuild.

import { readFile, readdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SKIP_DIRS = new Set(['.git', '.claude', 'site-src', 'node_modules']);

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) yield* walk(join(dir, e.name));
    } else if (e.name.endsWith('.html')) {
      yield join(dir, e.name);
    }
  }
}

const ok = (href) => {
  const path = href.split(/[#?]/)[0];
  return path === '' || path.endsWith('/') || /\.\w+$/.test(path);
};

const found = [];
for await (const file of walk(ROOT)) {
  const page = (await readFile(file, 'utf8')).replace(/<!--[\s\S]*?-->/g, ' ');
  for (const m of page.matchAll(/\shref=(["'])(\/(?!\/)[^"']*)\1/gi)) {
    if (!ok(m[2])) found.push(`${relative(ROOT, file)}: ${m[2]}`);
  }
}

if (found.length) {
  console.error(`check-links: FAILED, ${found.length} internal link(s) without a trailing slash. Add the ` +
    'slash at the source and rebuild. Do not commit this build.');
  for (const f of found) console.error('  ' + f);
  process.exit(1);
}
console.log('check-links: every internal link uses the trailing-slash form');
