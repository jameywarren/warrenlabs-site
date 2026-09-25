// Fail the build if any published page shows a reader an em dash.
//
// House style (Jamey, 2026-09-25): no em dashes in any copy. Use a colon, a comma, a full stop or
// parentheses. The rule used to be a line in this repo's README that nobody writing an article
// opens, so 350-odd of them reached the live site before anyone noticed. The monorepo's
// tools/gen_site.py already refuses them for /plugins; this is the same check for everything else.
//
// It runs last in `npm run build`, over the repo root: the synced Astro routes, the hand-written
// pages and /plugins, i.e. exactly what GitHub Pages serves.
//
// What it reads, per page: the text, the attributes a person sees or hears (title, alt,
// aria-label, placeholder, meta content), structured data, and the strings in inline scripts. And
// the strings in published .js files, because some of them become on-screen text.
//
// What it skips:
//   - <code>, <pre>, HTML comments, JS comments, <style> and .css. Code is exempt.
//   - A string or text node that is nothing but "—". That is the empty-value glyph (the Attune
//     demo labels an unselected headphone with it, as the plug-ins do a disengaged control), not
//     punctuation.
//   - Other file types, e.g. the SVGs' <desc> design notes and the /audio .md credits file.
//
// Run via `npm run build` from site-src/, or on its own: `node tools/check-copy.mjs`.

import { readFile, readdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SKIP_DIRS = new Set(['.git', 'site-src', 'node_modules']);
const EM = /—|\\u2014|&mdash;|&#8212;|&#x2014;/gi;
const GLYPH_ONLY = /^\s*(—|\\u2014|&mdash;|&#8212;|&#x2014;)\s*$/i;

// Strings of a JS source with its comments removed. Regex literals are copied through so a quote
// inside one cannot open a string. Not a parser, but it only has to find text, not run it.
function jsStrings(src) {
  const out = [];
  let i = 0;
  const n = src.length;
  const regexCanStart = () => /[=(,:!&|?{};\[\s]$|^$|\breturn\s*$/.test(src.slice(Math.max(0, i - 8), i));
  while (i < n) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && src[j] !== c && !(c !== '`' && src[j] === '\n')) j += src[j] === '\\' ? 2 : 1;
      out.push(src.slice(i + 1, j));
      i = j + 1;
    } else if (src.startsWith('/*', i)) {
      const j = src.indexOf('*/', i + 2);
      i = j < 0 ? n : j + 2;
    } else if (src.startsWith('//', i)) {
      const j = src.indexOf('\n', i);
      i = j < 0 ? n : j;
    } else if (c === '/' && regexCanStart()) {
      let j = i + 1;
      while (j < n && src[j] !== '/' && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      i = j + 1;
    } else {
      i++;
    }
  }
  return out;
}

// Every piece of reader-facing text in an HTML page.
function htmlTexts(page) {
  const texts = [];
  let body = page.replace(/<!--[\s\S]*?-->/g, ' ');
  body = body.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_, attrs, js) => {
    if (/ld\+json/i.test(attrs)) texts.push(js);
    else texts.push(...jsStrings(js));
    return ' ';
  });
  body = body.replace(/<(style|code|pre)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  for (const m of body.matchAll(/\s(?:title|alt|aria-label|placeholder|content)="([^"]*)"/gi)) texts.push(m[1]);
  texts.push(...body.replace(/<[^>]*>/g, '\n').split('\n'));
  return texts;
}

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) yield* walk(join(dir, e.name));
    } else {
      yield join(dir, e.name);
    }
  }
}

const found = [];
for await (const path of walk(ROOT)) {
  let texts;
  if (path.endsWith('.html')) texts = htmlTexts(await readFile(path, 'utf8'));
  else if (/\.m?js$/.test(path)) texts = jsStrings(await readFile(path, 'utf8'));
  else continue;
  for (const t of texts) {
    if (GLYPH_ONLY.test(t)) continue;
    for (const m of t.matchAll(EM)) {
      const ctx = t.slice(Math.max(0, m.index - 60), m.index + 50).replace(/\s+/g, ' ').trim();
      found.push(`${relative(ROOT, path)}: ...${ctx}...`);
    }
  }
}

if (found.length) {
  console.error(`check-copy: FAILED, ${found.length} em dash(es) in reader-facing copy. House style is none ` +
    'outside code (see README.md, Identity). Reword each at its source under site-src/ or in the ' +
    'hand-written page, and rebuild. Do not commit this build.');
  for (const f of found) console.error('  ' + f);
  process.exit(1);
}
console.log('check-copy: no em dashes in published copy');
