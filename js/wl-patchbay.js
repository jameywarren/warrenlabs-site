// Warren Labs — interactive patchbay with verlet cable physics
(function () {
  'use strict';

  const pbay = document.getElementById('pbay');
  if (!pbay) return;
  const cv = document.getElementById('pbayCv');
  const ctx = cv.getContext('2d');
  const readout = document.getElementById('pbayReadout');

  const JACKS = [
    { label: 'YOU', fixed: true },
    { label: '02' }, { label: '03' }, { label: '04' },
    { label: 'EMAIL', link: 0 },
    { label: '06' }, { label: '07' },
    { label: 'LINKEDIN', link: 1 },
    { label: '09' }, { label: '10' },
    { label: 'GITHUB', link: 2 },
    { label: '12' }
  ];

  const row = document.getElementById('pbayRow');
  JACKS.forEach((j, i) => {
    const cell = document.createElement('div');
    cell.className = 'jackcell' + (j.fixed ? ' fixed' : '') + (j.link !== undefined ? ' named' : '');
    cell.dataset.idx = i;
    cell.innerHTML = `<div class="jackhole"></div><div class="jacklabel mono">${j.label}</div>`;
    row.appendChild(cell);
  });
  const cells = [...row.children];

  /* ---------- geometry ---------- */
  let DPR = 1, cw = 0, ch = 0;
  function sizeCanvas() {
    const r = cv.getBoundingClientRect();
    DPR = Math.min(2, window.devicePixelRatio || 1);
    cw = r.width; ch = r.height;
    cv.width = Math.round(cw * DPR);
    cv.height = Math.round(ch * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function jackCenter(i) {
    const jr = cells[i].querySelector('.jackhole').getBoundingClientRect();
    const cr = cv.getBoundingClientRect();
    return { x: jr.left + jr.width / 2 - cr.left, y: jr.top + jr.height / 2 - cr.top };
  }

  /* ---------- verlet rope ---------- */
  const SEGS = 30;
  let pts = [], restLen = 10;
  let aIdx = 0, bIdx = 4; // YOU -> EMAIL by default

  function ropeTargets() {
    return [jackCenter(aIdx), jackCenter(bIdx)];
  }
  function computeRest(a, b) {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    restLen = (d * 1.04 + 70) / SEGS;
  }
  function initRope() {
    const [a, b] = ropeTargets();
    computeRest(a, b);
    pts = [];
    for (let i = 0; i <= SEGS; i++) {
      const f = i / SEGS;
      const sag = Math.sin(f * Math.PI) * 60;
      const x = a.x + (b.x - a.x) * f;
      const y = a.y + (b.y - a.y) * f + sag;
      pts.push({ x, y, px: x, py: y });
    }
  }

  function step() {
    const [a, b] = ropeTargets();
    // integrate
    for (let i = 1; i < SEGS; i++) {
      const p = pts[i];
      const vx = (p.x - p.px) * 0.985;
      const vy = (p.y - p.py) * 0.985;
      p.px = p.x; p.py = p.y;
      p.x += vx; p.y += vy + 0.55; // gravity
    }
    // pins + constraints
    for (let k = 0; k < 5; k++) {
      pts[0].x = a.x; pts[0].y = a.y;
      pts[SEGS].x = b.x; pts[SEGS].y = b.y;
      for (let i = 0; i < SEGS; i++) {
        const p1 = pts[i], p2 = pts[i + 1];
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const d = Math.hypot(dx, dy) || 0.0001;
        const diff = (d - restLen) / d * 0.5;
        const ox = dx * diff, oy = dy * diff;
        if (i !== 0) { p1.x += ox; p1.y += oy; }
        if (i + 1 !== SEGS) { p2.x -= ox; p2.y -= oy; }
      }
    }
  }

  function accVar() {
    return getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#3fd2e4';
  }

  function drawPlug(p, next) {
    // plug sleeve oriented along the cable's exit direction
    const ang = Math.atan2(next.y - p.y, next.x - p.x);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(ang);
    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a3f47';
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#15161a';
    ctx.beginPath();
    ctx.roundRect(6, -5.5, 20, 11, 4);
    ctx.fill();
    ctx.fillStyle = '#2c3038';
    ctx.beginPath();
    ctx.roundRect(8, -3.5, 16, 7, 3);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    step();
    ctx.clearRect(0, 0, cw, ch);
    const acc = accVar();
    // shadow pass
    ctx.beginPath();
    ctx.moveTo(pts[0].x + 3, pts[0].y + 6);
    for (let i = 1; i < SEGS; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2 + 3;
      const my = (pts[i].y + pts[i + 1].y) / 2 + 6;
      ctx.quadraticCurveTo(pts[i].x + 3, pts[i].y + 6, mx, my);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.stroke();
    // cable
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < SEGS; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[SEGS].x, pts[SEGS].y);
    ctx.strokeStyle = '#0c0d10';
    ctx.lineWidth = 7.5;
    ctx.stroke();
    ctx.strokeStyle = acc;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    drawPlug(pts[0], pts[2]);
    drawPlug(pts[SEGS], pts[SEGS - 2]);
    requestAnimationFrame(draw);
  }

  /* ---------- interactions ---------- */
  const links = [...document.querySelectorAll('.contact-links a')];
  function updateState() {
    cells.forEach((c, i) => c.querySelector('.jackhole').classList.toggle('active', i === aIdx || i === bIdx));
    const j = JACKS[bIdx];
    if (j.link !== undefined) {
      readout.innerHTML = `PATCHED: YOU → <b>${j.label}</b>`;
      links.forEach((a, i) => a.classList.toggle('patched', i === j.link));
    } else {
      readout.innerHTML = `PATCHED: YOU → CH ${j.label} <span class="dimnote">(nothing here, try EMAIL, LINKEDIN, GITHUB)</span>`;
      links.forEach(a => a.classList.remove('patched'));
    }
  }

  cells.forEach((cell, i) => {
    cell.addEventListener('click', () => {
      if (i === aIdx || i === bIdx) return;
      bIdx = i;
      const [a, b] = ropeTargets();
      computeRest(a, b);
      // small upward impulse near the moving end so the whip feels alive
      for (let k = SEGS - 6; k < SEGS; k++) {
        pts[k].py = pts[k].y + 10;
      }
      updateState();
    });
  });

  window.addEventListener('resize', () => { sizeCanvas(); initRope(); });

  sizeCanvas();
  initRope();
  updateState();
  draw();
})();
