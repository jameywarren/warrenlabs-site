// fit.js — refit a target curve to a device's OWN band budget and constraints.
//
// WHY THIS EXISTS, since Attune already fits parametric bands.
//
// Attune's buildVoiceMatch() fits 12 bands, and buildParametricEqText() exports them. That is the
// right answer for Attune's own engine, which has 12. It is the wrong answer for a dongle:
//
//   Qudelix-5K   10 bands  -> User EQ, the only group we can write. The app's 20-band mode is a
//                             separate, manual-entry facility: docs/hardware-output-stage.md.
//   FiiO KA/BTR  10 bands  -> same budget.
//   Walkplay      8 bands  -> four have to go.
//   Moondrop      9 bands, PEAK ONLY, +3 dB max, 40 Hz-10 kHz -> shelves cannot even be expressed.
//
// An export now holds up to 21 lines: correction, then tone, then Fine Tune. Truncating to N would
// silently lose the tone and Fine Tune, which come LAST. And throwing away bands is not the same as
// fitting N bands to the curve, because the survivors were never asked to cover what the dropped
// ones were doing. The error does not degrade gracefully; it leaves a hole where a band used to be.
//
// So: fit to the DEVICE, from the whole curve. planForDevice() renders every filter in the file to a
// dense curve and fits that, which is what /tune has to work from, since a pasted ParametricEq.txt
// is all it receives.
//
// Runs in the browser (tune.html) and in node (fit.test.mjs) with no dependencies.

const LN2 = Math.log(2);

// RBJ peaking-filter magnitude in dB at frequency f. Matches Source/TargetShaping.h's biquadDb and
// gen_house_target.py — same formulas, same shape — so a curve fitted here and a curve rendered
// there describe the same filter.
export function peakDb(f, fc, q, gainDb, sr = 48000) {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * fc) / sr;
  const c = Math.cos(w0), al = Math.sin(w0) / (2 * q);
  const b0 = 1 + al * A, b1 = -2 * c, b2 = 1 - al * A;
  const a0 = 1 + al / A, a1 = -2 * c, a2 = 1 - al / A;
  const w = (2 * Math.PI * f) / sr;
  const zr = Math.cos(w), zi = -Math.sin(w);
  const z2r = Math.cos(2 * w), z2i = -Math.sin(2 * w);
  const nr = b0 + b1 * zr + b2 * z2r, ni = b1 * zi + b2 * z2i;
  const dr = a0 + a1 * zr + a2 * z2r, di = a1 * zi + a2 * z2i;
  return 20 * Math.log10(Math.hypot(nr, ni) / Math.hypot(dr, di));
}

function biquadDb(f, b0, b1, b2, a0, a1, a2, sr) {
  const w = (2 * Math.PI * f) / sr;
  const zr = Math.cos(w), zi = -Math.sin(w);
  const z2r = Math.cos(2 * w), z2i = -Math.sin(2 * w);
  const nr = b0 + b1 * zr + b2 * z2r, ni = b1 * zi + b2 * z2i;
  const dr = a0 + a1 * zr + a2 * z2r, di = a1 * zi + a2 * z2i;
  return 20 * Math.log10(Math.hypot(nr, ni) / Math.hypot(dr, di));
}

// RBJ shelves, the same formulas as Source/TargetShaping.h's lowShelfDb and highShelfDb.
export function lowShelfDb(f, fc, q, gainDb, sr = 48000) {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * fc) / sr, c = Math.cos(w0);
  const sa = 2 * Math.sqrt(A) * (Math.sin(w0) / (2 * q));
  return biquadDb(f,
    A * ((A + 1) - (A - 1) * c + sa), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sa),
    (A + 1) + (A - 1) * c + sa, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sa, sr);
}

export function highShelfDb(f, fc, q, gainDb, sr = 48000) {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * fc) / sr, c = Math.cos(w0);
  const sa = 2 * Math.sqrt(A) * (Math.sin(w0) / (2 * q));
  return biquadDb(f,
    A * ((A + 1) + (A - 1) * c + sa), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sa),
    (A + 1) - (A - 1) * c + sa, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sa, sr);
}

// One filter's response. `type` here is the canonical kind (PK, LS, HS), never a file or device
// spelling: those are translated at the edges by filterKind() and deviceType().
export function bandDb(f, b, sr = 48000, gainDb = b.gainDb) {
  if (b.type === 'LS') return lowShelfDb(f, b.fc, b.q, gainDb, sr);
  if (b.type === 'HS') return highShelfDb(f, b.fc, b.q, gainDb, sr);
  return peakDb(f, b.fc, b.q, gainDb, sr);
}

