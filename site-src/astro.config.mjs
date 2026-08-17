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
      // /graphs and /measure are built but NOT published (see tools/sync.mjs), so they must
      // not be advertised.
      //
      // /canjam and /card ARE published, but they are noindex handout targets for a printed QR
      // code. Listing a noindexed page in the sitemap asks a crawler to fetch it and then tells
      // it to forget what it found, so they come out here too. Both must stay in step with the
      // `noindex` prop on their pages.
      filter: (page) => !['/graphs', '/canjam', '/card'].some((p) => page.includes(p)),
      // The hand-written pages live outside this Astro project, so list them explicitly.
      customPages: [
        'https://warrenlabs.com/',
        'https://warrenlabs.com/design-review/',
        'https://warrenlabs.com/plugins/',
        'https://warrenlabs.com/changes/',
      ],
    }),
  ],
});
