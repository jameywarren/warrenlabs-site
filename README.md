# Warren Labs — warrenlabs.com

Jamey Warren's audio product-consulting site, built as a piece of studio hardware. Hosted on
GitHub Pages, which serves this repo as-is with no build step on their side.

## Two renderers, one repo

GitHub Pages serves static files, so everything here is committed HTML. It comes from two places:

| Rendered by | Pages |
|---|---|
| Hand-written HTML in this repo | `/`, `/design-review/`, `/404.html`, `/changes/` |
| Astro, in `site-src/` | `/attune`, `/learn` + 16 articles, `/products/*` (40), `/collections/headphones`, `/graphs`, `/measure`, `/support`, `/privacy` |

A third renderer lives in the monorepo: `tools/gen_site.py` generates `/plugins` and rsyncs it here.

**`npm run build` in `site-src/` does three things:** compiles Astro, copies the published routes
to the repo root (`tools/sync.mjs`), and renders the shared header and footer into the
hand-written pages (`tools/sync-chrome.mjs`). Commit what it produces; that is what ships.

## Shared chrome

`site-src/src/data/nav.json` is the single source of truth for the nav, the footer, and the
Warren Labs mark path. All three renderers read it, so the header cannot drift between surfaces:

- Astro imports it via `src/data/nav.js`
- The static pages get it injected between `<!-- wl:header:start -->` / `<!-- wl:footer:start -->`
  markers by `tools/sync-chrome.mjs`
- `gen_site.py` in the monorepo reads the same JSON

Edit `nav.json`. Never hand-edit a header or footer in a page.

## Identity

Graphite ground (`#0c0d0f`) with **one** amber accent (`#FF9E2C`), used for signal state only.
**Barlow** for display, **Archivo** for body, **JetBrains Mono** for labels and eyebrows. JetBrains
is the line-wide mono: `wl-ui` embeds it and every native plugin faceplate uses it, so the web
matches the apps. Instrument Serif appears in exactly one place, the Attune wordmark on `/attune`,
and is loaded only on that page.

The rack sits at a 12° tilt. House style: no em dashes in marketing copy, and `makerphones` is
always lowercase one word.

## Measurement provenance

`site-src/src/data/fixtures.js` records which bench produced each curve. Everything published
today came off the Head Acoustics HMS II.3 archive rig; the miniDSP EARS Pro is the house bench
going forward. Curves from two fixtures are never drawn on one axis, because the offset between
the rigs has not been measured and a cross-fixture difference cannot be quoted.

## Structure

```
index.html            the homepage (hero, rack, projects, about, offer, contact)
design-review/        the fixed-fee offer page
404.html
css/styles.css        styling for the hand-written pages
js/wl-app.js          oscilloscope, rack, unit overlays
js/wl-eq1.js          playable EQ + crossfeed demo (Web Audio)
js/wl-patchbay.js     patchbay cable physics
site-src/             Astro source for everything else (see above)
plugins/              generated in the monorepo by tools/gen_site.py, rsynced here
changes/              landing page for the Changes iOS app
assets/               brand marks, icons, photography
```

## Local preview

```
cd site-src && npm run build     # only if you changed anything under site-src/
python3 -m http.server 8000      # from the repo root
```

then open http://localhost:8000.
