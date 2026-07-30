// Render the shared header and footer into the hand-written pages.
//
// The homepage, /design-review and /404 are static HTML with no build step of their own, so they
// cannot import a component. Instead each one marks the region it delegates:
//
//   <!-- wl:header:start -->  ...generated...  <!-- wl:header:end -->
//   <!-- wl:footer:start -->  ...generated...  <!-- wl:footer:end -->
//
// This script replaces whatever sits between those markers with markup built from
// src/data/nav.js, so the hand-written pages and the 24 Astro pages always carry the same links.
// Anything outside the markers is left alone.
//
// Runs as part of `npm run build`. A page without markers is skipped and reported, so adding a
// new static page and forgetting to mark it is visible rather than silent.

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// Read the canonical JSON directly rather than importing nav.js: this runs in plain Node, which
// requires an import attribute for JSON, while Vite (which serves nav.js to Astro) does not.
const nav = JSON.parse(
  await readFile(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'nav.json'), 'utf8')
);
const { nav: NAV, footerLinks: FOOTER_LINKS, footerMeta: FOOTER_META, markPath: MARK_PATH } = nav;
const nbsp = (s) => s.replace(/ /g, '\u00a0');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Which static pages carry the shared chrome, and whether their logo is a link.
// The homepage's logo is not a link, because it is already home.
const PAGES = [
  { file: 'index.html', logoHref: null },
  { file: 'design-review/index.html', logoHref: '/' },
  { file: '404.html', logoHref: '/' },
];

const mark = `<svg class="wl-mark" viewBox="0 0 120 80" aria-hidden="true">
        <path d="${MARK_PATH}" fill="none" stroke="currentColor" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>`;

function header(logoHref) {
  const logo = logoHref
    ? `<a class="logo-mark" href="${logoHref}" style="text-decoration:none;">`
    : '<div class="logo-mark">';
  const logoEnd = logoHref ? '</a>' : '</div>';
  const links = NAV.map(
    (l) => `<a${l.cta ? ' class="cta"' : ''} href="${l.href}">${nbsp(l.label)}</a>`
  ).join('');
  return `<header>
  <div class="head-in">
    ${logo}
      ${mark}
      <span>WARREN&nbsp;LABS</span>
    ${logoEnd}
    <nav id="primary-nav">
      ${links}
    </nav>
    <button class="nav-toggle" aria-label="Menu" aria-expanded="false" aria-controls="primary-nav">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>`;
}

function footer() {
  const links = FOOTER_LINKS.map((l) => `<a href="${l.href}">${nbsp(l.label)}</a>`).join('');
  const meta = FOOTER_META.map((m) => `<span>${m}</span>`).join('');
  return `<footer>
  <div class="foot-in">
    <div class="foot-links">${links}</div>
    <div class="foot-meta">${meta}</div>
  </div>
</footer>`;
}

function replaceBlock(html, name, body, file) {
  const start = `<!-- wl:${name}:start -->`;
  const end = `<!-- wl:${name}:end -->`;
  const i = html.indexOf(start);
  const j = html.indexOf(end);
  if (i === -1 || j === -1) {
    console.warn(`sync-chrome: ${file} has no wl:${name} markers, skipped`);
    return html;
  }
  return html.slice(0, i + start.length) + '\n' + body + '\n' + html.slice(j);
}

let touched = 0;
for (const { file, logoHref } of PAGES) {
  const path = join(ROOT, file);
  let html;
  try {
    html = await readFile(path, 'utf8');
  } catch {
    console.warn(`sync-chrome: ${file} not found, skipped`);
    continue;
  }
  const before = html;
  html = replaceBlock(html, 'header', header(logoHref), file);
  html = replaceBlock(html, 'footer', footer(), file);
  if (html !== before) {
    await writeFile(path, html);
    console.log(`sync-chrome: ${file}`);
    touched += 1;
  }
}
console.log(`sync-chrome: ${touched} page(s) updated from src/data/nav.js`);
