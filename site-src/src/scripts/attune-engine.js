// Shared engine for the interactive Attune demo widgets embedded on /attune.
//
// THE CURVES ARE REAL, AND THEY ARE OURS. Every response drawn here is a real measurement of that
// exact headphone, made on our own miniDSP EARS Pro (see src/data/demo-curves.js, regenerated from
// the shipping corpus on every build) — raw, normalized at 1 kHz, seated for best fit.
//
// The demo used to draw HeadRoom archive curves. Removed 2026-08-05 with the rest of the archive:
// a graph labelled "Sennheiser HD 650" reads as our measurement of an HD 650 no matter how clearly
// the surrounding page says "demo", and the app cannot load archive data at all. Same rule as the
// synthetic-curve removal below — if a headphone has no measurement of ours, it is not in the
// picker.
//
// This replaces a synthetic `curveFor(seed)` that invented shelves-and-bumps and labelled
// them "Sennheiser HD 800 S", "Focal Utopia", "Audeze LCD-3". A code comment admitted it;
// the page never did. On a site whose whole position is honest measurement, a visitor could
// not tell our real graphs from our fake ones — so there were no real ones. Removed
// 2026-07-16. Do NOT reintroduce a synthetic fallback: if a headphone has no measurement,
// it does not belong in the picker.
//
// The DSP is still an approximation — this is a marketing preview, not the shipping engine.
// Real data, honest illustration of the interaction.
//
// Loaded as an ES module — Vite/Astro dedupes repeated imports of the same
// module path, so the `window.AttuneShared` singleton below is only built once
// no matter how many demo components import this file.

import { GRID_HZ, DEMO_CANS } from '../data/demo-curves.js';

