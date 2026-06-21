// Warren Labs — core app: oscilloscope, 3D rack, unit overlays
(function () {
  'use strict';

  /* ---------------- oscilloscope ---------------- */
  const scope = document.getElementById('scope');
  const sctx = scope.getContext('2d');
  let W = 0;
  function sizeScope() {
    W = window.innerWidth;
    scope.width = W;
  }
  sizeScope();
  window.addEventListener('resize', sizeScope);

  let mouseX = W / 2, energy = 0.4, t = 0;
  document.addEventListener('pointermove', e => {
    mouseX = e.clientX;
    energy = Math.min(1.2, energy + 0.06);
  });
  function drawScope() {
    t += 0.016;
    energy += (0.4 - energy) * 0.012;
    sctx.clearRect(0, 0, W, 230);
    const mid = 125;
    sctx.strokeStyle = 'rgba(255,255,255,0.05)';
    sctx.lineWidth = 1;
    sctx.beginPath();
    for (let x = 0; x <= W; x += 80) { sctx.moveTo(x, mid - 58); sctx.lineTo(x, mid + 58); }
    sctx.stroke();
    // Hero waveform is decorative — neutral off-white trace (graphite world), not the amber accent.
    const base = '232,235,237';
    const layers = [
      { amp: 44, freq: 0.012, speed: 2.0, color: `rgba(${base},0.60)`, w: 2.2 },
      { amp: 25, freq: 0.02, speed: -1.4, color: `rgba(${base},0.22)`, w: 1.4 },
      { amp: 62, freq: 0.007, speed: 1.0, color: 'rgba(255,255,255,0.07)', w: 1 }
    ];
    layers.forEach(L => {
      sctx.beginPath();
      sctx.strokeStyle = L.color;
      sctx.lineWidth = L.w;
      for (let x = 0; x <= W; x += 4) {
        const prox = Math.exp(-Math.pow((x - mouseX) / 220, 2));
        const a = L.amp * energy * (0.55 + prox * 1.6);
        const y = mid
          + Math.sin(x * L.freq + t * L.speed) * a
          + Math.sin(x * L.freq * 2.7 + t * L.speed * 1.7) * a * 0.3;
        x === 0 ? sctx.moveTo(x, y) : sctx.lineTo(x, y);
      }
      sctx.stroke();
    });
    requestAnimationFrame(drawScope);
  }
  drawScope();

  /* ---------------- rack parallax ---------------- */
  const rack = document.getElementById('rack3d');
  const scene = document.querySelector('.rack-scene');
  document.querySelector('.rack-zone').addEventListener('mousemove', e => {
    const r = scene.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width / 2)) / r.width;   // -0.5..0.5
    const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
    rack.style.setProperty('--mx', (nx * 5).toFixed(2) + 'deg');
    rack.style.setProperty('--my', (-ny * 3).toFixed(2) + 'deg');
  });
  document.querySelector('.rack-zone').addEventListener('mouseleave', () => {
    rack.style.setProperty('--mx', '0deg');
    rack.style.setProperty('--my', '0deg');
  });

  /* ---------------- WL-EQ1 faceplate curve ---------------- */
  const eqMini = document.getElementById('eqMini');
  if (eqMini) {
    const mctx = eqMini.getContext('2d');
    const MW = 500, MH = 176;
    function cssVarLocal(n) {
      return getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    }
    function curveG(t) {
      return 4.2 * Math.exp(-Math.pow((t - 0.16) / 0.13, 2))
           - 3.4 * Math.exp(-Math.pow((t - 0.52) / 0.12, 2))
           + 5.0 * Math.exp(-Math.pow((t - 0.84) / 0.11, 2));
    }
    function drawMini() {
      // Faceplate curve reads like the plugin screen: white trace, neutral band markers.
      const dotc = '#c6cacd';
      mctx.clearRect(0, 0, MW, MH);
      // grid
      mctx.strokeStyle = 'rgba(255,255,255,0.06)';
      mctx.lineWidth = 1;
      for (let x = 62; x < MW; x += 62) {
        mctx.beginPath(); mctx.moveTo(x, 8); mctx.lineTo(x, MH - 8); mctx.stroke();
      }
      mctx.strokeStyle = 'rgba(255,255,255,0.12)';
      mctx.beginPath(); mctx.moveTo(8, MH / 2); mctx.lineTo(MW - 8, MH / 2); mctx.stroke();
      // curve
      mctx.beginPath();
      for (let x = 8; x <= MW - 8; x += 4) {
        const t = (x - 8) / (MW - 16);
        const y = MH / 2 - curveG(t) * 11;
        x === 8 ? mctx.moveTo(x, y) : mctx.lineTo(x, y);
      }
      mctx.strokeStyle = 'rgba(255,255,255,0.9)';
      mctx.lineWidth = 3;
      mctx.stroke();
      // band dots
      [[0.16, dotc], [0.52, dotc], [0.84, dotc]].forEach(([t, c]) => {
        const x = 8 + t * (MW - 16);
        const y = MH / 2 - curveG(t) * 11;
        mctx.beginPath(); mctx.arc(x, y, 8, 0, Math.PI * 2);
        mctx.fillStyle = c; mctx.fill();
        mctx.beginPath(); mctx.arc(x, y, 14, 0, Math.PI * 2);
        mctx.strokeStyle = c + '55'; mctx.lineWidth = 2.5; mctx.stroke();
      });
    }
    drawMini();
  }

  /* ---------------- unit data ---------------- */
  const UNITS = {
    eq: {
      num: 'WL-EQ1', title: 'Headphone EQ + Crossfeed',
      led: 'var(--led-amber)', blink: true, status: 'PROTOTYPE',
      plugin: true,
      desc: [
        "A VST3 plugin I'm building in <b>C++ with JUCE</b>: headphone EQ correction that flattens a given headphone's response, plus Bauer-style crossfeed that blends the channels to ease the in-your-head feeling of headphones.",
        "First milestone is deliberately narrow: <b>prove the signal chain end to end</b> with a hardcoded curve before adding real correction data and a UI. It's the part of audio I most want under my hands."
      ],
      meta: [['ROLE', 'Solo, learning by building'], ['STACK', 'C++, JUCE, CMake, Claude Code'], ['STATUS', 'Early; signal chain in progress'], ['THIS DEMO', 'Web Audio API, a sketch of the real thing']]
    },
    changes: {
      num: 'WL-CH1', title: 'Changes',
      led: 'var(--led-amber)', blink: true, status: 'BETA',
      link: '/changes/', linkLabel: 'OPEN THE LANDING PAGE ↗',
      desc: [
        "An <b>iPhone app</b> that turns a rough recording — played, hummed, or dropped in from a voice memo — into a session-ready <b>Nashville Number chart</b>, then a MIDI you open straight in Logic Pro. The whole thing runs <b>on-device</b>: your audio never leaves the phone.",
        "Built like a musician's tool, not a transcriber. The chart is <b>transpose-proof</b> — one chart, any key — it <b>flags the bars it's unsure of</b> so you fix them in taps, and it plays your take back with a marker following the changes.",
        "First milestone is a tight beta: capture, chart, fix, and export a MIDI for Logic — run Analyze for a Chord Track, then add Session Players that follow the changes."
      ],
      meta: [['ROLE', 'Solo — product + build'], ['PLATFORM', 'iPhone · iOS 27'], ['PRIVACY', 'On-device · no upload, no account'], ['STATUS', 'Beta list open']]
    },
    maker: {
      num: 'WL-MP1', title: 'Maker Phones',
      led: 'var(--led-green)', status: 'LIVE',
      link: 'https://makerphones.com',
      desc: [
        "An open field manual for building your own headphones — driver physics through measurement and tuning. Thirty-two chapters off the bench, all done and free to read. The resource I wish I'd had thirty years ago.",
        "It starts with the <b>Daily Driver</b>: a 40 mm open-back that's forgiving to design and to assemble, buildable by a first-timer, and good enough to keep wearing once it's done. The model is <b>fully parametric</b> — change the driver, the pad, or the head size and it follows.",
        "Honest sonic target: a <b>bright, open, detailed open-back</b> — strong mids and treble, modest bass. That's what a small driver in an open baffle does, and the design leans into it instead of chasing sub-bass the hardware can't make."
      ],
      meta: [['ROLE', 'Author'], ['FORMAT', 'Open web manual, free'], ['FIRST BUILD', 'Daily Driver · 40 mm open-back'], ['SCOPE', 'Driver physics → measurement → tuning'], ['STATUS', '32 chapters · complete']]
    },
    tone: {
      num: 'WL-TF1', title: 'Tone Farmers',
      led: 'var(--led-green)', status: 'ACTIVE',
      desc: [
        "A record label I started with an <b>artist-favorable split</b>, because the deals most artists get are bad. I work with them from recording through release."
      ],
      meta: [['ROLE', 'Founder'], ['FOCUS', 'A&R, production, release'], ['STATUS', 'Active']],
      controls: [
        { type: 'knob', label: 'ARTIST CUT', init: 0.75, fmt: v => Math.round(v * 100) + '%' },
        { type: 'knob', label: 'LABEL CUT', init: 0.25, fmt: v => Math.round(v * 100) + '%', linkInvert: 0 }
      ]
    },
    bloom: {
      num: 'WL-SB1', title: 'Sonic Bloom',
      led: 'var(--led-amber)', blink: true, status: 'PRE-LAUNCH',
      desc: [
        "An all-in-one website, sales, and fan platform for working musicians: <b>one flat $20/month, no commission</b> on what they earn. Most musicians stitch together Squarespace, Bandcamp, Mailchimp, and Patreon, and most of those take a cut.",
        "The call I'm proudest of is what I left out: <b>a small, frozen feature set</b> and firm rules about what it would never do."
      ],
      meta: [['ROLE', 'Product, scope, architecture'], ['STACK', 'Laravel 12, PostgreSQL, Stripe'], ['STATUS', 'Built; path to beta in progress']],
      controls: [
        { type: 'knob', label: 'MONTHLY FEE', init: 0.2, fixed: true, fmt: () => '$20 FLAT' },
        { type: 'knob', label: 'COMMISSION', init: 0, locked: true, fmt: v => v < 0.02 ? '0% · ALWAYS' : Math.round(v * 100) + '%?!' }
      ]
    }
  };

  /* ---------------- overlay ---------------- */
  const ov = document.getElementById('ov');
  const ovBody = document.getElementById('ovBody');
  let openKey = null;

  function knobHTML(c, i) {
    const rot = -135 + c.init * 270;
    return `<div class="knob-group">
      <div class="knob" data-ovknob="${i}" style="--rot:${rot}deg"></div>
      <div class="knob-label">${c.label}</div>
      <div class="knob-val" data-ovval="${i}">${c.fmt(c.init)}</div>
    </div>`;
  }

  function openUnit(key) {
    const u = UNITS[key];
    if (!u) return;
    openKey = key;
    document.getElementById('ovNum').textContent = u.num;
    document.getElementById('ovTitle').textContent = u.title;
    document.getElementById('ovStatus').innerHTML =
      `<div class="led${u.blink ? ' blink' : ''}" style="--led-c:${u.led}"></div>${u.status}`;

    if (u.plugin) {
      ovBody.innerHTML = `
        <div id="wl-plugin-mount"></div>
        <div class="ov-grid" style="margin-top:40px">
          <div class="ov-desc">${u.desc.map(d => `<p>${d}</p>`).join('')}</div>
          <div class="ov-side"><div class="ov-meta">${u.meta.map(m =>
            `<div class="m"><span class="mk">${m[0]}</span><span class="mv">${m[1]}</span></div>`).join('')}</div></div>
        </div>`;
      window.WLEQ1.mount(document.getElementById('wl-plugin-mount'));
    } else {
      ovBody.innerHTML = `
        <div class="ov-grid">
          <div class="ov-desc">${u.desc.map(d => `<p>${d}</p>`).join('')}</div>
          <div class="ov-side">
            ${u.link ? `<a class="ov-cta" href="${u.link}"${/^https?:/.test(u.link) ? ' target="_blank" rel="noopener"' : ''}>${u.linkLabel || 'VISIT ↗'}</a>` : ''}
            <div class="ov-meta">${u.meta.map(m =>
              `<div class="m"><span class="mk">${m[0]}</span><span class="mv">${m[1]}</span></div>`).join('')}</div>
            ${u.controls ? `<div class="ov-controls">${u.controls.map(knobHTML).join('')}</div>` : ''}
          </div>
        </div>`;
      if (u.controls) wireKnobs(u.controls);
    }
    ov.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeUnit() {
    if (!ov.classList.contains('show')) return;
    ov.classList.remove('show');
    document.body.style.overflow = '';
    if (openKey && UNITS[openKey] && UNITS[openKey].plugin) window.WLEQ1.unmount();
    ovBody.innerHTML = '';
    openKey = null;
  }

  function wireKnobs(controls) {
    controls.forEach((c, i) => {
      const el = ovBody.querySelector(`[data-ovknob="${i}"]`);
      const val = ovBody.querySelector(`[data-ovval="${i}"]`);
      if (!el || c.fixed) { if (el) el.style.cursor = 'default'; return; }
      let v = c.init, sy = 0, sv = 0, drag = false, springTimer = null;
      const render = () => {
        el.style.setProperty('--rot', (-135 + v * 270) + 'deg');
        val.textContent = c.fmt(v);
      };
      el.addEventListener('pointerdown', e => {
        drag = true; sy = e.clientY; sv = v; e.preventDefault();
        if (springTimer) { clearInterval(springTimer); springTimer = null; }
      });
      window.addEventListener('pointermove', e => {
        if (!drag) return;
        v = Math.max(0, Math.min(1, sv + (sy - e.clientY) * 0.005));
        if (c.linkInvert !== undefined) {
          const other = ovBody.querySelector(`[data-ovknob="${c.linkInvert}"]`);
          const otherVal = ovBody.querySelector(`[data-ovval="${c.linkInvert}"]`);
          if (other) {
            other.style.setProperty('--rot', (-135 + (1 - v) * 270) + 'deg');
            otherVal.textContent = Math.round((1 - v) * 100) + '%';
          }
        }
        render();
      });
      window.addEventListener('pointerup', () => {
        if (!drag) return;
        drag = false;
        if (c.locked && v > 0) {
          // spring back to zero — some knobs aren't negotiable
          springTimer = setInterval(() => {
            v = Math.max(0, v - 0.06);
            render();
            if (v <= 0) { clearInterval(springTimer); springTimer = null; }
          }, 16);
        }
      });
    });
  }

  document.querySelectorAll('.unit[data-unit]').forEach(el =>
    el.addEventListener('click', () => openUnit(el.dataset.unit)));
  document.getElementById('ovClose').addEventListener('click', closeUnit);
  document.getElementById('ovScrim').addEventListener('click', closeUnit);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeUnit(); });

  /* ---------------- mobile nav ---------------- */
  const navToggle = document.querySelector('.nav-toggle');
  const headerEl = document.querySelector('header');
  if (navToggle && headerEl) {
    const setNav = open => {
      headerEl.classList.toggle('nav-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    navToggle.addEventListener('click', () => setNav(!headerEl.classList.contains('nav-open')));
    headerEl.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => setNav(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setNav(false); });
  }
})();
