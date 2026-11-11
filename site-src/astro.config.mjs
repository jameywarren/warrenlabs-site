// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// The repo root, which GitHub Pages serves. /plugins (gen_site.py in the monorepo) and /changes
// (hand-written) are published from there, not built by Astro, so Astro cannot discover them.
const ROOT = fileURLToPath(new URL('..', import.meta.url));

// Every published .html under the given root directories, as sitemap URLs. Until 2026-11-11 this
// was a hand-kept list, and it drifted exactly the way tools/sync.mjs ROUTES warns about: the
// downloads page, eight plug-in manuals and both Changes legal pages shipped unlisted. Reading the
// tree at config time means a new gen_site page is listed the day it is published.
//   - index.html maps to its directory URL with a trailing slash, matching its canonical.
//   - A page carrying `name="robots" content="noindex` is skipped, per the rule in the filter
//     comment below: never advertise a page that asks not to be indexed.
function generatedPages(dirs) {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) {
        if (/name="robots"\s+content="noindex/i.test(readFileSync(p, 'utf8'))) continue;
        const rel = relative(ROOT, p).split(sep).join('/');
        out.push('https://warrenlabs.com/' + rel.replace(/(^|\/)index\.html$/, '$1'));
      }
    }
  };
  for (const d of dirs) walk(join(ROOT, d));
  return out;
}


// The migrated Sonic Temple content, built as part of warrenlabs.com.
// `npm run build` emits to dist/; tools/sync.mjs then copies the published routes into the repo
// root so GitHub Pages serves them at /attune, /learn/*, /measure, /support, /privacy.
export default defineConfig({
  output: 'static',
  site: 'https://warrenlabs.com',
  // Astro 7 changed the default to 'jsx', which applies React's whitespace rules: any whitespace
  // that contains a line break and touches an element is deleted. Every page here is written as
  // wrapped prose, so a link or <b> that starts or ends a source line lost the space beside it
  // ("Email<a>jamey@warrenlabs.com</a>with your order number"). `true` is the pre-7 behaviour:
  // it collapses whitespace but keeps one space wherever the rendering needs it.
  compressHTML: true,
  integrations: [
    sitemap({
      // CORRECTED 2026-08-24. This comment used to read "/graphs and /measure are built but NOT
      // published (see tools/sync.mjs), so they must not be advertised." Both halves were stale:
      // /measure was never excluded by the filter below, and /graphs IS published -- it is in
      // tools/sync.mjs ROUTES, it is 67 KB of real content, and it is the "MEASUREMENTS" item in
      // the primary nav and the footer. It carries no noindex. It was invisible to crawlers for
      // no reason. tools/sync.mjs already records that the old reason died when /graphs stopped
      // being an archive viewer and started serving our own EARS Pro curves inline.
      //
      // /canjam, /card and /loaners/print ARE published, but they are noindex documents: two
      // handout targets for a printed QR code, and the one-page loaner leave-behind. Listing a
      // noindexed page in the sitemap asks a crawler to fetch it and then tells it to forget what
      // it found, so they come out here. All three must stay in step with the `noindex` on their
      // pages.
      //
      // /loaners/print added 2026-08-27. It had been listed here since it was written while also
      // emitting `<meta name="robots" content="noindex">` -- exactly the mixed signal this filter
      // exists to prevent. It sets its own <head> by hand instead of going through Layout.astro,
      // so it never took the `noindex` prop that would have made the contradiction obvious.
      //
      // /proof/terms is here for a DIFFERENT reason, and it is temporary. The page is a DRAFT: it
      // sets `noindex` from the `DRAFT` flag in src/pages/proof/terms.astro, so it has to be out
      // of the sitemap for exactly as long as that flag is true, per the rule above. This file
      // cannot read that flag, so the two are held together by comments instead. **REMOVE THIS
      // ENTRY IN THE SAME COMMIT THAT SETS `DRAFT = false`** — a published Terms of Use that no
      // crawler is told about is the wrong failure in the other direction, and Apple's Schedule 2
      // section 3.8(b) is satisfied by the in-app link rather than by the sitemap either way.
      filter: (page) =>
        !['/canjam', '/card', '/loaners/print', '/proof/terms'].some((p) => page.includes(p)),
      // The pages that live outside this Astro project. /, /changes/ and /tune/ are listed by
      // hand; everything else under /plugins and /changes is found on disk (see generatedPages).
      // A Set, because the scan also finds /changes/ (changes/index.html).
      customPages: [...new Set([
        'https://warrenlabs.com/',
        'https://warrenlabs.com/changes/',
        // /tune is Attune's WebHID companion, vendored from attune/companion/tune.html into
        // public/. Astro does not route it, so it never reached the sitemap -- yet it is
        // indexable, linked from /support, and a real destination for someone searching for
        // how to get a tuning onto a dongle.
        'https://warrenlabs.com/tune/',
        ...generatedPages(['plugins', 'changes']),
      ])],
    }),
  ],
});
