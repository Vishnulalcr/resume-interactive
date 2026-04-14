# -*- coding: utf-8 -*-
"""One-off patches for resume/index.html (works canvas)."""
from pathlib import Path

p = Path(__file__).resolve().parent / "index.html"
text = p.read_text(encoding="utf-8", errors="replace")

def one(old, new, label):
    global text
    if old not in text:
        raise SystemExit(f"MISSING: {label}")
    text = text.replace(old, new, 1)
    print("ok:", label)

# 1) External CSS after Google Fonts
one(
    '<link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@500&family=IBM+Plex+Mono:wght@400;500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">\n<style>',
    '<link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@500&family=IBM+Plex+Mono:wght@400;500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">\n'
    '<link rel="stylesheet" href="css/bento-grid.css">\n'
    '<link rel="stylesheet" href="css/hero-animation.css">\n'
    '<link rel="stylesheet" href="css/canvas-interaction.css">\n'
    '<link rel="stylesheet" href="css/image-preview.css">\n'
    '<style>',
    "head links",
)

# 2) Hero fly layer inside motion layer
one(
    '<div id="worksMotionLayer">\n<div id="bentoPanRoot">',
    '<div id="worksMotionLayer">\n'
    '<div id="worksHeroFly" aria-hidden="true"><img src="" alt="" decoding="async" draggable="false"></div>\n'
    '<div id="bentoPanRoot">',
    "worksHeroFly",
)

# 3) Lenis global
one(
    "lenis.on('scroll', ScrollTrigger.update);",
    "lenis.on('scroll', ScrollTrigger.update);\nwindow.lenis = lenis;",
    "window.lenis",
)

# 4) Stats slightly earlier
one(
    "start: 'top 80%',",
    "start: 'top 72%',",
    "stats reveal",
)

# 5) Cards stack + applyCardStackAtPx + conditional ST
OLD = """/* ═══ CARDS — scrub stack (560vh wrap, full-viewport stage — card proportions restored) ═══════════ */
var CARD_VH = 100;
var tilts = [-1.5, 0.8, -0.6, 1.2];
var cardIds = ['c1','c2','c3','c4'];
var segVh = innerHeight * (CARD_VH / 100);
var cardEls = cardIds.map(function(id){ return document.getElementById(id); });

cardEls.forEach(function(el, i){
  gsap.set(el, {
    xPercent:-50,
    yPercent:-50,
    y: innerHeight,
    opacity:0,
    rotate:0,
    zIndex:i+1
  });
});

function updateCardMetrics() {
  segVh = innerHeight * (CARD_VH / 100);
}

ScrollTrigger.addEventListener('refreshInit', updateCardMetrics);

ScrollTrigger.create({
  trigger: '#cards-wrap',
  start: 'top top',
  end: 'bottom bottom',
  pin: '#cards-stage',
  pinSpacing: false,
  scrub: true,
  invalidateOnRefresh: true,
  onUpdate: function(self) {
    var cardsScroll = segVh * cardIds.length;
    var px = self.progress * cardsScroll;

    cardEls.forEach(function(el, i) {
      var settlePx = segVh * 0.55;
      var startPx = i * segVh;
      var local = clamp01((px - startPx) / settlePx);

      gsap.set(el, {
        xPercent:-50,
        yPercent:-50,
        y:(1 - local) * innerHeight,
        opacity:local,
        rotate:local * tilts[i]
      });
    });

    var lightStartPx = (cardIds.length - 1) * segVh + segVh * 0.55;
    var lightProgress = clamp01((px - lightStartPx) / (cardsScroll - lightStartPx));
    var lp = setLastCardLightMode(lightProgress);
    syncCornerChrome(lp, self.progress);
  },

  /* Guarantee fully hidden when the user scrolls past cards into resume.
     scrub can occasionally miss the last onUpdate frame. */
  onLeave: function() {
    gsap.set('.cor',        { opacity: 0, y: -22 });
    gsap.set('.side-label', { opacity: 0, y: -22 });
  },

  /* Restore when user scrolls BACK into cards from resume;
     onUpdate (scrub) takes over immediately and handles the rest. */
  onEnterBack: function() {
    gsap.set('.cor',        { opacity: 0, y: -22 });
    gsap.set('.side-label', { opacity: 0, y: -22 });
  }
});
"""

