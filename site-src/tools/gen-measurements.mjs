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

// ---------------------------------------------------------------- contributed
//
// Measurements other people sent us, on the same MODEL of rig. A SEPARATE export from a SEPARATE
// file, for the reason tools/measure/caliper_ingest.mjs spells out: warren-labs.dat is the corpus
// Attune ships, and a contributed row reaching it would be compiled into the app against a
// baseline it was never measured on. The split is structural; check_corpus_separation.mjs gates
// this build on it.
//
// Optional by design. Most checkouts have no contributed.dat and the site builds exactly as before
// — this emits an empty export rather than failing, because "nobody has contributed yet" is a
// normal state and not a broken build.
{
  const datRel = 'earspro/contributed.dat';
  const datPath = resolve(SRC, datRel);
  const metaPath = resolve(SRC, 'earspro/contributed.json');
  const rows = existsSync(datPath) ? parse(await readFile(datPath, 'utf8')) : [];
  const meta = existsSync(metaPath) ? JSON.parse(await readFile(metaPath, 'utf8')) : { rows: {} };

  // THE BAND TRAVELS WITH ITS OWN CURVE, per band, never as one global figure.
  //
  // graphs.astro has carried a disabled seating band since 2026-08-05 with the re-enable condition
  // written into the source: "store a per-model seating sd per band alongside each curve, and draw
  // each curve's own band." The reason it stayed off is that seating sd is a property of the
  // HEADPHONE, not the rig — 0.059 dB on an HD 800 right against 0.316 dB on a PM-3 right, same
  // bench, same control band — so one global band would overstate the good models and understate
  // the bad ones. Caliper measures it per run, per band, which is exactly the missing input.
  //
  // sdDb rather than spreadDb: any range statistic widens with sample count, so a longer, better
  // run would read as a worse one. See BandSpread in caliper/engine/include/caliper/Stats.h.
  const out = rows.map((r) => {
    const m = meta.rows?.[r.id] ?? {};
    const band = (m.spread ?? [])
      .filter((b) => Number.isFinite(b.lo) && Number.isFinite(b.hi))
      .map((b) => ({ lo: b.lo, hi: b.hi, sd: Number(b.sdDb ?? 0) }));
    return {
      id: r.id, b: r.b, n: r.n, db: r.db,
      by: m.measurer ?? null,
      tier: m.tier ?? null,
      unit: m.unit ?? null,
      rig: m.rig?.fixture ?? null,
      rigSerial: m.rig?.fixtureSerial ?? null,
      seatings: m.seatings?.l ?? null,
      band,
    };
  });

  const head = `// GENERATED from warren-labs/measurements/corpus/${datRel} by tools/gen-measurements.mjs.
// DO NOT HAND-EDIT — it is rewritten on every build.
//
// CONTRIBUTED MEASUREMENTS — other people's, on the same MODEL of miniDSP EARS Pro. NOT ours and
// NOT Attune's corpus; see MEASUREMENTS in measurements.js for that.
//
// A spread across these rows contains four things at once: the headphone unit, the operator's
// seating, the individual fixture, and its calibration. Two EARS Pro units are not one rig. That
// is the point of this file rather than a flaw in it — the question being answered is how
// reproducible a published headphone measurement is — and it carries one hard rule with it:
// THIS MAY NEVER BE PRESENTED AS "THE RESPONSE OF THIS HEADPHONE". It is the reproducibility of a
// measurement of it. See warren-labs/docs/measurement-hosting.md §2e.
//
// Each row carries its own per-band seating sd, its measurer, and the tier it earned, because all
// three are needed to weigh it and none of them can be inferred from the curve.
`;
  const body = `export const CONTRIBUTED = ${JSON.stringify(out, null, 2)};\n`;
  await writeFile(resolve(OUT, 'contributed.js'), head + '\n' + body);
  console.log(`  contributed  ${rows.length ? datRel : '(none yet)'} -> contributed.js (${rows.length})`);
}