const bandsDb = (bands, f, sr) =>
  bands.reduce((sum, b) => sum + bandDb(f, b, sr), 0);

// EVERY SPELLING OF A SHELF. Attune and AutoEq write LSC/HSC, Qudelix calls them LSQ/HSQ, FiiO LS/HS.
// They are the same filter. Checking a file's spelling against a device's list without translating
// first is how an exported shelf became a PEAK at the shelf's corner, on the one device that has
// shelves, with nothing on screen saying so.
const KINDS = { PK: 'PK', PEQ: 'PK', LS: 'LS', LSC: 'LS', LSQ: 'LS', HS: 'HS', HSC: 'HS', HSQ: 'HS' };
export const filterKind = type => KINDS[String(type).toUpperCase()] || null;
/** The device table's own name for a kind, or null if the device has no such filter. */
export const deviceType = (kind, c) => (c.types || ['PK']).find(t => KINDS[t] === kind) || null;

/**
 * Fit up to `c.maxBands` filters to `target`: peaks, plus shelves if `c.types` names any.
 *
 * @param {{hz:number[], db:number[]}} target  the curve to reproduce
 * @param {object} c   device constraints: {maxBands, minFc, maxFc, minGain, maxGain, types?}
 * @returns {{bands:Array, rms:number, peak:number}}
 */
export function fitToDevice(target, c, opts = {}) {
  const sr = opts.sampleRate || 48000;
  const refine = opts.refinePasses ?? 3;
  const qGrid = opts.qGrid || [0.5, 0.7, 1.0, 1.4, 2.0, 2.8, 4.0];

  // Only fit where the device can actually act. Points outside its frequency range are excluded
  // from the error too — counting error we are forbidden to correct would drag every band toward a
  // region none of them can reach, making the whole fit worse to no purpose.
  const idx = target.hz.map((h, i) => i).filter(i => target.hz[i] >= c.minFc && target.hz[i] <= c.maxFc);
  if (!idx.length) return { bands: [], rms: 0, peak: 0 };

  const residual = idx.map(i => target.db[i]);
  const hz = idx.map(i => target.hz[i]);
  const bands = [];
  const clampGain = g => Math.max(c.minGain, Math.min(c.maxGain, g));
  const errAgainst = (shape, gain) => {
    let err = 0;
    for (let i = 0; i < hz.length; i++) {
      const e = residual[i] - bandDb(hz[i], shape, sr, gain);
      err += e * e;
    }
    return err;
  };
  // Least-squares gain for a shape against what is left, inside the device's limits.
  const bestGain = shape => {
    let num = 0, den = 0;
    for (let i = 0; i < hz.length; i++) {
      const unit = bandDb(hz[i], shape, sr, 1.0);
      num += unit * residual[i];
      den += unit * unit;
    }
    return clampGain(den > 1e-12 ? num / den : 0);
  };
  const apply = (b, sign) => {
    for (let i = 0; i < hz.length; i++) residual[i] += sign * bandDb(hz[i], b, sr);
  };

  // A shelf only ever enters as a candidate, so it has to beat a peak on total error to be chosen.
  const shelfCandidates = [];
  const inRange = fc => fc >= c.minFc && fc <= c.maxFc;
  for (const q of [0.5, 0.7, 1.0]) {
    if (deviceType('LS', c)) for (const fc of [40, 63, 100, 160, 250, 400, 630]) if (inRange(fc)) shelfCandidates.push({ type: 'LS', fc, q });
    if (deviceType('HS', c)) for (const fc of [1000, 1600, 2500, 4000, 6300, 10000]) if (inRange(fc)) shelfCandidates.push({ type: 'HS', fc, q });
  }

  // Greedy peel: repeatedly attack the largest remaining error. Each pass picks the frequency of
  // the worst residual, then searches Q for the one that removes the most total error — a wide
  // error needs a low Q and a narrow one a high Q, and guessing wrong wastes a band.
  for (let n = 0; n < c.maxBands; n++) {
    let wi = 0;
    for (let i = 1; i < residual.length; i++) if (Math.abs(residual[i]) > Math.abs(residual[wi])) wi = i;
    if (Math.abs(residual[wi]) < 0.05) break;   // nothing worth a band

    const fc = hz[wi];
    let best = null;
    for (const q of qGrid) {
      const shape = { type: 'PK', fc, q };
      const gain = clampGain(residual[wi]);
      const err = errAgainst(shape, gain);
      if (!best || err < best.err) best = { shape, gain, err };
    }
    for (const shape of shelfCandidates) {
      const gain = bestGain(shape);
      const err = errAgainst(shape, gain);
      if (err < best.err) best = { shape, gain, err };
    }
    const band = { ...best.shape, gainDb: best.gain };
    bands.push(band);
    apply(band, -1);
  }

  // Refine gains only, holding fc/Q. Bands placed early were given a gain that assumed nothing else
  // existed; once later bands overlap them, that gain is wrong. One coordinate-descent sweep per
  // pass fixes most of it, and moving only gains keeps every band inside the device's limits.
  for (let pass = 0; pass < refine; pass++) {
    for (const b of bands) {
      apply(b, +1);
      b.gainDb = bestGain(b);   // least-squares optimum for this band's shape against what is left
      apply(b, -1);
    }
  }

  // Then let each band move a little. Greedy placement puts a band on the worst single point, which
  // with few bands to spare is rarely the best place for it once its neighbours exist. The current
  // setting is one of the options, so a band only moves when the total error drops.
  for (let pass = 0; pass < (opts.polishPasses ?? 2); pass++) {
    for (const b of bands) {
      apply(b, +1);
      let best = { fc: b.fc, q: b.q, gainDb: b.gainDb, err: errAgainst(b, b.gainDb) };
      for (const fm of [0.891, 0.944, 1, 1.059, 1.122]) {
        for (const qm of [0.8, 1, 1.25]) {
          const shape = { type: b.type, fc: Math.max(c.minFc, Math.min(c.maxFc, b.fc * fm)), q: b.q * qm };
          const gainDb = bestGain(shape);
          const err = errAgainst(shape, gainDb);
          if (err < best.err) best = { fc: shape.fc, q: shape.q, gainDb, err };
        }
      }
      b.fc = best.fc; b.q = best.q; b.gainDb = best.gainDb;
      apply(b, -1);
    }
  }

  const kept = bands.filter(b => Math.abs(b.gainDb) >= 0.05);
  let sq = 0, peak = 0;
  for (let i = 0; i < hz.length; i++) {
    const e = target.db[idx[i]] - bandsDb(kept, hz[i], sr);
    sq += e * e;
    peak = Math.max(peak, Math.abs(e));
  }
  return { bands: kept, rms: Math.sqrt(sq / hz.length), peak };
}

