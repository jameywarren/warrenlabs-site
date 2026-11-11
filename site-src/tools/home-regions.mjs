// The homepage's product facts, rendered from data. Called by tools/sync-chrome.mjs for index.html.
//
//   <!-- wl:doors:start -->    the three doors (Listen, Measure, Mix)   <!-- wl:doors:end -->
//   <!-- wl:measure:start -->  the Send one in offer card               <!-- wl:measure:end -->
//
// Why: every stale fact the homepage has carried lived in hand-typed copy (Level "not yet
// notarized", Attune iOS "in review", Proof "coming soon" a month after it shipped). A page that
// types no price or status by hand cannot carry a stale one. Spec: warren-labs
// docs/homepage-lab-first.md (2026-11-11), which supersedes docs/homepage-redesign.md.
//
// Sources, each read at build time:
//   src/data/attune.js        Attune store link, CTA label, platforms
//   src/data/apps.js          Caliper and Proof (dated copies of their own repos' owners)
//   src/data/measure.js       the mail-in price, lanes and turnaround (the owner)
//   ../../web/plugins.json    Level, the bundles, the Whole Lab, betaTerms (the owner, in the
//                             monorepo). MISSING FILE FAILS THE BUILD: a site-only clone must not
//                             publish an empty Mix door or fall back to stale text.
//
// The build guard (assertCard) refuses a card with no status or price, a status outside STATUSES,
// or a store status with no store link. It exists so "Coming soon" cannot come back unnoticed:
// add a status word here deliberately or not at all.
//
// No em dashes in anything rendered: check-copy.mjs runs after this and will fail the build.

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_STORE, ATTUNE } from '../src/data/attune.js';
import { CALIPER, PROOF } from '../src/data/apps.js';
import { MEASURE } from '../src/data/measure.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGINS_JSON = join(HERE, '..', '..', '..', 'web', 'plugins.json');

let plugins;
try {
  plugins = JSON.parse(await readFile(PLUGINS_JSON, 'utf8'));
} catch (e) {
  throw new Error(
    `home-regions: cannot read ${PLUGINS_JSON} (${e.code ?? e.message}). The homepage Mix door is ` +
      'built from the monorepo web/plugins.json; build from inside warren-labs, never from a site-only clone.'
  );
}

/** The only status words a homepage card may show. */
export const STATUSES = new Set(['ON THE APP STORE', 'ON THE MAC APP STORE', 'SHIPPING', 'PUBLIC BETA']);
const STORE_STATUSES = new Set(['ON THE APP STORE', 'ON THE MAC APP STORE']);
// plugins.json `status` -> card status. Anything else fails the build rather than guessing.
const PLUGIN_STATUS = { Shipping: 'SHIPPING', Beta: 'PUBLIC BETA' };

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const up = (s) => esc(String(s).toUpperCase());

function fail(msg) {
  throw new Error(`home-regions: ${msg}`);
}