NEW = """/* ═══ CARDS — scrub stack (560vh wrap, full-viewport stage — card proportions restored) ═══════════ */
var CARD_VH = document.getElementById('wcScrollDriver') ? 118 : 100;
var tilts = [-1.5, 0.8, -0.6, 1.2];
var cardIds = ['c1','c2','c3','c4'];
var segVh = innerHeight * (CARD_VH / 100);
var cardEls = cardIds.map(function(id){ return document.getElementById(id); });

cardEls.forEach(function(el, i){
  gsap.set(el, {
    xPercent:-50,
    yPercent:-50,
    y: innerHeight,
    opacity:0,
    rotate:0,
    zIndex:i+1
  });
});

function updateCardMetrics() {
  segVh = innerHeight * (CARD_VH / 100);
  window.segVh = segVh;
}

function applyCardStackAtPx(px, wrapProgressOverride) {
  var cardsScroll = segVh * cardIds.length;
  var wx = wrapProgressOverride != null && wrapProgressOverride !== undefined
    ? clamp01(wrapProgressOverride)
    : clamp01(px / Math.max(1e-6, cardsScroll));
  cardEls.forEach(function(el, i) {
    var settlePx = segVh * 0.55;
    var startPx = i * segVh;
    var local = clamp01((px - startPx) / settlePx);
    gsap.set(el, {
      xPercent:-50,
      yPercent:-50,
      y:(1 - local) * innerHeight,
      opacity:local,
      rotate:local * tilts[i]
    });
  });
  var lightStartPx = (cardIds.length - 1) * segVh + segVh * 0.55;
  var lightProgress = clamp01((px - lightStartPx) / Math.max(1e-6, cardsScroll - lightStartPx));
  var lp = setLastCardLightMode(lightProgress);
  syncCornerChrome(lp, wx);
}
window.applyCardStackAtPx = applyCardStackAtPx;
window.cardIds = cardIds;
window.segVh = segVh;

ScrollTrigger.addEventListener('refreshInit', updateCardMetrics);

if (!document.getElementById('wcScrollDriver')) {
ScrollTrigger.create({
  trigger: '#cards-wrap',
  start: 'top top',
  end: 'bottom bottom',
  pin: '#cards-stage',
  pinSpacing: false,
  scrub: true,
  invalidateOnRefresh: true,
  onUpdate: function(self) {
    var cardsScroll = segVh * cardIds.length;
    var px = self.progress * cardsScroll;
    applyCardStackAtPx(px, null);
  },

  /* Guarantee fully hidden when the user scrolls past cards into resume.
     scrub can occasionally miss the last onUpdate frame. */
  onLeave: function() {
    gsap.set('.cor',        { opacity: 0, y: -22 });
    gsap.set('.side-label', { opacity: 0, y: -22 });
  },

  /* Restore when user scrolls BACK into cards from resume;
     onUpdate (scrub) takes over immediately and handles the rest. */
  onEnterBack: function() {
    gsap.set('.cor',        { opacity: 0, y: -22 });
    gsap.set('.side-label', { opacity: 0, y: -22 });
  }
});
} else {
  applyCardStackAtPx(0, 0);
}
"""

one(OLD, NEW, "cards block")

# 6) image-loader after ScrollTrigger CDN
one(
    '<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>\n',
    '<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>\n'
    '<script src="js/image-loader.js"></script>\n',
    "image-loader script",
)

# 7) Module scripts after big inline block
one(
    "</script>\n\n<script type=\"importmap\">",
    "</script>\n\n"
    '<script src="js/canvas-interaction.js"></script>\n'
    '<script src="js/image-preview.js"></script>\n'
    '<script src="js/hero-animation.js"></script>\n\n'
    '<script type="importmap">',
    "works JS after inline",
)

# 8) Preview overlay + skip link target
PREVIEW = """
<div id="preview-overlay" hidden role="dialog" aria-modal="true" aria-label="Image preview">
  <div class="pv-hit" aria-hidden="true"></div>
  <div class="pv-inner">
    <button type="button" class="pv-close" aria-label="Close preview">&times;</button>
    <button type="button" class="pv-nav pv-prev" aria-label="Previous image">&#8249;</button>
    <img class="pv-img" src="" alt="" decoding="async" draggable="false">
    <button type="button" class="pv-nav pv-next" aria-label="Next image">&#8250;</button>
  </div>
</div>
"""

one(
    "<!-- WORKS CANVAS: see js/image-loader.js, hero-animation.js, image-preview.js -->\n\n\n</body>",
    "<!-- WORKS CANVAS: see js/image-loader.js, hero-animation.js, image-preview.js -->\n"
    + PREVIEW
    + "\n</body>",
    "preview overlay",
)

p.write_text(text, encoding="utf-8")
print("Wrote", p)
