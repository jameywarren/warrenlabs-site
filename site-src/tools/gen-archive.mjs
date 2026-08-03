// Emit the full HeadRoom archive as a lazily-fetched, content-hashed JSON.
//
// WHY NOT INLINE IT. The 40 curated curves are ~29 KB inlined into /graphs, which is fine. All 319
// is ~235 KB — an 8x payload increase imposed on every visitor for content that is OFF by default
// and that most will never switch on. So the archive ships as a separate file, fetched the first
// time someone enables the toggle and cached in memory after that. The page stays the same weight
// it is today; only people who ask for the archive pay for it.
//
// Content-hashed for the same reason as wl-tokens/wl-plot (see vendor.mjs): these are referenced by
// a plain fetch with no bundler in the path, so a stable filename means a warm cache can pin a
// visitor to stale data indefinitely.
//
// CROSS-REPO READ, and it is temporary. This reaches into ../../../attune for measurement data,
// which warren-labs/REPO-BOUNDARY.md names as exactly the wrong direction — the corpus is a LAB
// asset that attune should consume, not own. When the corpus moves to
// warren-labs/measurements/corpus/, change ARCHIVE_SRC below and nothing else here needs to move.
//
// RIGHTS: the HeadRoom archive is licensing-clean, retained from the 2018 headphone.com sale
// (attune/docs/data-provenance.md §2.0). Publishing the full set beyond the curated 40 was
// authorised by Jamey on 2026-08-03. Render-only still applies: no download control anywhere, and
// the rig is named wherever a curve is drawn.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ARCHIVE_SRC = resolve(here, '../../../../attune/Assets/Curves/headroom.dat');
const PUBLIC_WL = resolve(here, '../public/wl');
const MANIFEST = resolve(here, '../src/data/wl-assets.json');

if (!existsSync(ARCHIVE_SRC)) {
  console.error(`\n  archive not found at ${ARCHIVE_SRC}\n`);
  process.exit(1);
}

const text = await readFile(ARCHIVE_SRC, 'utf8');
const models = [];
let grid = null;

for (const line of text.split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  if (line.startsWith('GRID')) {
    // "GRID <n> <lo> <hi>" — reconstruct the log axis the curves are sampled on. The site's own
    // GRID_HZ is the same 128-point 20 Hz–20 kHz axis (verified to 0.02%), so the archive drops
    // straight onto it without resampling.
    const [, n, lo, hi] = line.trim().split(/\s+/);
    const N = Number(n);
    grid = Array.from({ length: N }, (_, i) => +(Number(lo) * (Number(hi) / Number(lo)) ** (i / (N - 1))).toFixed(2));
    continue;
  }
  const [id, b, n, vals] = line.split('|');
  if (!vals) continue;
  models.push({ id, b, n, db: vals.split(',').map((v) => Math.round(Number(v) * 10) / 10) });
}

models.sort((a, x) => (a.b + a.n).localeCompare(x.b + x.n));

const body = JSON.stringify({ grid, models });
const h = createHash('sha256').update(body).digest('hex').slice(0, 8);
const name = `archive.${h}.json`;

await mkdir(PUBLIC_WL, { recursive: true });
await writeFile(resolve(PUBLIC_WL, name), body);

const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {};
manifest.archive = `/wl/${name}`;
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

console.log(`  archive   ${models.length} curves -> public/wl/${name} (${(body.length / 1024).toFixed(0)} KB, fetched on demand)`);
