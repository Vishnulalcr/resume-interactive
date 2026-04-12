/**
 * animations.js — Final Build
 *
 * Architecture:
 *  1. Preloader text plays on DOMContentLoaded
 *  2. initPage() — set all hidden states, refresh ST, add is-ready, fade preloader
 *  3. Landing: 5 scroll-snapped sections (no scrub).
 *     Each section triggers a crisp time-based tween — one card per panel.
 *  4. Resume intro fires via landing onLeave (one-shot, no scroll-trigger)
 *  5. Content scroll reveals
 */

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────
   GLOBALS
   ───────────────────────────────────────────────────────── */
var resumeIntroFired = false;

/* ─────────────────────────────────────────────────────────
   1. PRELOADER
   ───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  gsap.timeline({ onComplete: initPage })
    .from('.preloader-inner span', {
      autoAlpha: 0,
      y: 12,
      stagger: 0.048,
      duration: 0.36,
      ease: 'power2.out',
    })
    .to('.preloader-inner span', {
      autoAlpha: 0,
      y: -10,
      stagger: 0.032,
      duration: 0.26,
      ease: 'power2.in',
      delay: 0.44,
    });
});

/* ─────────────────────────────────────────────────────────
   2. PAGE INIT
   ───────────────────────────────────────────────────────── */
function initPage() {
  document.documentElement.classList.remove('is-loading');

  /* Set every animated element to its correct hidden start state
     BEFORE the CSS visibility guard is lifted */
  setAllInitialStates();

  /* Let the browser do one layout pass with hidden states applied */
  ScrollTrigger.refresh();

  /* Lift visibility:hidden — everything is already in its start state */
  document.documentElement.classList.add('is-ready');

  /* One paint frame, then fade the preloader away */
  requestAnimationFrame(function () {
    gsap.to('#preloader', {
      autoAlpha: 0,
      duration: 0.38,
      ease: 'power2.inOut',
      onComplete: function () {
        var el = document.getElementById('preloader');
        if (el) el.style.display = 'none';
      },
    });

    initLandingDeck();
    initMicroInteractions();

    window.addEventListener('load', function () {
      ScrollTrigger.refresh();
    }, { once: true });
  });
}

/* ─────────────────────────────────────────────────────────
   2a. SET ALL INITIAL STATES
   Called while preloader is still fully opaque — nothing visible
   ───────────────────────────────────────────────────────── */
function setAllInitialStates() {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isDesktop    = window.matchMedia('(min-width: 640px)').matches;
  var vpH          = window.innerHeight;

  /* ── Cards: centred via xPercent/yPercent, all invisible ── */
  gsap.set('.lp-card', {
    xPercent: -50,
    yPercent: -50,
    transformOrigin: '50% 50%',
  });

  if (reduceMotion) {
    gsap.set(['#card-01', '#card-02', '#card-03'], { autoAlpha: 0 });
    gsap.set('#card-04', { autoAlpha: 1, scale: 1, x: 0, y: 0, rotation: 0 });
  } else {
    /* Parked below viewport, fully invisible */
    gsap.set('#card-01', { autoAlpha: 0, scale: 0.88, x: -60, y: vpH,      rotation: -13   });
    gsap.set('#card-02', { autoAlpha: 0, scale: 0.88, x:  80, y: vpH,      rotation:  11.5 });
    gsap.set('#card-03', { autoAlpha: 0, scale: 0.88, x: -50, y: vpH,      rotation:  -9.5 });
    gsap.set('#card-04', { autoAlpha: 0, scale: 0.88, x:  60, y: vpH,      rotation:   8   });
  }

  /* ── Resume ── */
  if (reduceMotion) {
    gsap.set([
      '.sidebar', '.sidebar-inner', '.main-content',
      '.profile-photo-wrap', '.name', '.bio',
      '.sidebar-divider', '.contact-item',
    ], { clearProps: 'all' });
    return;
  }

  var sidebarEl    = document.querySelector('.sidebar');
  var sidebarInner = document.querySelector('.sidebar-inner');
  var mainEl       = document.querySelector('.main-content');
  if (!sidebarEl || !sidebarInner || !mainEl) return;

  if (isDesktop) {
    gsap.set(sidebarEl, { autoAlpha: 1, clearProps: 'x,y,rotation,scale' });

    var innerW = sidebarInner.getBoundingClientRect().width || 364;
    var slideX = -(innerW + Math.min(window.innerWidth * 0.08, 96));
    gsap.set(sidebarInner, { x: slideX, autoAlpha: 0 });

    gsap.set('.profile-photo-wrap', { autoAlpha: 0, y: -14 });
    gsap.set('.name',               { autoAlpha: 0, x: -16 });
    gsap.set('.bio',                { autoAlpha: 0, y:   8 });
    gsap.set('.sidebar-divider',    { autoAlpha: 0, scaleX: 0, transformOrigin: 'left center' });
    gsap.set('.contact-item',       { autoAlpha: 0, x: -10 });
    gsap.set(mainEl,                { autoAlpha: 0, scale: 0.96, transformOrigin: 'center top' });
  } else {
    gsap.set(sidebarEl,    { autoAlpha: 1 });
    gsap.set(sidebarInner, { autoAlpha: 0, y: 24 });
    gsap.set(mainEl,       { autoAlpha: 0, y: 40 });
    gsap.set('.profile-photo-wrap', { autoAlpha: 0, y: -14 });
    gsap.set('.name',               { autoAlpha: 0, x: -16 });
    gsap.set('.bio',                { autoAlpha: 0, y:   8 });
    gsap.set('.sidebar-divider',    { autoAlpha: 0, scaleX: 0, transformOrigin: 'left center' });
    gsap.set('.contact-item',       { autoAlpha: 0, x: -10 });
  }
}

