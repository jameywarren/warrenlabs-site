/* wl-web — the line-wide frequency-response plotting core.
 *
 * WHY THIS EXISTS
 * Before 2026-08-02 there were FOUR independent implementations of "draw a headphone FR curve":
 *   warrenlabs-site /graphs (canvas, 684 lines) · attune web/index.html (canvas)
 *   ProductGraph.astro (SVG, 40 product pages) · AttuneMiniGraph.astro (SVG)
 * None shared code, three of the four hardcoded their colours, and nothing synced. That is why the
 * site and the app read as different companies and why adding light mode was four jobs.
 *
 * This module is the extracted CANVAS core. It is deliberately NOT a chart library: it owns scales,
 * grid, curve stroking, band fills, and theme reads — the parts that must agree across surfaces —
 * and leaves layout, interaction, and legends to each caller, which genuinely do differ.
 *
 * The renderer is modelled on ATTUNE's, which was the good one: it already read its colours from CSS
 * custom properties, handled devicePixelRatio, and distinguished traces by dash as well as hue. The
 * site's version hardcoded hex. So the app set the pattern and the site is being brought up to it.
 *
 * LOADING: this is a CLASSIC script that assigns globalThis.WLPlot — not an ES module. Attune's page
 * is one large classic <script> and Astro's define:vars blocks are forced inline, so a global is the
 * only form both consumers can take without restructuring. Don't "modernise" it to `export` without
 * fixing both callers first.
 *
 * Pair with wl-tokens.css — every colour here is read from those custom properties at draw time, so
 * a theme switch needs no JS beyond a redraw.
 */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- theme */

  // Read once per draw, not per primitive: getComputedStyle is a layout-flush hazard in a loop.
  function readTokens(el) {
    var s = getComputedStyle(el || document.documentElement);
    var g = function (n) {
      return s.getPropertyValue(n).trim();
    };
    return {
      bg: g('--wl-graph-bg'),
      grid: g('--wl-graph-grid'),
      grid0: g('--wl-graph-grid0'),
      axis: g('--wl-graph-axis'),
      anno: g('--wl-graph-anno'),
      band: g('--wl-graph-band'),
      series: [
        g('--wl-series-1'), g('--wl-series-2'), g('--wl-series-3'),
        g('--wl-series-4'), g('--wl-series-5'), g('--wl-series-6'),
      ],
      yours: g('--wl-trace-yours'),
      target: g('--wl-trace-target'),
      matched: g('--wl-trace-matched'),
      mono: g('--wl-mono') || 'monospace',
    };
  }

  /* ------------------------------------------------------------- geometry */

  // Size the backing store to devicePixelRatio and return CSS-pixel dimensions. Callers draw in CSS
  // pixels and get crisp output on Retina. Returns null when the element has no layout yet (display
  // none, detached) so callers can bail instead of dividing by zero.
  function fitCanvas(cv) {
    var r = cv.getBoundingClientRect();
    var w = Math.max(1, Math.floor(r.width));
    var h = Math.max(1, Math.floor(r.height));
    if (r.width < 2 || r.height < 2) return null;
    var dpr = window.devicePixelRatio || 1;
    cv.width = w * dpr;
    cv.height = h * dpr;
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }

  // Plot box inside the gutters. `aspect` (width:height) holds the plot's SHAPE constant across
  // window sizes, so a curve scales instead of squishing and two screenshots stay comparable — the
  // slack becomes even letterbox/pillarbox margin. Pass aspect: null to fill the available area.
  function plotBox(w, h, opts) {
    var o = opts || {};
    var gL = o.left == null ? 46 : o.left;
    var gR = o.right == null ? 14 : o.right;
    var gT = o.top == null ? 14 : o.top;
    var gB = o.bottom == null ? 30 : o.bottom;
    var availW = w - gL - gR;
    var availH = h - gT - gB;
    if (availW < 40 || availH < 40) return null;
    var pw = availW;
    var ph = availH;
    if (o.aspect) {
      if (availW / availH > o.aspect) { ph = availH; pw = Math.round(ph * o.aspect); }
      else { pw = availW; ph = Math.round(pw / o.aspect); }
    }
    return {
      L: gL + Math.round((availW - pw) / 2),
      T: gT + Math.round((availH - ph) / 2),
      pw: pw,
      ph: ph,
    };
  }

  // Log-frequency X and linear-dB Y. Y clamps so an out-of-range excursion pins to the edge instead
  // of scribbling across the chrome; callers that want true clipping should ctx.clip() the box.
  function scales(box, f0, f1, lo, hi) {
    var lf0 = Math.log(f0);
    var span = Math.log(f1) - lf0;
    return {
      x: function (hz) { return box.L + ((Math.log(hz) - lf0) / span) * box.pw; },
      y: function (db) {
        var v = Math.max(lo, Math.min(hi, db));
        return box.T + (1 - (v - lo) / (hi - lo)) * box.ph;
      },
      // inverse, for hover: pixel → Hz
      hzAt: function (px) { return f0 * Math.pow(f1 / f0, (px - box.L) / box.pw); },
      lo: lo, hi: hi, f0: f0, f1: f1,
    };
  }

  /* ------------------------------------------------------------------ data */

  // Log-interpolated magnitude at an arbitrary frequency, over [{hz,db}]. Binary search: callers
  // sample this a few hundred times per curve per frame.
  function magAt(pts, hz) {
    if (!pts || !pts.length) return 0;
    if (hz <= pts[0].hz) return pts[0].db;
    var last = pts.length - 1;
    if (hz >= pts[last].hz) return pts[last].db;
    var lo = 0, hi = last;
    while (hi - lo > 1) {
      var m = (lo + hi) >> 1;
      if (pts[m].hz <= hz) lo = m; else hi = m;
    }
    var t = (Math.log(hz) - Math.log(pts[lo].hz)) / (Math.log(pts[hi].hz) - Math.log(pts[lo].hz));
    return pts[lo].db + t * (pts[hi].db - pts[lo].db);
  }

  // Moving average over an already-resampled array. COSMETIC ONLY — this smooths the drawn line,
  // never the audio and never the stored data. Computed curves (a target, a correction) come out of
  // linear interpolation with visible corners; dense measured data already reads smooth.
  function smooth(a, taps) {
    var k = Math.max(1, ((taps || 5) - 1) >> 1);
    var o = new Array(a.length);
    for (var i = 0; i < a.length; i++) {
      var s = 0, n = 0;
      for (var j = i - k; j <= i + k; j++) if (j >= 0 && j < a.length) { s += a[j]; n++; }
      o[i] = s / n;
    }
    return o;
  }

  // Resample a curve onto N log-spaced points across the scale, optionally re-referenced.
  // `ref(hz)` returns the dB value to subtract at that frequency — that is how "normalize at 1 kHz",
  // "align over 250–4000 Hz", and "show everything relative to the target" are all expressed.
  function resample(pts, sc, n, ref) {
    n = n || 260;
    var out = new Array(n + 1);
    for (var i = 0; i <= n; i++) {
      var hz = sc.f0 * Math.pow(sc.f1 / sc.f0, i / n);
      out[i] = magAt(pts, hz) - (ref ? ref(hz) : 0);
    }
    return out;
  }

  // Mean level over a frequency BAND, which is what "Alignment range" means: normalizing at a single
  // point makes two curves agree exactly there and exaggerates everything nearby, so a band is the
  // more honest anchor. Pass lo === hi for classic single-frequency normalization.
  function bandLevel(pts, loHz, hiHz) {
    if (loHz === hiHz) return magAt(pts, loHz);
    var n = 48, s = 0;
    for (var i = 0; i <= n; i++) s += magAt(pts, loHz * Math.pow(hiHz / loHz, i / n));
    return s / (n + 1);
  }

  /* ------------------------------------------------------------- primitives */

  var TICKS = [20, 30, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

  function fmtHz(f) {
    return f >= 1000 ? f / 1000 + 'k' : String(f);
  }

  function drawGrid(ctx, sc, box, C, opts) {
    var o = opts || {};
    var ticks = o.freqTicks || TICKS;
    var step = o.dbStep || (sc.hi - sc.lo > 60 ? 20 : sc.hi - sc.lo > 30 ? 10 : 5);

    ctx.lineWidth = 1;
    ctx.strokeStyle = C.grid;
    for (var i = 0; i < ticks.length; i++) {
      var x = Math.round(sc.x(ticks[i])) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, box.T); ctx.lineTo(x, box.T + box.ph); ctx.stroke();
    }
    for (var d = Math.ceil(sc.lo / step) * step; d <= sc.hi + 0.01; d += step) {
      var y = Math.round(sc.y(d)) + 0.5;
      ctx.strokeStyle = d === 0 ? C.grid0 : C.grid;
      ctx.beginPath(); ctx.moveTo(box.L, y); ctx.lineTo(box.L + box.pw, y); ctx.stroke();
    }

    if (o.labels === false) return;
    ctx.fillStyle = C.axis;
    ctx.font = '400 10px ' + C.mono;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (var k = 0; k < ticks.length; k++) ctx.fillText(fmtHz(ticks[k]), sc.x(ticks[k]), box.T + box.ph + 8);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (var e = Math.ceil(sc.lo / step) * step; e <= sc.hi + 0.01; e += step) {
      ctx.fillText(e > 0 ? '+' + e : String(e), box.L - 8, sc.y(e));
    }
  }

  // Catmull-Rom through the points: the data is already smoothed, this only rounds the corners so
  // the result reads as a curve rather than a polyline.
  function strokeSpline(ctx, pts) {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      ctx.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
        p2[0], p2[1]
      );
    }
    ctx.stroke();
  }

  // Stroke a resampled series. `dash` is not decoration: it is the non-colour channel that keeps
  // series distinguishable under colour-blindness and in greyscale. Attune uses it for yours vs
  // target vs matched; keep using it wherever three or more traces share a plot.
  function strokeSeries(ctx, sc, values, opts) {
    var o = opts || {};
    var n = values.length - 1;
    var pts = new Array(n + 1);
    for (var i = 0; i <= n; i++) {
      pts[i] = [sc.x(sc.f0 * Math.pow(sc.f1 / sc.f0, i / n)), sc.y(values[i])];
    }
    ctx.strokeStyle = o.color || '#888';
    ctx.lineWidth = o.width || 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash(o.dash || []);
    if (o.spline === false) {
      ctx.beginPath();
      for (var j = 0; j <= n; j++) j ? ctx.lineTo(pts[j][0], pts[j][1]) : ctx.moveTo(pts[j][0], pts[j][1]);
      ctx.stroke();
    } else {
      strokeSpline(ctx, pts);
    }
    ctx.setLineDash([]);
    return pts;
  }

  // Filled region between two resampled series — a variance band, a house-target envelope, a
  // preference range. Same sampling contract as strokeSeries so the edges line up exactly.
  function fillBand(ctx, sc, upper, lower, color) {
    var n = upper.length - 1;
    if (n < 1) return;
    var hzAt = function (i) { return sc.f0 * Math.pow(sc.f1 / sc.f0, i / n); };
    ctx.beginPath();
    for (var i = 0; i <= n; i++) {
      var x = sc.x(hzAt(i)), y = sc.y(upper[i]);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    for (var j = n; j >= 0; j--) ctx.lineTo(sc.x(hzAt(j)), sc.y(lower[j]));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // The frequency-band strip (Sub bass … Air). The cheapest measurement-literacy feature there is:
  // it tells a first-time reader what part of the sound each region of the plot corresponds to,
  // without them leaving the page for an explainer.
  var BANDS = [
    { from: 20, to: 60, label: 'Sub bass' },
    { from: 60, to: 200, label: 'Mid bass' },
    { from: 200, to: 800, label: 'Lower mid' },
    { from: 800, to: 2500, label: 'Upper mid' },
    { from: 2500, to: 8000, label: 'Treble' },
    { from: 8000, to: 20000, label: 'Air' },
  ];

  function drawBandLabels(ctx, sc, box, C, y) {
    ctx.fillStyle = C.anno;
    ctx.font = '400 9px ' + C.mono;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.75;
    for (var i = 0; i < BANDS.length; i++) {
      var b = BANDS[i];
      var mid = Math.sqrt(b.from * b.to); // geometric centre — the visual centre on a log axis
      var x = sc.x(mid);
      if (x < box.L + 12 || x > box.L + box.pw - 12) continue;
      ctx.fillText(b.label.toUpperCase(), x, y);
    }
    ctx.globalAlpha = 1;
  }

  globalThis.WLPlot = {
    readTokens: readTokens,
    fitCanvas: fitCanvas,
    plotBox: plotBox,
    scales: scales,
    magAt: magAt,
    smooth: smooth,
    resample: resample,
    bandLevel: bandLevel,
    drawGrid: drawGrid,
    strokeSeries: strokeSeries,
    strokeSpline: strokeSpline,
    fillBand: fillBand,
    drawBandLabels: drawBandLabels,
    BANDS: BANDS,
    TICKS: TICKS,
    fmtHz: fmtHz,
  };
})();