if (!window.AttuneShared) {
  const CANS = DEMO_CANS.map((c) => ({ id: c.id, brand: c.brand, name: c.name, role: c.role }));

  // id -> [{hz, db}], built once from the shared log grid.
  const CURVES = new Map(
    DEMO_CANS.map((c) => [c.id, c.db.map((db, i) => ({ hz: GRID_HZ[i], db }))])
  );

  // The archive stops in 2014, so "yours" is the reference that is both in it and still on
  // sale: the HD 650. (The demo previously fixed "yours" to an HD 6XX — same driver, but not
  // a headphone that exists in the corpus.) The default target is the HD 800, not the
  // Orpheus: the Orpheus is selectable, but it is not the thing we lead with.
  const DEFAULT_YOURS = 'sennheiser-hd-650';
  const DEFAULT_TARGET = 'sennheiser-hd-800';

  // IDs are corpus slugs now, not array indices. An unknown id falls back rather than
  // synthesising anything — there is no curve here that isn't a measurement.
  const curveFor = (id) => CURVES.get(id) ?? CURVES.get(DEFAULT_YOURS);

  function magAt(pts, hz) {
    if (!pts.length) return 0;
    if (hz <= pts[0].hz) return pts[0].db;
    if (hz >= pts[pts.length - 1].hz) return pts[pts.length - 1].db;
    let lo = 0,
      hi = pts.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      pts[m].hz <= hz ? (lo = m) : (hi = m);
    }
    const t = (Math.log(hz) - Math.log(pts[lo].hz)) / (Math.log(pts[hi].hz) - Math.log(pts[lo].hz));
    return pts[lo].db + t * (pts[hi].db - pts[lo].db);
  }

  function selectPair(yoursId, targetId) {
    const yc = CANS.find((c) => c.id === yoursId);
    const tc = CANS.find((c) => c.id === targetId);
    const yours = curveFor(yoursId || DEFAULT_YOURS);
    const target = curveFor(targetId || DEFAULT_TARGET);
    // Both curves are on one baseline and one grid, so the match is the target itself —
    // the same cancellation the real engine relies on.
    const matched = yours.map((p, i) => ({ hz: p.hz, db: target[i].db }));
    return {
      yours,
      target,
      matched,
      label: `${yc ? yc.brand + ' ' + yc.name : '—'} → ${tc ? tc.brand + ' ' + tc.name : '—'}`,
    };
  }

  // ---- canvas graph -------------------------------------------------------
  function drawGraph(cv, curves) {
    const ctx = cv.getContext('2d');
    const cs = getComputedStyle(document.documentElement);
    const col = (name, fallback) => (cs.getPropertyValue(name) || fallback).trim();
    const w = cv.clientWidth,
      h = cv.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const L = 34,
      R = 8,
      T = 8,
      B = 20,
      pw = w - L - R,
      ph = h - T - B,
      lo = -18,
      hi = 18;
    const x = (hz) => L + pw * (Math.log(hz / 20) / Math.log(1000));
    const y = (db) => T + ph * (1 - (Math.max(lo, Math.min(hi, db)) - lo) / (hi - lo));
    ctx.font = '9px var(--mono)';
    ctx.textBaseline = 'middle';
    const line = col('--line', '#34383d');
    const lineSoft = col('--line-soft', '#24272b');
    const muted = col('--muted', '#868d92');
    for (const db of [-12, -6, 0, 6, 12]) {
      ctx.strokeStyle = db === 0 ? line : lineSoft;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(L, y(db));
      ctx.lineTo(w - R, y(db));
      ctx.stroke();
      ctx.fillStyle = muted;
      ctx.textAlign = 'right';
      ctx.fillText((db > 0 ? '+' : '') + db, L - 6, y(db));
    }
    for (const f of [100, 1000, 10000]) {
      ctx.strokeStyle = lineSoft;
      ctx.beginPath();
      ctx.moveTo(x(f), T);
      ctx.lineTo(x(f), h - B);
      ctx.stroke();
      ctx.fillStyle = muted;
      ctx.textAlign = 'center';
      ctx.fillText(f >= 1000 ? f / 1000 + 'k' : f, x(f), h - B + 11);
    }
    const stroke = (pts, color, width) => {
      if (!pts.length) return;
      const anchor = magAt(pts, 1000);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const f = 20 * Math.pow(1000, i / 200);
        const px = x(f),
          py = y(magAt(pts, f) - anchor);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    };
    if (curves.target) stroke(curves.target, col('--accent', '#FF9E2C'), 1.6);
    if (curves.yours) stroke(curves.yours, col('--raw', '#565b60'), 1.4);
    if (curves.matched) stroke(curves.matched, col('--text', '#e8ebed'), 2.2);
  }

  function sizeAndDraw(cv, getCurves) {
    const dpr = window.devicePixelRatio || 1;
    const r = cv.getBoundingClientRect();
    cv.width = Math.max(1, r.width * dpr);
    cv.height = Math.max(1, r.height * dpr);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGraph(cv, getCurves());
  }

  // ResizeObserver fires once as soon as it starts observing (with the element's
  // current size), so this also solves the initial-layout race where the canvas
  // gets measured before the surrounding grid/flex layout has settled.
  function observeAndDraw(cv, getCurves) {
    const ro = new ResizeObserver(() => sizeAndDraw(cv, getCurves));
    ro.observe(cv);
    return ro;
  }

  // ---- typeahead picker ----------------------------------------------------
  function initPicker(root, corpus, onSelect) {
    const input = root.querySelector('input');
    const menu = root.querySelector('.at-menu');
    const render = (q = '') => {
      const needle = q.toLowerCase();
      menu.innerHTML = corpus
        .filter((c) => (c.brand + ' ' + c.name).toLowerCase().includes(needle))
        .slice(0, 60)
        .map((c) => `<div class="opt" data-id="${c.id}">${c.name}<span class="b">${c.brand}</span></div>`)
        .join('');
    };
    input.addEventListener('focus', () => {
      // Focusing an already-filled field should browse the full list, not filter
      // by its own "Brand – Name" display text (which matches nothing).
      render('');
      input.select();
      menu.classList.add('open');
    });
    input.addEventListener('input', () => {
      render(input.value);
      menu.classList.add('open');
    });
    input.addEventListener('blur', () => setTimeout(() => menu.classList.remove('open'), 150));
    menu.addEventListener('mousedown', (e) => {
      const opt = e.target.closest('.opt');
      if (!opt) return;
      const c = corpus.find((x) => x.id === opt.dataset.id);
      if (!c) return;
      input.value = `${c.brand} – ${c.name}`;
      menu.classList.remove('open');
      onSelect(c.id);
    });
    return {
      setValue(id) {
        const c = corpus.find((x) => x.id === id);
        if (c) input.value = `${c.brand} – ${c.name}`;
      },
    };
  }

  // ---- file-loop audio engine ----------------------------------------------
  // The "hear it" demo plays a short, loudness-matched music loop (public/audio/,
  // CC BY 4.0 — see public/audio/CREDITS.md) through the same four BiquadFilters the
  // graph drives, so the Stock/Matched difference is audible on real material rather
  // than a synth pad. Default is the cinematic loop; switch with setTrack(url).
  // label = the vibe the visitor picks; title/artist/credit = the CC-BY attribution
  // (also in public/audio/CREDITS.md). Keep the credit visible wherever these play.
  const TRACKS = [
    { id: 'cinematic', url: '/audio/cinematic.mp3', label: 'Cinematic', title: 'Aphelion', artist: 'Scott Buckley', credit: 'Scott Buckley · CC BY 4.0' },
    { id: 'vocal', url: '/audio/vocal.mp3', label: 'Vocal', title: 'Wade', artist: 'Josh Woodward', credit: 'Josh Woodward · CC BY 4.0' },
    { id: 'electronic', url: '/audio/electronic.mp3', label: 'Electronic', title: 'Simulacra', artist: 'Scott Buckley', credit: 'Scott Buckley · CC BY 4.0' },
  ];

  class WebAudioEngine {
    constructor() {
      this.ctx = null;
      this.playing = false;
      this.mode = 'stock';
      this.curves = null;
      this.trackUrl = TRACKS[0].url;
      this.buffers = new Map(); // url -> decoded AudioBuffer (cached)
      this.source = null; // active looping BufferSource
    }

    ensureContext() {
      if (this.ctx) return;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const bands = [150, 800, 3000, 9000];
      const types = ['lowshelf', 'peaking', 'peaking', 'highshelf'];
      const filters = bands.map((freq, i) => {
        const f = ctx.createBiquadFilter();
        f.type = types[i];
        f.frequency.value = freq;
        if (types[i] === 'peaking') f.Q.value = 0.9;
        f.gain.value = 0;
        return f;
      });
      // Chain: source -> filters[0] -> filters[1] -> ... -> master -> destination
      for (let i = 0; i < filters.length - 1; i++) filters[i].connect(filters[i + 1]);
      filters[filters.length - 1].connect(master);

      this.ctx = ctx;
      this.master = master;
      this.filters = filters;
      this._applyMode();
    }

    async _loadBuffer(url) {
      if (this.buffers.has(url)) return this.buffers.get(url);
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      const buf = await this.ctx.decodeAudioData(arr);
      this.buffers.set(url, buf);
      return buf;
    }

    // Start the looping source for the current track (idempotent).
    async _ensureSource() {
      if (this.source) return;
      const buf = await this._loadBuffer(this.trackUrl);
      if (!this.ctx || this.source) return; // a switch may have raced us
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(this.filters[0]);
      src.start();
      this.source = src;
    }

    // Sample the matched-vs-yours delta at the filter bands and ramp gains to it.
    _gainsFor(mode) {
      if (mode !== 'matched' || !this.curves) return [0, 0, 0, 0];
      const { yours, matched } = this.curves;
      const anchorY = magAt(yours, 1000);
      const anchorM = magAt(matched, 1000);
      return [150, 800, 3000, 9000].map((hz) => {
        const delta = (magAt(matched, hz) - anchorM) - (magAt(yours, hz) - anchorY);
        return Math.max(-9, Math.min(9, delta));
      });
    }

    setCurves(curves) {
      this.curves = curves;
      this._applyMode();
    }

    _applyMode() {
      if (!this.ctx) return;
      const gains = this._gainsFor(this.mode);
      const now = this.ctx.currentTime;
      this.filters.forEach((f, i) => f.gain.setTargetAtTime(gains[i], now, 0.06));
    }

    setMode(mode) {
      this.mode = mode;
      this._applyMode();
    }

    // Swap the looping track. Restarts the source so the new loop plays under the
    // current gain (audible immediately if playing, silent if paused).
    async setTrack(url) {
      if (url === this.trackUrl && this.source) return;
      this.trackUrl = url;
      if (!this.ctx) return;
      if (this.source) {
        try {
          this.source.stop();
        } catch (e) {
          /* already stopped */
        }
        this.source.disconnect();
        this.source = null;
      }
      await this._ensureSource();
    }

    async play() {
      this.ensureContext();
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      await this._ensureSource();
      this.playing = true;
      this.master.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.08);
    }

    pause() {
      if (!this.ctx) return;
      this.playing = false;
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
    }

    toggle() {
      return this.playing ? this.pause() : this.play();
    }
  }

  window.AttuneShared = { CANS, curveFor, magAt, selectPair, drawGraph, sizeAndDraw, observeAndDraw, initPicker, WebAudioEngine, TRACKS };
}
