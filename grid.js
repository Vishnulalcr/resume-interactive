/**
 * grid.js — Interactive dot-grid background
 *
 * Default: white dots for dark landing zone.
 * Call window.gridSetColor(r, g, b) to transition dot color
 * (GSAP interpolates the values in animations.js).
 */
(function () {
  'use strict';

  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── Config ─────────────────────────────────────── */
  const SPACING = 30;     // px between dots
  const DOT_R   = 1.1;    // dot radius px
  const BASE_A  = 0.065;  // resting opacity
  const PEAK_A  = 0.32;   // max opacity at cursor centre
  const RADIUS  = 130;    // cursor influence radius px
  const LERP    = 0.042;  // easing — lower = more dreamy delay
  const RADIUS_SQ = RADIUS * RADIUS;
  /* ─────────────────────────────────────────────── */

  /* Dot color — default white for dark landing */
  let dotR = 255, dotG = 255, dotB = 255;

  let W = 0, H = 0;
  const mouse = { x: -9999, y: -9999 };
  let dots = [];

  function buildDots() {
    dots = [];
    const cols = Math.ceil(W / SPACING) + 1;
    const rows = Math.ceil(H / SPACING) + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({ x: c * SPACING, y: r * SPACING, a: BASE_A });
      }
    }
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildDots();
  }

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  document.documentElement.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  window.addEventListener('resize', resize);

  function tick() {
    ctx.clearRect(0, 0, W, H);

    for (const d of dots) {
      const dx   = d.x - mouse.x;
      const dy   = d.y - mouse.y;
      const distSq = dx * dx + dy * dy;

      let goal = BASE_A;
      if (distSq < RADIUS_SQ) {
        const t = 1 - (Math.sqrt(distSq) / RADIUS);
        goal = BASE_A + t * t * (PEAK_A - BASE_A);
      }

      /* Lerp with delay */
      d.a += (goal - d.a) * LERP;

      ctx.beginPath();
      ctx.arc(d.x, d.y, DOT_R, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${dotR},${dotG},${dotB},${d.a})`;
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  resize();
  tick();

  /* Public API — called by animations.js GSAP proxy */
  window.gridSetColor = function (r, g, b) {
    dotR = r;
    dotG = g;
    dotB = b;
  };

})();
