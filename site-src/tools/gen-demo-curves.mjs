// Emit src/data/demo-curves.js from OUR OWN measurements.
//
// WHY THIS EXISTS. demo-curves.js used to be 15 curves lifted from the HeadRoom archive — real
// headphones, named on screen, plotted inside the Attune demo widgets on the marketing pages. When
// the archive stopped being something we publish (2026-08-05, see warren-labs/docs/moat-strategy.md
// §1.2) those widgets were the last place it survived, and they are the worst place to leave it: a
// graph labelled "Sennheiser HD 650" reads as our measurement of an HD 650 whether or not the page
// around it is a demo. Nobody parses "this is only marketing" off a curve.
//
// It also had no generator. The header pointed at tools/extract-demo-curves.mjs, which does not
// exist in this repo, so the file was an unreproducible artifact holding data we no longer stand
// behind. This replaces both problems at once: the demo now draws from the same EARS Pro corpus the
// product ships, regenerated on every build, and it cannot drift from it.
//
// ROLES. The demo pairs a "source" (what you own) with a "target" (what you want it to sound like).
// Assignment is by bass tilt: the darker half of the corpus are sources, the brighter half targets,
// which makes the default pairing show an audible correction rather than a flat line. With a corpus
// this small that is a display convenience, not a claim about the headphones.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '../src/data/measurements.js');
const OUT = resolve(here, '../src/data/demo-curves.js');

const { MEASUREMENTS } = await import(SRC);
const { GRID_HZ } = await import(resolve(here, '../src/data/curves.js'));

if (MEASUREMENTS.length < 2) {
  console.error(`\n  gen-demo-curves: need at least 2 measurements, have ${MEASUREMENTS.length}.`);
  console.error('  The Attune demo widgets pair a source with a target and cannot run on fewer.\n');
  process.exit(1);
}

// Bass tilt: mean level below 200 Hz relative to the 1 kHz anchor the corpus is normalized on.
const idx200 = GRID_HZ.findIndex((f) => f >= 200);
const tilt = (db) => db.slice(0, idx200).reduce((a, b) => a + b, 0) / idx200;

const ranked = [...MEASUREMENTS].sort((a, b) => tilt(a.db) - tilt(b.db));
const half = Math.ceil(ranked.length / 2);
const withRole = ranked.map((m, i) => ({ ...m, role: i < half ? 'source' : 'target' }));

const body = withRole
  .map((m) => `  { id: ${JSON.stringify(m.id)}, brand: ${JSON.stringify(m.b)}, `
    + `name: ${JSON.stringify(m.n)}, role: ${JSON.stringify(m.role)}, `
    + `db: [${m.db.join(',')}] },`)
  .join('\n');

const out = `// GENERATED, do not edit by hand. Regenerate:
//     node tools/gen-demo-curves.mjs
//
// Curves for the Attune demo widgets, taken from WARREN LABS' OWN MEASUREMENTS on the miniDSP
// EARS Pro — the same rows the product ships, regenerated every build so a marketing page can
// never show a curve the app cannot load.
//
// Raw, NOT diffuse-field compensated, normalized to 0 dB at 1 kHz, one unit per model, seated for
// best fit (warren-labs/MEASUREMENT-PIPELINE.md §1).
//
// HONEST LIMITS, because this data is shown to the public:
//  - Reseat repeatability on this bench is not characterized yet. Do not present fine treble
//    detail off these curves as settled, and do not draw a variance band from another rig's SD.
//  - An EARS Pro is a house reference, not an industry reference coupler.
//  - NEVER add a curve from another fixture to this file. Two fixtures never share an axis
//    (§4.1), and a demo is not an exception to that.

export const GRID_HZ = [${GRID_HZ.join(',')}];

export const DEMO_CANS = [
${body}
];
`;

await writeFile(OUT, out);
console.log(`gen-demo-curves: ${withRole.length} curve(s) from our own bench `
  + `(${withRole.filter((m) => m.role === 'source').length} source, `
  + `${withRole.filter((m) => m.role === 'target').length} target)`);