/* ─────────────────────────────────────────────────────────
   2b. MICRO INTERACTIONS
   ───────────────────────────────────────────────────────── */
function initMicroInteractions() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.utils.toArray('.contact-item').forEach(function (item) {
    var icon = item.querySelector('.icon-svg');
    item.addEventListener('mouseenter', function () {
      gsap.to(item, { x: 6, duration: 0.22, ease: 'power2.out', overwrite: true });
      if (icon) gsap.to(icon, { x: 1, duration: 0.22, ease: 'power2.out', overwrite: true });
    });
    item.addEventListener('mouseleave', function () {
      gsap.to(item, { x: 0, duration: 0.18, ease: 'power2.out', overwrite: true });
      if (icon) gsap.to(icon, { x: 0, duration: 0.18, ease: 'power2.out', overwrite: true });
    });
  });

  gsap.utils.toArray('.tool-chip').forEach(function (chip) {
    chip.addEventListener('mouseenter', function () {
      gsap.to(chip, { y: -2, duration: 0.20, ease: 'power2.out', overwrite: true });
    });
    chip.addEventListener('mouseleave', function () {
      gsap.to(chip, { y: 0, duration: 0.16, ease: 'power2.out', overwrite: true });
    });
  });
}

/* ─────────────────────────────────────────────────────────
   3. LANDING CARD DECK
   ─────────────────────────────────────────────────────────
   Design:
   - #landing is pinned for 5 scroll "pages" (500vh of scroll space)
   - Each page boundary triggers a crisp time-based tween (NOT scrub)
   - Cards appear one at a time — no overlap, no flash
   - Outro fades all cards and transitions to light background

   Scroll map (each "page" = 1 × innerHeight of scroll):
     Page 0 → 1 : card-01 rises to center
     Page 1 → 2 : card-02 rises, card-01 recedes
     Page 2 → 3 : card-03 rises, stack shifts
     Page 3 → 4 : card-04 rises, full stack
     Page 4 → 5 : outro — cards dissolve, bg lightens → resume
   ───────────────────────────────────────────────────────── */
