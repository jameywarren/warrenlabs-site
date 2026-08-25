// Regenerate the first-party measurement data the site publishes, from the lab corpus.
//
// WHY THIS IS A BUILD STEP AND NOT A ONE-OFF EXTRACT.
// It started as a hand-run script, and within a day the site was serving curves that no longer
// matched the app's shipped corpus — same ids, values off by up to 11 dB on the FT1, because the
// measurements were reprocessed upstream and nothing pulled the change through. The site was
// publishing one thing under a name the app used for another. Running it every build makes drift
// impossible rather than merely unlikely.
//
// Emits:
//   src/data/measurements.js  — MEASUREMENTS, the first-party EARS Pro corpus (the site's default)
//   src/data/targets.js       — REFERENCES, display-only reference SHAPES
//
// The targets/references split is deliberate and load-bearing. targets.dat is the app's voice-match
// target: re-anchored to the EARS Pro rig and DELIBERATELY carrying that rig's artifacts (notably a
// ~13 kHz coupler resonance the GRAS RA0402 damps) so that target - yours cancels them. Correct in
// the app; drawn as a reference LINE on a published graph it reads as a spike. Published graphs use
// references.dat — smooth, rig-agnostic shapes. Never publish targets.dat.
//
// SAME-REPO READ since 2026-08-04. This used to reach across into ../../../attune, which
// REPO-BOUNDARY.md names as the wrong direction: the corpus is a LAB asset that attune consumes
// rather than owns. It now lives in the lab repo this site is checked out inside.
//
// The source paths carry their FIXTURE, because the corpus is split by baseline and the directory
// name IS the baseline identifier (MEASUREMENT-PIPELINE.md §5.1). warren-labs.dat is earspro/;
// references.dat is rig-agnostic/ because it is not on any rig's axis at all. If a path here ever
// needs a `../` to reach across those directories, something has gone wrong.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '../../../measurements/corpus');
const OUT = resolve(here, '../src/data');

function parse(file) {
  const rows = [];
  for (const line of file.split('\n')) {
    if (!line.trim() || line.startsWith('#') || line.startsWith('GRID')) continue;
    const [id, b, n, vals] = line.split('|');
    if (!vals) continue;
    rows.push({ id, b, n, db: vals.split(',').map((v) => Math.round(Number(v) * 100) / 100) });
  }
  return rows;
}

for (const [srcRel, outName, exportName, blurb] of [
  ['earspro/warren-labs.dat', 'measurements.js', 'MEASUREMENTS',
   `// WARREN LABS FIRST-PARTY MEASUREMENTS, on our own miniDSP EARS Pro. The PRIMARY corpus for
// /graphs, and the same rows the app ships — regenerated every build so the two cannot drift.
//
// Raw, same-rig, NOT diffuse-field compensated. 128-point log grid, 20 Hz - 20 kHz.
// The HeadRoom archive is a DIFFERENT fixture and never shares an axis with these.
//
// LICENCE (added 2026-08-25): CC BY-NC 4.0, https://creativecommons.org/licenses/by-nc/4.0/
// Attribution: Warren Labs, https://warrenlabs.com/graphs
// Commercial licensing: jamey@warrenlabs.com
// Covers the measured rows in THIS file only. First-party EARS Pro data, measured and owned by
// Warren Labs. Full resolution is published deliberately; see docs/measurement-publishing.md for
// the decision and the trigger that would revisit it.`],
  ['rig-agnostic/references.dat', 'targets.js', 'REFERENCES',
   `// DISPLAY reference shapes. NOT the app's voice-match targets — see gen-measurements.mjs for why
// targets.dat must never be published as a reference line.
//
// DELIBERATELY NOT CC BY-NC. These are rig-agnostic reference SHAPES derived from public research
// (KEMAR diffuse field, an in-room preference shape), not Warren Labs measurements, so they are not
// ours to license. Claiming a licence over them would be the false-provenance error that
// attune/docs/headroom-title-brief.md §8.7 warns about. Keep the notice scoped to measurements.js.`],
]) {
  const path = resolve(SRC, srcRel);
  if (!existsSync(path)) {
    console.error(`  gen-measurements: missing ${srcRel} under ${SRC}`);
    process.exit(1);
  }
  const rows = parse(await readFile(path, 'utf8'));
  const head = `// GENERATED from warren-labs/measurements/corpus/${srcRel} by tools/gen-measurements.mjs.\n// DO NOT HAND-EDIT — it is rewritten on every build.\n//\n${blurb}\n`;

  let body;
  if (exportName === 'MEASUREMENTS') {
    body =
      `export const ${exportName} = [\n` +
      rows.map((r) => `  { id: "${r.id}", b: "${r.b}", n: "${r.n}", db: [${r.db.join(', ')}] },`).join('\n') +
      '\n];\n';
  } else {
    body =
      `export const ${exportName} = {\n` +
      rows.map((r) => `  "${r.id}": { name: "${r.n}", db: [${r.db.join(', ')}] },`).join('\n') +
      '\n};\n';
  }
  await writeFile(resolve(OUT, outName), head + '\n' + body);
  console.log(`  measured  ${srcRel} -> ${outName} (${rows.length})`);
}
