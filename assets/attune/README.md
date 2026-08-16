# Attune brand assets

Copied from `~/Projects/attune/Assets/Logo/` — **that repo is the source of truth.** Nothing here
is drawn or regenerated on this side. If a lock-up needs to change, change it there with
`tools/make_lockup.py` and copy the result across.

The mark is called **3d4-2r**. One continuous stroke: a flat reference comes in, rises into a
measured peak, and leaves flat on the same axis. It reads as a graph first and as a letter A
second. Path, verbatim, in a `0 0 100 100` viewBox with `stroke-width 7` and round caps and joins:

    M14 68 H26 C36 68 40 27 50 27 C60 27 64 68 74 68 H86

## One mark per lock-up

The Attune mark was briefed as a **sibling** to the Warren Labs sine-W: single continuous stroke,
rounded caps, drawn rather than constructed. It is a sibling, and that is exactly why the two
cannot share a signature — they compete rather than nest. So:

- Where **Attune** speaks, the Attune mark leads and Warren Labs is a text credit, `BY WARREN LABS`.
  The W does not appear inside the lock-up.
- Where **Warren Labs** speaks, the W leads, unchanged. That is still almost everywhere on this
  site, including the site header and footer on `/attune` itself — that chrome is the lab's, and
  it is a separate lock-up from Attune's.

`/attune` is the only page that swaps its favicon and OG card. Everything else keeps the W.

## Amber is ground-dependent, and this is measured

Contrast of each candidate against the two grounds:

| | on light (`#f7f8f9`) | on graphite (`#0c0d0f`) |
|---|---|---|
| site `--accent` dark `#FF9E2C` | **1.9:1** | 8:1 |
| light amber `#A8641E` | **4.4:1** | too dim |
| dark amber `#EE9A3A` | too pale | **8.6:1** |

**`#A8641E` on light grounds, `#EE9A3A` on dark.** These are written literally rather than as
`var(--accent)`: the mark is a locked asset and must not drift if the site accent is retuned. A
token-coloured mark on a light ground all but disappears at small sizes — that is not hypothetical,
it is what the first pass shipped.

## Instrument Serif is not a system font

`InstrumentSerif-Regular.woff2` is the same file the app bundles, and the same one the outlined
lock-ups were cut from. Any SVG that leaves a page must have its type **outlined**, or it falls
back to Georgia — wider and heavier. That shipped once and read as "the wordmark looks fatter".
Pages load the woff2 with `font-display: block` for the same reason: a swap would paint Georgia
first and then reflow.

## Files

| File | Used by | Notes |
|---|---|---|
| `attune-lockup-vertical.svg` | — | Light ground. Type **outlined**. Safe to hand off. |
| `attune-lockup-vertical-dark.svg` | `og-attune.png` | Dark ground. Type outlined. |
| `og-attune.png` | `/attune` og:image + twitter:image | 1200x630, the dark lock-up on `#1B1A18`. |
| `attune-favicon.svg` | `/attune` tab icon | Graphite ground, so one file serves both browser themes. |
| `attune-appicon.svg` | `/attune` JSON-LD `logo` | The app icon, graphite ground. |
| `attune-appicon-180.png` | `/attune` apple-touch-icon | From the iOS export. |
| `attune-mark.svg` | — | Bare mark, `currentColor`, no ground. For new surfaces. |
| `InstrumentSerif-Regular.woff2` | `/attune` wordmark | Self-hosted; see above. |
| `0*.png` | `/attune` screenshot strip | Shot from the shipping build, not renders. |

`/attune`'s hero lock-up is built live in `site-src/src/pages/attune.astro` rather than dropped in
as one of these SVGs — the page loads the same woff2, so the type matches, and live text stays
selectable, theme-aware and crisp at any size. Its proportions are measured off
`attune-lockup-vertical-dark.svg` and noted in that file's CSS.