function initLandingDeck() {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    /* Skip straight to resume */
    if (!resumeIntroFired) {
      resumeIntroFired = true;
      playResumeIntro();
    }
    initResumeAnimations();
    return;
  }

  var vpH = window.innerHeight;
  var gridProxy = { v: 255 };
  var currentPanel = -1;
  var totalScrollPx = vpH * 5; /* 5 discrete panel steps */

  function animatePanel(panel, duration) {
    var d = duration || 0.62;

    if (panel === 0) {
      gsap.to('#card-01', { x: -14, y: 0, rotation: -4, scale: 1, autoAlpha: 1, duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#card-02', { x: 80,  y: vpH, rotation: 11.5, scale: 0.88, autoAlpha: 0, duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#card-03', { x: -50, y: vpH, rotation: -9.5, scale: 0.88, autoAlpha: 0, duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#card-04', { x: 60,  y: vpH, rotation: 8,    scale: 0.88, autoAlpha: 0, duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#landing', { backgroundColor: '#0C0C0D', duration: d, ease: 'power2.inOut', overwrite: true });
      gsap.to(gridProxy, {
        v: 255, duration: d, ease: 'power2.inOut', overwrite: true,
        onUpdate: function () { var c = Math.round(gridProxy.v); window.gridSetColor(c, c, c); },
      });
      return;
    }

    if (panel === 1) {
      gsap.to('#card-01', { x: -58, y: 46, rotation: -8.5, scale: 0.94, autoAlpha: 0.72, duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#card-02', { x: 6,   y: 0,  rotation: 2.4,  scale: 1,    autoAlpha: 1,    duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#card-03', { x: -50, y: vpH, rotation: -9.5, scale: 0.88, autoAlpha: 0, duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#card-04', { x: 60,  y: vpH, rotation: 8,    scale: 0.88, autoAlpha: 0, duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#landing', { backgroundColor: '#0C0C0D', duration: d, ease: 'power2.inOut', overwrite: true });
      gsap.to(gridProxy, {
        v: 255, duration: d, ease: 'power2.inOut', overwrite: true,
        onUpdate: function () { var c = Math.round(gridProxy.v); window.gridSetColor(c, c, c); },
      });
      return;
    }

    if (panel === 2) {
      gsap.to('#card-01', { x: -88, y: 82, rotation: -11.2, scale: 0.89, autoAlpha: 0.44, duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#card-02', { x: 34,  y: 42, rotation: 6.2,   scale: 0.94, autoAlpha: 0.70, duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#card-03', { x: -8,  y: 0,  rotation: -1.8,  scale: 1,    autoAlpha: 1,    duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#card-04', { x: 60,  y: vpH, rotation: 8,    scale: 0.88, autoAlpha: 0, duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#landing', { backgroundColor: '#0C0C0D', duration: d, ease: 'power2.inOut', overwrite: true });
      gsap.to(gridProxy, {
        v: 255, duration: d, ease: 'power2.inOut', overwrite: true,
        onUpdate: function () { var c = Math.round(gridProxy.v); window.gridSetColor(c, c, c); },
      });
      return;
    }

    if (panel === 3) {
      gsap.to('#card-01', { x: -110, y: 112, rotation: -12.8, scale: 0.86, autoAlpha: 0.20, duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#card-02', { x: 50,   y: 72,  rotation: 8.4,   scale: 0.90, autoAlpha: 0.40, duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#card-03', { x: -40,  y: 34,  rotation: -5.1,  scale: 0.95, autoAlpha: 0.70, duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#card-04', { x: 4,    y: 0,   rotation: 1.2,   scale: 1,    autoAlpha: 1,    duration: d, ease: 'power3.out', overwrite: true });
      gsap.to('#landing', { backgroundColor: '#0C0C0D', duration: d, ease: 'power2.inOut', overwrite: true });
      gsap.to(gridProxy, {
        v: 255, duration: d, ease: 'power2.inOut', overwrite: true,
        onUpdate: function () { var c = Math.round(gridProxy.v); window.gridSetColor(c, c, c); },
      });
      return;
    }

    /* panel 4 — outro */
    gsap.to('#card-01', { autoAlpha: 0, y: 170, duration: d, ease: 'power2.in', overwrite: true });
    gsap.to('#card-02', { autoAlpha: 0, y: 140, duration: d, ease: 'power2.in', overwrite: true });
    gsap.to('#card-03', { autoAlpha: 0, y: 95,  duration: d, ease: 'power2.in', overwrite: true });
    gsap.to('#card-04', { autoAlpha: 0, y: -40, duration: d, ease: 'power2.in', overwrite: true });
    gsap.to('#landing', { backgroundColor: '#F8F7F4', duration: d, ease: 'power2.inOut', overwrite: true });
    gsap.to(gridProxy, {
      v: 15, duration: d, ease: 'power2.inOut', overwrite: true,
      onUpdate: function () { var c = Math.round(gridProxy.v); window.gridSetColor(c, c, c); },
    });
  }

  function setPanel(panel, immediate) {
    if (panel === currentPanel) return;
    currentPanel = panel;
    animatePanel(panel, immediate ? 0.01 : 0.62);
  }

  /* Ensure first panel is visible right after preloader */
  setPanel(0, true);

  ScrollTrigger.create({
    trigger: '#landing',
    start: 'top top',
    end: '+=' + totalScrollPx,
    pin: true,
    anticipatePin: 1,
    onUpdate: function (self) {
      var panel = Math.min(4, Math.floor(self.progress * 5));
      setPanel(panel, false);
    },
    onLeave: function () {
      if (!resumeIntroFired) {
        resumeIntroFired = true;
        playResumeIntro();
      }
    },
  });

  /* Init resume scroll reveals (content reveals; intro fires via onLeave) */
  initResumeAnimations();
}

/* ─────────────────────────────────────────────────────────
   4. RESUME INTRO — one-shot, fires from landing onLeave
   ───────────────────────────────────────────────────────── */
function playResumeIntro() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var isDesktop    = window.matchMedia('(min-width: 640px)').matches;
  var sidebarInner = document.querySelector('.sidebar-inner');
  var mainEl       = document.querySelector('.main-content');
  if (!sidebarInner || !mainEl) return;

  if (isDesktop) {
    gsap.timeline()
      /* Main content scales + fades in */
      .to(mainEl, {
        autoAlpha: 1, scale: 1,
        duration: 0.65, ease: 'power3.out',
      }, 0)
      /* Sidebar slides in from left */
      .to(sidebarInner, {
        x: 0, autoAlpha: 1,
        duration: 0.58, ease: 'power3.out',
      }, 0.16)
      /* Sidebar elements cascade */
      .to('.profile-photo-wrap', { autoAlpha: 1, y: 0, duration: 0.42, ease: 'power3.out' }, 0.28)
      .to('.name',               { autoAlpha: 1, x: 0, duration: 0.42, ease: 'power3.out' }, 0.36)
      .to('.bio',                { autoAlpha: 1, y: 0, duration: 0.42, ease: 'power3.out' }, 0.42)
      .to('.sidebar-divider',    { autoAlpha: 1, scaleX: 1, duration: 0.38, ease: 'power2.out' }, 0.50)
      .to('.contact-item', {
        autoAlpha: 1, x: 0,
        stagger: 0.07,
        duration: 0.36, ease: 'power3.out',
      }, 0.56);
  } else {
    gsap.timeline()
      .to(mainEl,       { autoAlpha: 1, y: 0, duration: 0.52, ease: 'power3.out' }, 0)
      .to(sidebarInner, { autoAlpha: 1, y: 0, duration: 0.46, ease: 'power3.out' }, 0.12)
      .to('.profile-photo-wrap', { autoAlpha: 1, y: 0, duration: 0.36, ease: 'power3.out' }, 0.24)
      .to('.name',               { autoAlpha: 1, x: 0, duration: 0.36, ease: 'power3.out' }, 0.30)
      .to('.bio',                { autoAlpha: 1, y: 0, duration: 0.36, ease: 'power3.out' }, 0.36)
      .to('.sidebar-divider',    { autoAlpha: 1, scaleX: 1, duration: 0.30, ease: 'power2.out' }, 0.44)
      .to('.contact-item', {
        autoAlpha: 1, x: 0,
        stagger: 0.06,
        duration: 0.30, ease: 'power3.out',
      }, 0.50);
  }
}

/* ─────────────────────────────────────────────────────────
   5. RESUME CONTENT SCROLL REVEALS
   ───────────────────────────────────────────────────────── */
function initResumeAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set([
      '.sidebar', '.sidebar-inner', '.main-content',
      '.profile-photo-wrap', '.name', '.bio',
      '.sidebar-divider', '.contact-item',
    ], { clearProps: 'all' });
    return;
  }

  var isMobile = window.matchMedia('(max-width: 639px)').matches;

  /* Mobile: fire resume intro when #resume scrolls into view */
  if (isMobile) {
    ScrollTrigger.create({
      trigger: '#resume',
      start: 'top 90%',
      once: true,
      onEnter: function () {
        if (!resumeIntroFired) {
          resumeIntroFired = true;
          playResumeIntro();
        }
      },
    });
  }

  /* Section labels */
  gsap.utils.toArray('.section-label').forEach(function (el, i) {
    if (i === 0) return;
    gsap.from(el, {
      y: 8, autoAlpha: 0,
      duration: 0.50, ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  /* Section rules */
  gsap.utils.toArray('.section-rule').forEach(function (el) {
    gsap.from(el, {
      scaleX: 0, autoAlpha: 0,
      transformOrigin: 'left center',
      duration: 0.75, ease: 'power3.out',
      immediateRender: false,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  /* Role titles */
  gsap.utils.toArray('.role-title').forEach(function (el, i) {
    if (i === 0) return;
    gsap.from(el, {
      y: 14, autoAlpha: 0,
      duration: 0.60, ease: 'power3.out',
      immediateRender: false,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  /* Meta rows */
  gsap.utils.toArray('.meta-row').forEach(function (el, i) {
    if (i === 0) return;
    gsap.from(el, {
      y: 10, autoAlpha: 0,
      duration: 0.48, ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: { trigger: el, start: 'top 87%', once: true },
    });
  });

  /* Bullet points */
  ScrollTrigger.batch('.jobs .job:not(:first-child) .bullets li', {
    start: 'top 88%',
    once: true,
    onEnter: function (batch) {
      gsap.from(batch, {
        y: 10, autoAlpha: 0,
        stagger: 0.04, duration: 0.44,
        ease: 'power2.out', overwrite: true,
      });
    },
  });

  /* Tool chips */
  gsap.utils.toArray('.tools').forEach(function (section) {
    gsap.from(section.querySelectorAll('.tool-chip'), {
      y: 8, autoAlpha: 0,
      stagger: { each: 0.05, from: 'start' },
      duration: 0.44, ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: { trigger: section, start: 'top 85%', once: true },
    });
  });
}
