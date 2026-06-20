// WL-EQ1 — playable headphone EQ + crossfeed (Web Audio), mounts into the unit overlay
(function () {
  'use strict';

  const FMIN = 20, FMAX = 20000, GMAX = 15;
  const CW = 2000, CH = 660; // internal canvas resolution

  let state = null; // active mount

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function mount(container) {
    // Plugin screen look: white trace, neutral grey band markers; amber lights up the band you're dragging.
    const band = '#c6cacd';
    container.innerHTML = `
      <div class="plug-graph-wrap"><canvas id="eqgraph" width="${CW}" height="${CH}"></canvas></div>
      <div class="plug-row">
        <div class="band-pill"><div class="bl"><span class="bdot" style="background:${band}"></span>LOW BAND</div><div class="bv" data-band="0">120 Hz · +3.0 dB</div></div>
        <div class="band-pill"><div class="bl"><span class="bdot" style="background:${band}"></span>MID BAND</div><div class="bv" data-band="1">1.0 kHz · −2.5 dB</div></div>
        <div class="band-pill"><div class="bl"><span class="bdot" style="background:${band}"></span>HIGH BAND</div><div class="bv" data-band="2">8.0 kHz · +4.0 dB</div></div>
        <div class="knob-group">
          <div class="knob" id="xfKnob"></div>
          <div class="knob-label">CROSSFEED</div>
          <div class="knob-val" id="xfVal">35 %</div>
        </div>
        <div class="knob-group">
          <div class="knob" id="outKnob"></div>
          <div class="knob-label">OUTPUT</div>
          <div class="knob-val" id="outVal">−12.0 dB</div>
        </div>
        <div class="plug-power-wrap">
          <button class="plug-power" id="plugPower" aria-label="Power">⏻</button>
          <div class="knob-label" id="powerHint">POWER · HEAR IT</div>
        </div>
      </div>
      <div class="plug-note">
        <span>DRAG THE DOTS · DRAG KNOBS VERTICALLY · PINK NOISE SOURCE</span>
        <span class="live" id="liveNote">BIQUAD ×3 → XFEED → GAIN</span>
      </div>`;

    const s = {
      container,
      bands: [
        { f: 120, g: 3.0, q: 0.9, color: band },
        { f: 1000, g: -2.5, q: 1.1, color: band },
        { f: 8000, g: 4.0, q: 0.8, color: band }
      ],
      xfeed: 0.35, outGain: -12,
      actx: null, filters: [], outNode: null, xfA: null, xfB: null, analyser: null, src: null,
      running: false, raf: 0, dragBand: -1,
      cv: container.querySelector('#eqgraph')
    };
    s.ctx = s.cv.getContext('2d');
    state = s;

    /* ---- audio ---- */
    function pink(ac) {
      const len = ac.sampleRate * 4;
      const buf = ac.createBuffer(2, len, ac.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759;
          b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856;
          b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980;
          d[i] = (b0+b1+b2+b3+b4+b5+b6 + w*0.5362) * 0.11;
          b6 = w * 0.115926;
        }
      }
      return buf;
    }
    function start() {
      s.actx = s.actx || new (window.AudioContext || window.webkitAudioContext)();
      s.actx.resume();
      const src = s.actx.createBufferSource();
      src.buffer = pink(s.actx); src.loop = true;
      s.filters = s.bands.map(b => {
        const f = s.actx.createBiquadFilter();
        f.type = 'peaking'; f.frequency.value = b.f; f.gain.value = b.g; f.Q.value = b.q;
        return f;
      });
      const splitter = s.actx.createChannelSplitter(2);
      const monoSum = s.actx.createGain(); monoSum.gain.value = 0.5;
      s.xfA = s.actx.createGain(); s.xfB = s.actx.createGain();
      s.outNode = s.actx.createGain();
      s.analyser = s.actx.createAnalyser(); s.analyser.fftSize = 2048; s.analyser.smoothingTimeConstant = 0.82;
      src.connect(s.filters[0]); s.filters[0].connect(s.filters[1]); s.filters[1].connect(s.filters[2]);
      s.filters[2].connect(s.xfA);
      s.filters[2].connect(splitter);
      splitter.connect(monoSum, 0); splitter.connect(monoSum, 1);
      monoSum.connect(s.xfB);
      s.xfA.connect(s.outNode); s.xfB.connect(s.outNode);
      s.outNode.connect(s.analyser); s.analyser.connect(s.actx.destination);
      applyXf(); applyOut();
      src.start();
      s.src = src; s.running = true;
      document.body.classList.add('audio-on');
      container.querySelector('#liveNote').textContent = 'LIVE · PINK NOISE';
      container.querySelector('#powerHint').textContent = 'POWER · LIVE';
    }
    function stop() {
      if (s.src) { try { s.src.stop(); } catch (e) {} s.src = null; }
      s.running = false; s.analyser = null;
      document.body.classList.remove('audio-on');
      const ln = container.querySelector('#liveNote');
      if (ln) ln.textContent = 'BIQUAD ×3 → XFEED → GAIN';
      const ph = container.querySelector('#powerHint');
      if (ph) ph.textContent = 'POWER · HEAR IT';
    }
    function applyXf() {
      if (!s.xfA) return;
      s.xfA.gain.value = 1 - s.xfeed * 0.6;
      s.xfB.gain.value = s.xfeed * 0.8;
    }
    function applyOut() {
      if (s.outNode) s.outNode.gain.value = Math.pow(10, s.outGain / 20);
    }
    function syncFilters() {
      if (!s.filters.length || !s.running) return;
      s.bands.forEach((b, i) => {
        s.filters[i].frequency.setTargetAtTime(b.f, s.actx.currentTime, 0.02);
        s.filters[i].gain.setTargetAtTime(b.g, s.actx.currentTime, 0.02);
      });
    }
    container.querySelector('#plugPower').addEventListener('click', () => s.running ? stop() : start());
    s.stop = stop;

    /* ---- response math ---- */
    const fToX = f => (Math.log10(f / FMIN) / Math.log10(FMAX / FMIN)) * CW;
    const xToF = x => FMIN * Math.pow(FMAX / FMIN, x / CW);
    const gToY = g => CH / 2 - (g / GMAX) * (CH / 2 - 66);
    const yToG = y => ((CH / 2 - y) / (CH / 2 - 66)) * GMAX;
    function bandResponse(b, f) {
      const A = Math.pow(10, b.g / 40);
      const w0 = 2 * Math.PI * b.f / 48000;
      const alpha = Math.sin(w0) / (2 * b.q);
      const b0 = 1 + alpha * A, b1c = -2 * Math.cos(w0), b2c = 1 - alpha * A;
      const a0 = 1 + alpha / A, a1 = -2 * Math.cos(w0), a2 = 1 - alpha / A;
      const w = 2 * Math.PI * f / 48000;
      const c1 = Math.cos(w), c2 = Math.cos(2*w), s1 = Math.sin(w), s2 = Math.sin(2*w);
      const nr = b0 + b1c*c1 + b2c*c2, ni = -(b1c*s1 + b2c*s2);
      const dr = a0 + a1*c1 + a2*c2, di = -(a1*s1 + a2*s2);
      return 20 * Math.log10(Math.sqrt(nr*nr + ni*ni) / Math.sqrt(dr*dr + di*di));
    }

    /* ---- draw loop ---- */
    const freqData = new Uint8Array(1024);
    function draw() {
      const ctx = s.ctx;
      ctx.clearRect(0, 0, CW, CH);
      ctx.fillStyle = '#0a0b0c'; ctx.fillRect(0, 0, CW, CH);
      ctx.font = '20px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
      [50, 100, 200, 500, 1000, 2000, 5000, 10000].forEach(f => {
        const x = fToX(f);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke();
        ctx.fillStyle = '#46444e';
        ctx.fillText(f >= 1000 ? (f/1000)+'k' : f, x + 8, CH - 16);
      });
      [-12, -6, 0, 6, 12].forEach(g => {
        const y = gToY(g);
        ctx.strokeStyle = g === 0 ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.05)';
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke();
        ctx.fillStyle = '#46444e';
        ctx.fillText((g > 0 ? '+' : '') + g, 12, y - 8);
      });
      if (s.analyser) {
        s.analyser.getByteFrequencyData(freqData);
        ctx.beginPath(); ctx.moveTo(0, CH);
        for (let x = 0; x <= CW; x += 8) {
          const f = xToF(x);
          const bin = Math.min(1023, Math.round(f / 24000 * 1024));
          ctx.lineTo(x, CH - (freqData[bin] / 255) * CH * 0.7);
        }
        ctx.lineTo(CW, CH); ctx.closePath();
        const accNow = cssVar('--acc');
        ctx.fillStyle = accNow + '1f';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = 4;
      for (let x = 0; x <= CW; x += 6) {
        let g = 0;
        s.bands.forEach(b => g += bandResponse(b, xToF(x)));
        const y = gToY(g);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      const amber = cssVar('--acc') || '#eeb154';
      s.bands.forEach((b, i) => {
        const active = s.dragBand === i;
        const hc = active ? amber : b.color;   // amber lights up the band you're holding
        ctx.beginPath();
        ctx.strokeStyle = hc + '55'; ctx.lineWidth = 2;
        for (let x = 0; x <= CW; x += 8) {
          const y = gToY(bandResponse(b, xToF(x)));
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        const dx = fToX(b.f), dy = gToY(b.g);
        ctx.beginPath(); ctx.arc(dx, dy, 16, 0, Math.PI * 2); ctx.fillStyle = hc; ctx.fill();
        ctx.beginPath(); ctx.arc(dx, dy, 26, 0, Math.PI * 2);
        ctx.strokeStyle = hc + (active ? 'aa' : '44'); ctx.lineWidth = 2.5; ctx.stroke();
      });
      s.raf = requestAnimationFrame(draw);
    }

    /* ---- interactions ---- */
    const scaleX = () => CW / s.cv.getBoundingClientRect().width;
    const scaleY = () => CH / s.cv.getBoundingClientRect().height;
    s.onDown = e => {
      const r = s.cv.getBoundingClientRect();
      const mx = (e.clientX - r.left) * scaleX(), my = (e.clientY - r.top) * scaleY();
      s.bands.forEach((b, i) => {
        const dx = fToX(b.f) - mx, dy = gToY(b.g) - my;
        if (Math.sqrt(dx*dx + dy*dy) < 50) s.dragBand = i;
      });
    };
    s.onMove = e => {
      if (s.dragBand < 0) return;
      const r = s.cv.getBoundingClientRect();
      const mx = (e.clientX - r.left) * scaleX(), my = (e.clientY - r.top) * scaleY();
      const b = s.bands[s.dragBand];
      b.f = Math.max(30, Math.min(18000, xToF(mx)));
      b.g = Math.max(-GMAX + 1, Math.min(GMAX - 1, yToG(my)));
      syncFilters(); readouts();
    };
    s.onUp = () => s.dragBand = -1;
    s.cv.addEventListener('pointerdown', s.onDown);
    window.addEventListener('pointermove', s.onMove);
    window.addEventListener('pointerup', s.onUp);

    function fmtF(f) { return f >= 1000 ? (f/1000).toFixed(1) + ' kHz' : Math.round(f) + ' Hz'; }
    function readouts() {
      s.bands.forEach((b, i) => {
        container.querySelector(`[data-band="${i}"]`).textContent =
          fmtF(b.f) + ' · ' + (b.g >= 0 ? '+' : '−') + Math.abs(b.g).toFixed(1) + ' dB';
      });
    }
    readouts();

    function wireKnob(el, valEl, get, set, fmt) {
      let sy = 0, sv = 0, drag = false;
      el.addEventListener('pointerdown', e => { drag = true; sy = e.clientY; sv = get(); e.preventDefault(); });
      window.addEventListener('pointermove', e => {
        if (!drag) return;
        set(sv + (sy - e.clientY) * 0.006);
        valEl.textContent = fmt();
      });
      window.addEventListener('pointerup', () => drag = false);
    }
    const xk = container.querySelector('#xfKnob');
    wireKnob(xk, container.querySelector('#xfVal'),
      () => s.xfeed,
      v => { s.xfeed = Math.max(0, Math.min(1, v)); xk.style.setProperty('--rot', (-135 + s.xfeed * 270) + 'deg'); applyXf(); },
      () => Math.round(s.xfeed * 100) + ' %');
    const ok = container.querySelector('#outKnob');
    wireKnob(ok, container.querySelector('#outVal'),
      () => (s.outGain + 40) / 40,
      v => { const n = Math.max(0, Math.min(1, v)); s.outGain = -40 + n * 40; ok.style.setProperty('--rot', (-135 + n * 270) + 'deg'); applyOut(); },
      () => s.outGain.toFixed(1).replace('-', '−') + ' dB');
    xk.style.setProperty('--rot', (-135 + s.xfeed * 270) + 'deg');
    ok.style.setProperty('--rot', (-135 + ((s.outGain + 40) / 40) * 270) + 'deg');

    draw();
  }

  function unmount() {
    if (!state) return;
    state.stop();
    cancelAnimationFrame(state.raf);
    window.removeEventListener('pointermove', state.onMove);
    window.removeEventListener('pointerup', state.onUp);
    state = null;
  }

  window.WLEQ1 = { mount, unmount };
})();