function assertCard(c) {
  if (!c.status) fail(`${c.name} has no status`);
  if (!c.price) fail(`${c.name} has no price`);
  if (!STATUSES.has(c.status)) fail(`${c.name} status "${c.status}" is not one of ${[...STATUSES].join(', ')}`);
  if (STORE_STATUSES.has(c.status) && !/^https:\/\/apps\.apple\.com\//.test(c.store ?? ''))
    fail(`${c.name} says "${c.status}" but has no App Store link`);
}

function pluginStatus(p) {
  const s = PLUGIN_STATUS[p.status];
  if (!s) fail(`plugins.json: ${p.slug} has status "${p.status}", which the homepage has no word for`);
  return s;
}

function dollars(n, what) {
  if (typeof n !== 'number' || !(n > 0)) fail(`plugins.json: ${what} has no price`);
  return `$${n}`;
}

// Kind, status and price are separate fields on purpose (docs/homepage-redesign.md D3 graft):
// a status change is a data change, never a copy edit.
function meta(c) {
  assertCard(c);
  return `<div class="dc-meta mono"><span class="dc-kind">${up(c.kind)}</span><span class="dc-status">${up(c.status)}</span><span class="dc-price">${up(c.price)}</span></div>`;
}

const arrow = '<span aria-hidden="true">&rarr;</span>';
const ext = '<span aria-hidden="true">&#8599;</span>';

// ---------------------------------------------------------------- Listen: Attune
function listen() {
  const attune = {
    name: 'Attune',
    kind: 'Headphone EQ app by Warren Labs',
    status: `ON THE ${ATTUNE.storeName.toUpperCase()}`,
    price: 'FREE',
    store: APP_STORE,
  };
  // No price and no 1.1.0-only feature here, on purpose: /attune/ owns both, and this card has to
  // be true on every platform the day it ships (docs/homepage-lab-first.md §3).
  return `<section class="door door-listen" id="listen" aria-labelledby="listen-h">
      <div class="door-k mono">LISTEN <span class="sig">&middot;</span> YOU OWN HEADPHONES</div>
      <article class="dcard dcard-lead">
        ${meta(attune)}
        <h2 class="dc-name display" id="listen-h">Attune</h2>
        <p class="dc-sub">Tune your headphones by ear.</p>
        <p class="dc-body">Attune plays your own music, loudness matched, and asks which of two tunings you like better, so you find your sound by ear. Or hear another headphone&rsquo;s tuning on the pair you own, then shape the rest with a parametric EQ or Fix by ear. One saved sound is free and stays free. Pro is a one-time unlock, not a subscription.</p>
        <div class="dc-cta"><a class="btn primary" href="${esc(APP_STORE)}" target="_blank" rel="noopener">${esc(ATTUNE.ctaLabel)} ${ext}</a><span class="dc-plat mono">${up(ATTUNE.platformLine)}</span></div>
      </article>
      <p class="door-links mono"><a href="/attune/">HOW ATTUNE WORKS ${arrow}</a><a href="/collections/headphones/">HEADPHONES ${arrow}</a><a href="/graphs/">MEASUREMENTS ${arrow}</a></p>
    </section>`;
}

// ---------------------------------------------------------------- Measure: Caliper, Proof
function measure() {
  const caliper = { ...CALIPER, kind: `App · ${CALIPER.platforms}` };
  const proof = { ...PROOF, kind: `App · ${PROOF.platforms}` };
  return `<section class="door door-measure" id="measure" aria-labelledby="measure-h">
      <div class="door-k mono">MEASURE <span class="sig">&middot;</span> YOU TEST GEAR</div>
      <article class="dcard">
        ${meta(caliper)}
        <h2 class="dc-name display" id="measure-h">Caliper</h2>
        <p class="dc-body">Headphone measurement for ${esc(CALIPER.platforms)}. It measures a headphone on an acoustic fixture and tells you how much of the curve is real. It is the software this bench runs on.</p>
        <div class="dc-cta"><a class="btn ghost" href="${esc(CALIPER.page)}">See Caliper ${arrow}</a></div>
      </article>
      <a class="dcard dcard-mini" href="${esc(PROOF.page)}">
        ${meta(proof)}
        <h3 class="dc-name-sm display">Proof</h3>
        <p class="dc-body">An audio measurement instrument. It measures its own noise and distortion first, then reports every reading against that floor.</p>
      </a>
      <p class="door-links mono"><a href="/method/">HOW I MEASURE ${arrow}</a><a href="/measure/">SEND ONE IN ${arrow}</a><a href="/loaners/">FOR MAKERS ${arrow}</a></p>
    </section>`;
}

// ---------------------------------------------------------------- Mix: Level + bundles
function mix() {
  const live = plugins.plugins.filter((p) => !p.draft);
  const bySlug = Object.fromEntries(live.map((p) => [p.slug, p]));
  const level = bySlug.level ?? fail('plugins.json has no public "level" entry');

  const levelCard = {
    name: level.name,
    kind: 'Plugin · AU and VST3 for macOS',
    status: pluginStatus(level),
    price: dollars(level.price, 'level'),
  };

  // A bundle is a public beta while any member is one. Members are named from the data, so a
  // rename or a merge reaches the homepage without a copy edit; drafts never appear.
  const bundleStatus = (members) => {
    const ms = members.map((s) => bySlug[s] ?? fail(`plugins.json: bundle member "${s}" is missing or a draft`));
    return ms.some((p) => pluginStatus(p) === 'PUBLIC BETA') ? 'PUBLIC BETA' : 'SHIPPING';
  };
  const rows = [
    ...plugins.bundles.map((b) => ({
      name: b.name,
      href: `/plugins/#${b.slug}`,
      price: dollars(b.price, b.slug),
      status: bundleStatus(b.members),
      line: b.members.map((s) => bySlug[s].name).join(', '),
    })),
    {
      name: plugins.wholeLab.name,
      href: `/plugins/#${plugins.wholeLab.slug}`,
      price: dollars(plugins.wholeLab.price, 'wholeLab'),
      status: bundleStatus(plugins.wholeLab.members),
      line: plugins.wholeLab.tagline,
    },
  ];
  for (const r of rows) assertCard({ ...r, store: null });

  const list = rows
    .map(
      (r) =>
        `<li><a href="${esc(r.href)}"><span class="db-nm">${esc(r.name)}</span><span class="db-pr mono">${esc(r.price)}</span><span class="db-st mono">${up(r.status)}</span><span class="db-ln">${esc(r.line)}</span></a></li>`
    )
    .join('\n          ');

  const terms = String(plugins.betaTerms ?? '').replace(/\.?\s*$/, '.');

  // "The same correction engine Attune runs on": both Level/CMakeLists.txt and attune/CMakeLists.txt
  // build ../level-engine (checked 2026-11-11). If either stops, this sentence goes.
  return `<section class="door door-mix" id="mix" aria-labelledby="mix-h">
      <div class="door-k mono">MIX <span class="sig">&middot;</span> YOU MAKE RECORDS</div>
      <article class="dcard">
        ${meta(levelCard)}
        <h2 class="dc-name display" id="mix-h">${esc(level.name)}</h2>
        <p class="dc-body">Headphone correction and crossfeed for your DAW, built on the same correction engine Attune runs on.</p>
        <div class="dc-cta"><a class="btn ghost" href="/plugins/">See the plugins ${arrow}</a></div>
        <ul class="dc-bundles">
          ${list}
        </ul>
        <p class="dc-note">${esc(terms)} Try any of them free first.</p>
      </article>
      <p class="door-links mono"><a href="/plugins/downloads/">FREE TRIALS ${arrow}</a><a href="/plugins/guides/">GUIDES ${arrow}</a></p>
    </section>`;
}

export function renderDoors() {
  return `<div class="doors wrap">
    ${listen()}
    ${measure()}
    ${mix()}
  </div>`;
}

// ---------------------------------------------------------------- Send one in
export function renderMeasure() {
  return `<a class="offer" href="/measure/">
      <div class="offer-main">
        <div class="offer-k mono">SEND ONE IN</div>
        <h3 class="display">Your pair, on my rig</h3>
        <p>I measure your unit on the EARS Pro, seated for best fit, and send it back ${esc(MEASURE.turnaroundDefined)}. Unit variation is real, and the curve of your own pair is exactly what Attune turns into a personal tuning.</p>
      </div>
      <div class="offer-side mono">
        <div class="offer-spec"><span class="sk">ON MY LIST</span><span class="sv">${esc(MEASURE.onListLane)}</span></div>
        <div class="offer-spec"><span class="sk">ANYTHING ELSE</span><span class="sv">${esc(MEASURE.offListLane)}</span></div>
        <div class="offer-spec"><span class="sk">TURNAROUND</span><span class="sv">${esc(MEASURE.turnaround)}</span></div>
        <span class="offer-note">Published either way, flattering or not.</span>
        <span class="offer-go">SEND ONE IN ${ext}</span>
      </div>
    </a>`;
}
