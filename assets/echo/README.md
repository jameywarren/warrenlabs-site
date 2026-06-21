# Warren Labs — Echo mark (identity v1.0, LOCKED)

Source of truth: Claude Design project "Warren Labs logo refinement"
(`af365e57-2ff6-4805-b267-3129ccea3b9a`), file *Warren Labs Echo — Usage Spec v1.0*.
These SVGs are the authorised renderings — scale them or drop dot count for small
sizes; never reshape, re-angle, re-curve, or re-mirror the trail.

## The mark
Four dots — a lit lead plus a 3-step decaying tail (a cresting arc that trails away,
lead low-right). Canonical coords on a 200×100 artboard:

| dot   | cx  | cy | r     | opacity |
|-------|-----|----|-------|---------|
| lead  | 152 | 80 | 15    | 1.00    |
| 2     | 104 | 44 | 10.35 | 0.66    |
| 3     | 66  | 25 | 6.9   | 0.42    |
| 4     | 34  | 12 | 4.2   | 0.26    |

Size ratio 1 · .69 · .46 · .28 · saturation 100 · 66 · 42 · 26 %.

## Color
- `#FF9E2C` amber — the master (lead-dot glow is amber-master only, never load-bearing)
- `#0F1012` graphite
- `#F2EEE7` light

## Files
- `wl-echo_master.svg` — amber + lead glow (primary, dark surfaces)
- `wl-echo_light.svg` — graphite tones, for light surfaces
- `wl-echo_mono-black.svg` / `wl-echo_mono-white.svg` — flat, size-based falloff
- `wl-echo_etch.svg` — single-color hardware engraving
- `wl-echo_atom.svg` — the bare lit lead point (LED); the ultimate collapse
- `wl-echo_favicon_48|32|16.svg` — degrade by count (all 4 / lead+2 / lead+1)
- `wl-echo_lockup-h_dark|light.svg`, `wl-echo_lockup-stacked_dark.svg` — wordmark
  lockups (Barlow 600, tracked; gap = 0.6 × cap-height)

## On the site
The header renders the master mark inline (so it inherits `--echo-amber` and carries
the glow); the favicon uses the 32 px ladder step (lead+2). See `index.html`.
