// Warren Labs homepage: oscilloscope + mobile nav.
//
// The 3D rack, its parallax, its unit data and its fullscreen overlay were removed 2026-08-27.
// Reason, in short: FEATURED/SUITES here was a THIRD hand-maintained source of truth for the same
// nine products, alongside web/plugins.json and site-src/src/data/*.js, and every stale fact on the
// page lived in that fork — Level pinned at "0.2.26 · not yet notarized" when it was 0.3.0 and
// notarized, Attune iOS "in review" when attune.js had read live for a week, and "Trueness suite"
// when the store sells "The Reference Desk". Correcting a fork only resets the clock. See
// docs/homepage-redesign.md §1.4.
(function () {
  'use strict';

  /* ---------------- oscilloscope ----------------
     Moved out from behind the h1 into its own band under the calls to action — it was competing
     with the headline at the one moment the page has a single thing to say.

     Colours are READ FROM CSS rather than hardcoded. The old version baked in
     rgba(232,235,237,…), which is why it was invisible in light mode and why it got classed as
     decoration worth deleting. It isn't decoration: the trace swells toward the pointer. */
  const scope = document.getElementById('scope');
  if (scope) {
    const sctx = scope.getContext('2d');
    const H = 150, MID = 75;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;

    const tok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    let TRACE = tok('--wl-text') || '#e8ebed';
    let GRIDA = 0.05;
    const reread = () => { TRACE = tok('--wl-text') || '#e8ebed'; };
    window.addEventListener('wl-theme', reread);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener && mq.addEventListener('change', reread);
    new MutationObserver(reread).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const sizeScope = () => {
      W = scope.clientWidth;
      scope.width = W * dpr; scope.height = H * dpr;
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sizeScope();
    window.addEventListener('resize', sizeScope);

    let mouseX = 0, energy = 0.4, t = 0;
    document.addEventListener('pointermove', e => {
      const r = scope.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      energy = Math.min(1.2, energy + 0.06);
    });

    const layers = [
      { amp: 30, freq: 0.012, speed: 2.0, alpha: 0.55, w: 2.2 },
      { amp: 17, freq: 0.020, speed: -1.4, alpha: 0.22, w: 1.4 },
      { amp: 42, freq: 0.007, speed: 1.0, alpha: 0.08, w: 1.0 }
    ];

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function drawScope() {
      t += 0.016;
      energy += (0.4 - energy) * 0.012;
      sctx.clearRect(0, 0, W, H);

      sctx.globalAlpha = GRIDA; sctx.strokeStyle = TRACE; sctx.lineWidth = 1;
      sctx.beginPath();
      for (let x = 0; x <= W; x += 80) { sctx.moveTo(x, MID - 40); sctx.lineTo(x, MID + 40); }
      sctx.stroke();

      layers.forEach(L => {
        sctx.beginPath();
        sctx.globalAlpha = L.alpha; sctx.strokeStyle = TRACE; sctx.lineWidth = L.w;
        for (let x = 0; x <= W; x += 4) {
          const prox = Math.exp(-Math.pow((x - mouseX) / 220, 2));
          const y = MID + Math.sin(x * L.freq + t * L.speed) * L.amp * (0.55 + energy * 0.45) * (1 + prox * 0.9);
          x ? sctx.lineTo(x, y) : sctx.moveTo(x, y);
        }
        sctx.stroke();
      });
      sctx.globalAlpha = 1;
      if (!reduce) requestAnimationFrame(drawScope);
    }
    drawScope();
  }

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
