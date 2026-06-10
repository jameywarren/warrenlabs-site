# Warren Labs — warrenlabs.com

Personal site for Jamey Warren / Warren Labs: a single-page portfolio built as a piece of studio hardware. Static HTML/CSS/JS, no build step, no dependencies. Hosted on GitHub Pages.

## What's on the page

- **Hero** — live mouse-reactive oscilloscope under the Warren Labs wordmark
- **The Rack** — projects as units in a 3D-angled 19" rack; click a unit to pull it out fullscreen
  - **WL-EQ1** — a genuinely playable headphone EQ + crossfeed demo (Web Audio: pink noise → 3 biquads → crossfeed → gain)
  - **WL-TF1 Tone Farmers** — record label with an artist-favorable split
  - **WL-SB1 Sonic Bloom** — platform for working musicians
- **About** — bio plus three era cards (Grace Design, HeadRoom, The Cosmic)
- **Patch In** — contact section with a 12-channel patchbay and a physics-simulated patch cable (verlet rope); click a jack to re-patch

## Identity

Locked from the design phase: **steel** palette (`#3fd2e4` accent on near-black blue), **Oswald** condensed display type, 12° rack tilt. Fonts via Google Fonts (Oswald, Archivo, IBM Plex Mono).

## Structure

```
index.html        — the whole page
css/styles.css    — all styling, responsive at 1080px and 720px
js/wl-app.js      — oscilloscope, rack parallax, unit overlays
js/wl-eq1.js      — playable EQ + crossfeed plugin (Web Audio)
js/wl-patchbay.js — patchbay cable physics
assets/           — images
```

## Local preview

```
python3 -m http.server 8000
```

then open http://localhost:8000.
