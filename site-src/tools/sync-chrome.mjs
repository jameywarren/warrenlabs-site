// Render the shared header and footer into the hand-written pages.
//
// The homepage, /design-review and /404 are static HTML with no build step of their own, so they
// cannot import a component. Instead each one marks the region it delegates:
//
//   <!-- wl:head:start   -->  ...generated...  <!-- wl:head:end   -->   (tokens + no-flash theme)
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
// Content-hashed asset names, written by tools/vendor.mjs. The hand-written pages have no bundler,
// so without this they'd <link> a stable filename and a warm browser cache could pin them to an old
// stylesheet forever — see the specificity note in vendor.mjs for why shipping a fix isn't enough.
const wlAssets = JSON.parse(
  await readFile(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'wl-assets.json'), 'utf8')
);
const { nav: NAV, footerLinks: FOOTER_LINKS, footerMeta: FOOTER_META, markPath: MARK_PATH } = nav;
const nbsp = (s) => s.replace(/ /g, '\u00a0');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Which static pages carry the shared chrome, and whether their logo is a link.
// The homepage's logo is not a link, because it is already home.
// darkOnly: pin the page to dark and hide the theme toggle. Currently unused — kept because the
// need is real and will recur.
//
// The homepage briefly used it: its rack and patchbay are photorealistic renderings of black
// anodized hardware drawn with 38 hardcoded dark hex literals, and black gear is black in any
// theme. But pinning the whole PAGE was the wrong granularity — those are two sections, so they
// are now DARK ISLANDS (see .rack-zone/.contact in css/styles.css) and the page keeps its toggle.
const PAGES = [
  { file: 'index.html', logoHref: null },
  { file: 'design-review/index.html', logoHref: '/' },
  { file: '404.html', logoHref: '/' },
];

const mark = `<svg class="wl-mark" viewBox="0 0 120 80" aria-hidden="true">
        <path d="${MARK_PATH}" fill="none" stroke="currentColor" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>`;

function header(logoHref, darkOnly) {
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
    ${darkOnly ? '' : '<button class="wl-theme" id="wl-theme" aria-label="Switch between light and dark" title="Light / dark">◐</button>'}
    <button class="nav-toggle" aria-label="Menu" aria-expanded="false" aria-controls="primary-nav">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>`;
}

// The <head> block the static pages delegate. They have no build step, so the tokens arrive as a
// plain <link> to the vendored copy at /wl/wl-tokens.css, and the theme is resolved inline BEFORE
// first paint — applying a stored choice after stylesheets load flashes the wrong palette on every
// navigation. Must be emitted before css/styles.css, which aliases these variables.
function head(darkOnly) {
  if (darkOnly)
    return `<link rel="stylesheet" href="${wlAssets.tokens}">
<script>document.documentElement.setAttribute('data-theme','dark');<\/script>`;
  return `<link rel="stylesheet" href="${wlAssets.tokens}">
<script>
(function(){try{var t=localStorage.getItem('wl-theme');
if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();
<\/script>`;
}

// Light/dark behaviour + the button's styling, injected once per static page. Kept here rather than
// in css/styles.css so the toggle contract lives in exactly one place for both renderers.
function themeScript() {
  return `<style>
.wl-theme{width:32px;height:32px;flex:none;display:grid;place-items:center;margin-left:14px;
  background:none;border:1px solid var(--line);border-radius:50%;color:var(--dim);font-size:14px;
  line-height:1;cursor:pointer;transition:color .14s,border-color .14s}
.wl-theme:hover{color:var(--ink);border-color:var(--faint)}
</style>
<script>
(function(){var b=document.getElementById('wl-theme');if(!b)return;var r=document.documentElement;
var cur=function(){return r.getAttribute('data-theme')||'dark';};
b.addEventListener('click',function(){var n=cur()==='dark'?'light':'dark';
  r.setAttribute('data-theme',n);try{localStorage.setItem('wl-theme',n);}catch(e){}
  var m=document.querySelector('meta[name="theme-color"]');
  if(m)m.setAttribute('content',n==='dark'?'#0c0d0f':'#f7f8f9');
  dispatchEvent(new CustomEvent('wl-theme-change',{detail:{theme:n}}));});})();
<\/script>`;
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
for (const { file, logoHref, darkOnly } of PAGES) {
  const path = join(ROOT, file);
  let html;
  try {
    html = await readFile(path, 'utf8');
  } catch {
    console.warn(`sync-chrome: ${file} not found, skipped`);
    continue;
  }
  const before = html;
  html = replaceBlock(html, 'head', head(darkOnly), file);
  html = replaceBlock(html, 'header', header(logoHref, darkOnly), file);
  html = replaceBlock(html, 'footer', footer() + (darkOnly ? '' : '\n' + themeScript()), file);
  if (html !== before) {
    await writeFile(path, html);
    console.log(`sync-chrome: ${file}`);
    touched += 1;
  }
}
console.log(`sync-chrome: ${touched} page(s) updated from src/data/nav.js`);