/** Error of an existing band set against a curve — used to compare truncation vs refit. */
export function errorOf(bands, target, c, sr = 48000) {
  const idx = target.hz.map((h, i) => i).filter(i => target.hz[i] >= c.minFc && target.hz[i] <= c.maxFc);
  let sq = 0, peak = 0;
  for (const i of idx) {
    const e = target.db[i] - bandsDb(bands, target.hz[i], sr);
    sq += e * e;
    peak = Math.max(peak, Math.abs(e));
  }
  return { rms: Math.sqrt(sq / idx.length), peak };
}

// ---------------------------------------------------------------------------------------------
// From a pasted file to what a device is sent. Pure, so plan.test.mjs can hold tune.html to it.
// ---------------------------------------------------------------------------------------------

/** Parse AutoEq ParametricEq.txt. An ON line we cannot read is counted, never skipped in silence. */
export function parsePeq(text) {
  const bands = [];
  let preamp = 0, unread = 0;
  for (const line of text.split(/\r?\n/)) {
    const pre = line.match(/Preamp:\s*([-+]?[\d.]+)\s*dB/i);
    if (pre) { preamp = parseFloat(pre[1]); continue; }
    if (!/Filter[^:]*:\s*ON\b/i.test(line)) continue;
    const m = line.match(/Filter\s*\d*:\s+ON\s+(\w+)\s+Fc\s+([\d.]+)\s*Hz\s+Gain\s+([-+]?[\d.]+)\s*dB(?:\s+Q\s+([\d.]+))?/i);
    const type = m && m[1].toUpperCase();
    // Q is optional on a shelf only: APO's plain LS and HS carry none and mean a Butterworth slope.
    const q = m && (m[4] !== undefined ? +m[4] : (['PK', 'PEQ'].includes(type) ? NaN : 0.707));
    if (m && Number.isFinite(q)) bands.push({ type, fc: +m[2], gain: +m[3], q });
    else unread++;
  }
  return { preamp, bands, unread };
}

