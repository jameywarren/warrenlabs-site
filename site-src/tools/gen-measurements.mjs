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
// CROSS-REPO READ, temporary: warren-labs/REPO-BOUNDARY.md says the corpus is a LAB asset that
// attune should consume rather than own. When it moves to warren-labs/measurements/corpus/, change
// SRC below and nothing else here changes.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '../../../../attune/Assets/Curves');
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

for (const [srcName, outName, exportName, blurb] of [
  ['warren-labs.dat', 'measurements.js', 'MEASUREMENTS',
   `// WARREN LABS FIRST-PARTY MEASUREMENTS, on our own miniDSP EARS Pro. The PRIMARY corpus for
// /graphs, and the same rows the app ships — regenerated every build so the two cannot drift.
//
// Raw, same-rig, NOT diffuse-field compensated. 128-point log grid, 20 Hz - 20 kHz.
// The HeadRoom archive is a DIFFERENT fixture and never shares an axis with these.`],
  ['references.dat', 'targets.js', 'REFERENCES',
   `// DISPLAY reference shapes. NOT the app's voice-match targets — see gen-measurements.mjs for why
// targets.dat must never be published as a reference line.`],
]) {
  const path = resolve(SRC, srcName);
  if (!existsSync(path)) {
    console.error(`  gen-measurements: missing ${srcName}`);
    process.exit(1);
  }
  const rows = parse(await readFile(path, 'utf8'));
  const head = `// GENERATED from attune/Assets/Curves/${srcName} by tools/gen-measurements.mjs.\n// DO NOT HAND-EDIT — it is rewritten on every build.\n//\n${blurb}\n`;

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
  console.log(`  measured  ${srcName} -> ${outName} (${rows.length})`);
}
