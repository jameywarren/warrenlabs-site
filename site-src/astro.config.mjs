// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The migrated Sonic Temple content, built as part of warrenlabs.com.
// `npm run build` emits to dist/; tools/sync.mjs then copies the published routes into the repo
// root so GitHub Pages serves them at /attune, /learn/*, /measure, /support, /privacy.
export default defineConfig({
  output: 'static',
  site: 'https://warrenlabs.com',
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
      // /canjam and /card ARE published, but they are noindex handout targets for a printed QR
      // code. Listing a noindexed page in the sitemap asks a crawler to fetch it and then tells
      // it to forget what it found, so they come out here. Both must stay in step with the
      // `noindex` prop on their pages.
      filter: (page) => !['/canjam', '/card'].some((p) => page.includes(p)),
      // The hand-written pages live outside this Astro project, so list them explicitly.
      customPages: [
        'https://warrenlabs.com/',
        'https://warrenlabs.com/design-review/',
        'https://warrenlabs.com/plugins/',
        'https://warrenlabs.com/changes/',
        // The nine plugin pages and the guides index. gen_site.py in the monorepo renders these,
        // so Astro cannot discover them -- they were shipping unlisted while /plugins/ itself was
        // listed. Adding a plugin means adding it here, same trap as tools/sync.mjs ROUTES.
        'https://warrenlabs.com/plugins/guides/',
        'https://warrenlabs.com/plugins/guides/ir-capture.html',
        'https://warrenlabs.com/plugins/guides/level-manual.html',
        'https://warrenlabs.com/plugins/bevel/',
        'https://warrenlabs.com/plugins/brace/',
        'https://warrenlabs.com/plugins/level/',
        'https://warrenlabs.com/plugins/pare/',
        'https://warrenlabs.com/plugins/ripple/',
        'https://warrenlabs.com/plugins/scribe/',
        'https://warrenlabs.com/plugins/square/',
        'https://warrenlabs.com/plugins/temper/',
        'https://warrenlabs.com/plugins/wake/',
        // /tune is Attune's WebHID companion, vendored from attune/companion/tune.html into
        // public/. Astro does not route it, so it never reached the sitemap -- yet it is
        // indexable, linked from /support, and a real destination for someone searching for
        // how to get a tuning onto a dongle.
        'https://warrenlabs.com/tune/',
      ],
    }),
  ],
});