const logGrid = (lo, hi, n) => Array.from({ length: n }, (_, i) => lo * Math.pow(hi / lo, i / (n - 1)));

/**
 * The most a band set boosts anywhere, in dB, never below 0. Checked on a fine grid, at every band's
 * own centre, and at the common sample rates, because a biquad's shape near the top of the band
 * depends on the rate the device happens to be running.
 */
export function peakBoostDb(bands) {
  const fs = [...logGrid(20, 20000, 480), ...bands.map(b => b.fc).filter(f => f >= 20 && f <= 20000)];
  let peak = 0;
  for (const sr of [44100, 48000, 96000])
    for (const f of fs) peak = Math.max(peak, bandsDb(bands, f, sr));
  return peak;
}

/**
 * Decide exactly what a device is sent for a parsed file, and how far that is from the file.
 *
 * A file the device can hold as written goes as written, with only its type names translated. Anything
 * else is refitted WHOLE from the parsed filters, so no line is lost to its position in the file. The
 * preamp always comes from what is written, because the file's preamp was only ever right for the file.
 *
 * Returned bands are { type (the device's own name), fc, gain, q }, rounded to what the wire carries,
 * so the error reported is the error of the values actually sent.
 *
 * flat means the file parsed cleanly and asks for nothing: no bands, and sending is still meaningful,
 * because padToSlots turns that into every slot at 0 dB, which is how a dongle gets cleared.
 */
export function planForDevice(parsed, c, opts = {}) {
  const sr = opts.sampleRate || 48000;
  const file = [], ignored = [];
  for (const b of parsed.bands) {
    const type = filterKind(b.type);
    if (!type || !(b.fc > 0 && b.fc < sr / 2) || !(b.q > 0)) { ignored.push(b); continue; }
    if (Math.abs(b.gain) >= 0.05) file.push({ type, fc: b.fc, q: b.q, gainDb: b.gain });   // zero gain is inert
  }

  const shelvesCut = file.filter(b => !deviceType(b.type, c)).length;
  const overBudget = file.length > c.maxBands;
  const outOfRange = file.filter(b => b.fc < c.minFc || b.fc > c.maxFc || b.gainDb < c.minGain || b.gainDb > c.maxGain).length;
  const refit = !!(shelvesCut || overBudget || outOfRange);

  const hz = logGrid(20, 20000, 240);
  const curve = hz.map(f => bandsDb(file, f, sr));
  const chosen = refit
    ? fitToDevice({ hz, db: curve }, c, { sampleRate: sr, qGrid: [0.5, 0.7, 1.0, 1.4, 2.0, 2.8, 4.0, 5.6, 8.0] }).bands
    : file;

  const written = chosen
    .map(b => ({ type: b.type, fc: Math.max(c.minFc, Math.min(c.maxFc, Math.round(b.fc))),
                 q: Math.round(b.q * 1000) / 1000, gainDb: Math.round(b.gainDb * 10) / 10 }))
    .filter(b => b.gainDb !== 0);

  let sq = 0, peak = 0, peakHz = 0;
  hz.forEach((f, i) => {
    const e = Math.abs(curve[i] - bandsDb(written, f, sr));
    sq += e * e;
    if (e > peak) { peak = e; peakHz = f; }
  });

  // Rounded toward more headroom: the wire carries 0.1 dB, and rounding up would be a small clip.
  const preampDb = -Math.ceil(peakBoostDb(written) * 10 - 1e-9) / 10 || 0;

  return {
    bands: written.map(b => ({ type: deviceType(b.type, c), fc: b.fc, gain: b.gainDb, q: b.q })),
    preampDb, filePreampDb: parsed.preamp,
    refit, overBudget, outOfRange, shelvesCut,
    flat: !written.length && parsed.bands.length > 0 && !ignored.length && !parsed.unread,
    fileCount: file.length, ignored, unread: parsed.unread || 0,
    rms: Math.sqrt(sq / hz.length), peak, peakHz,
  };
}

// A write only touches the slots it names, so a shorter curve would leave the last tuning's bands
// playing in the rest: an audible error, and boost the preamp above never accounted for. Flatten them.
// A peak at 0 dB passes everything whatever its Fc and Q, so 1 kHz at Q 1 is only a valid placeholder.
export const padToSlots = (bands, n) =>
  [...bands, ...Array.from({ length: Math.max(0, n - bands.length) }, () => ({ type: 'PK', fc: 1000, gain: 0, q: 1 }))];
