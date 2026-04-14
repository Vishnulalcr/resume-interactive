/* ═══ CURSOR ══════════════════════════════════════════════════════════ */
const cur = document.getElementById('cur');
let mx=0,my=0,cx=0,cy=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY});
document.querySelectorAll('[data-scramble],a,.rztc').forEach(el=>{
  el.addEventListener('mouseenter',()=>cur.classList.add('big'));
  el.addEventListener('mouseleave',()=>cur.classList.remove('big'));
});
(function loop(){
  cx+=(mx-cx)*0.1; cy+=(my-cy)*0.1;
  cur.style.left=cx+'px'; cur.style.top=cy+'px';
  requestAnimationFrame(loop);
})();

/* ═══ IST CLOCK (before scramble so _corClockText exists for #cor-clock) ═══ */
(function() {
  var el = document.getElementById('cor-clock');
  if (!el) return;
  function tick() {
    var now = new Date();
    var opts = {timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true};
    var t = now.toLocaleString('en-IN', opts);
    t = t.replace(/[\u202f\u00a0]/g, ' ').replace(/\bam\b/i, 'AM').replace(/\bpm\b/i, 'PM');
    window._corClockText = t + ' IST';
    if (!window._corClockScrambleActive) el.textContent = window._corClockText;
  }
  tick();
  setInterval(tick, 1000);
})();

/* ═══ SCRAMBLE ════════════════════════════════════════════════════════
   Pattern from GreenSock forum (gsap.com/community/forums/topic/32871)
   - Per-element isolated state, never shared
   - mouseenter / mouseleave (not mouseover/mouseout)
   - Kill on leave, restore text instantly
   - Chars: glyphs+numbers only, no letters
   - Colors: random per-char per-frame, white weighted heavily
══════════════════════════════════════════════════════════════════════ */
const SCHARS = '0123456789!@#$%^&*()[]{}<>|/~`+-=_'.split('');
const SCOLS = [
  '#FF0080','#00FF41','#00FFFF','#FF6600','#FFFF00',
  '#BF00FF','#FF3131','#0FF0FC','#39FF14','#FF1493',
  '#ffffff','#ffffff','#ffffff','#ffffff','#ffffff',
  '#cccccc','#888888','#000000'
];
function rg(){ return SCHARS[Math.floor(Math.random()*SCHARS.length)]; }
function rc(){ return SCOLS[Math.floor(Math.random()*SCOLS.length)]; }

function renderScramble(el, orig, resolvedCount) {
  let html = '';
  for (let i=0; i<orig.length; i++) {
    const ch = orig[i];
    if (ch === ' ') { html += ' '; continue; }
    if (resolvedCount >= 0 && i < resolvedCount) {
      html += '<span style="color:rgba(255,255,255,.93)">' + ch + '</span>';
    } else {
      html += '<span style="color:' + rc() + '">' + rg() + '</span>';
    }
  }
  el.innerHTML = html;
}

document.querySelectorAll('[data-scramble]').forEach(function(el) {
  /* Skip elements in resume section */
  if (el.closest('#resume')) return;

  var orig = el.textContent;
  var rafId = null;
  var glitchT = null;
  var idleT = null;
  var active = false;

  /* ── card titles: one-shot hover + random idle loop ── */
  var isCardTitle = el.classList.contains('crd-title');
  var isClock = el.id === 'cor-clock';
  var isCornerLike = el.classList.contains('cor') || el.classList.contains('side-label') || isClock;
  var cardHoverDone = false;

  function getOrig() {
    if (isClock) return window._corClockText || orig;
    return orig;
  }

  /* Build word-boundary map: array of {start, end} char ranges per word */
  function wordRanges(str) {
    var ranges = [];
    var inWord = false, wStart = 0;
    for (var i = 0; i <= str.length; i++) {
      var c = str[i] || ' ';
      if (c !== ' ' && !inWord) { inWord = true; wStart = i; }
      else if ((c === ' ' || i === str.length) && inWord) {
        ranges.push({start: wStart, end: i});
        inWord = false;
      }
    }
    return ranges;
  }

  /* Render with resolved-word granularity (resolvedWords = how many words are locked) */
  function renderScrambleWords(el, orig, resolvedWords) {
    var ranges = wordRanges(orig);
    var chars = orig.split('');
    var locked = new Array(chars.length).fill(false);
    for (var w = 0; w < resolvedWords && w < ranges.length; w++) {
      for (var k = ranges[w].start; k < ranges[w].end; k++) locked[k] = true;
    }
    var html = '';
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      if (ch === ' ') { html += ' '; continue; }
      html += locked[i]
        ? '<span style="color:rgba(255,255,255,.93)">' + ch + '</span>'
        : '<span style="color:' + rc() + '">' + rg() + '</span>';
    }
    el.innerHTML = html;
  }

  function startGlitch() {
    function tick() {
      if (!active) return;
      var chars = getOrig().split('');
      var eligible = [];
      chars.forEach(function(c,i){ if(c !== ' ') eligible.push(i); });
      var count = Math.random() > 0.55 ? 2 : 1;
      eligible.sort(function(){ return Math.random()-0.5; });
      var picks = eligible.slice(0, count);
      var html = '';
      chars.forEach(function(ch, i) {
        if (ch === ' ') { html += ' '; return; }
        html += picks.indexOf(i) >= 0
          ? '<span style="color:' + rc() + '">' + rg() + '</span>'
          : '<span style="color:rgba(255,255,255,.93)">' + ch + '</span>';
      });
      el.innerHTML = html;
      glitchT = setTimeout(tick, 120 + Math.random()*60);
    }
    tick();
  }

  /* Random idle glitch burst for card titles: fires once, then reschedules */
  function scheduleIdleGlitch() {
    clearTimeout(idleT);
    var delay = 4000 + Math.random() * 6000; /* 4–10 s */
    idleT = setTimeout(function() {
      if (active) { scheduleIdleGlitch(); return; }
      /* short burst: full scramble for 180 ms then resolve quickly */
      var burstStart = null;
      var BURST_FULL = 180;
      var BURST_RESOLVE = 400;
      var burstRaf;
      function burstFrame(ts) {
        if (!burstStart) burstStart = ts;
        var e = ts - burstStart;
        if (e < BURST_FULL) {
          renderScramble(el, orig, -1);
        } else if (e < BURST_FULL + BURST_RESOLVE) {
          var p = (e - BURST_FULL) / BURST_RESOLVE;
          renderScramble(el, orig, Math.floor(p * orig.length));
        } else {
          el.textContent = orig;
          scheduleIdleGlitch();
          return;
        }
        burstRaf = requestAnimationFrame(burstFrame);
      }
      burstRaf = requestAnimationFrame(burstFrame);
    }, delay);
  }

  function runHoverAnim(slowMode) {
    active = true;
    if (isClock) window._corClockScrambleActive = true;
    clearTimeout(glitchT);
    cancelAnimationFrame(rafId);

    var startTime = null;
    /* slowMode (w-13): 80% slower — PHASE_A 200→360, PHASE_B 700→3500 */
    var PHASE_A = slowMode ? 360  : 200;
    var PHASE_B = slowMode ? 3500 : 700;
    var animStr = getOrig();
    var words = wordRanges(animStr);

    function frame(ts) {
      if (!active) return;
      if (!startTime) startTime = ts;
      var elapsed = ts - startTime;
      if (elapsed < PHASE_A) {
        /* full scramble phase */
        if (slowMode) renderScrambleWords(el, animStr, 0);
        else          renderScramble(el, animStr, -1);
      } else if (elapsed < PHASE_A + PHASE_B) {
        var prog = (elapsed - PHASE_A) / PHASE_B;
        if (slowMode) {
          /* resolve word-by-word */
          renderScrambleWords(el, animStr, Math.floor(prog * words.length));
        } else {
          renderScramble(el, animStr, Math.floor(prog * animStr.length));
        }
      } else {
        el.textContent = isClock ? getOrig() : animStr;
        if (isClock) window._corClockScrambleActive = false;
        if (!isCardTitle && !isClock) startGlitch();
        return;
      }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
  }

  el.addEventListener('mouseenter', function() {
    /* card titles: only animate on first hover; idle loop handles subsequent */
    if (isCardTitle) {
      if (cardHoverDone) return;
      cardHoverDone = true;
      clearTimeout(idleT);
      runHoverAnim(false);
      /* after animation finishes, start idle loop */
      var waitForAnim = setTimeout(function() {
        scheduleIdleGlitch();
      }, 200 + 700 + 100);
      return;
    }
    if (active) return;
    runHoverAnim(false);
  });

  el.addEventListener('mouseleave', function() {
    if (isCardTitle) return; /* card titles don't reset on leave */
    active = false;
    if (isClock) window._corClockScrambleActive = false;
    cancelAnimationFrame(rafId);
    clearTimeout(glitchT);
    el.textContent = getOrig();
  });

  el.addEventListener('touchstart', function(){ el.dispatchEvent(new MouseEvent('mouseenter')); }, {passive:true});
  el.addEventListener('touchend', function(){ setTimeout(function(){ el.dispatchEvent(new MouseEvent('mouseleave')); }, 900); });

  /* ── corner / side labels / clock: idle glitch loop (random every 2-3s) ── */
  if (isCornerLike) {
    var cornerIdleDelay = 2000 + Math.random() * 1000; /* 2–3 s */
    var cornerIdleT = setTimeout(function() {
      function scheduleCornerGlitch() {
        clearTimeout(cornerIdleT);
        var delay = 2000 + Math.random() * 1000; /* 2–3 s */
        cornerIdleT = setTimeout(function() {
          if (active) { scheduleCornerGlitch(); return; }
          var snap = getOrig();
          if (isClock) window._corClockScrambleActive = true;
          /* short burst: full scramble for 180 ms then resolve */
          var burstStart = null;
          var BURST_FULL = 180;
          var BURST_RESOLVE = 400;
          var burstRaf;
          function burstFrame(ts) {
            if (!burstStart) burstStart = ts;
            var e = ts - burstStart;
            if (e < BURST_FULL) {
              renderScramble(el, snap, -1);
            } else if (e < BURST_FULL + BURST_RESOLVE) {
              var p = (e - BURST_FULL) / BURST_RESOLVE;
              renderScramble(el, snap, Math.floor(p * snap.length));
            } else {
              if (isClock) {
                window._corClockScrambleActive = false;
                el.textContent = getOrig();
              } else {
                el.textContent = snap;
              }
              scheduleCornerGlitch();
              return;
            }
            burstRaf = requestAnimationFrame(burstFrame);
          }
          burstRaf = requestAnimationFrame(burstFrame);
        }, delay);
      }
      scheduleCornerGlitch();
    }, cornerIdleDelay);
  }
});

/* ═══ DOT GRID ════════════════════════════════════════════════════════ */
(function(){
  var cv = document.getElementById('gc');
  var ctx = cv.getContext('2d');
  var S=30, R=1.1, BA=0.065, PA=0.32, RA=130, LR=0.042;
  var W=0, H=0, dots=[];
  var m = {x:-9999, y:-9999};
  window._rzt = 999999;

  function build() {
    dots = [];
    var cols=Math.ceil(W/S)+1, rows=Math.ceil(H/S)+1;
    for (var r=0; r<rows; r++)
      for (var c=0; c<cols; c++)
        dots.push({x:c*S, y:r*S, a:BA});
  }
  function resize(){ W=cv.width=innerWidth; H=cv.height=innerHeight; build(); }
  addEventListener('mousemove', function(e){ m.x=e.clientX; m.y=e.clientY; });
  document.documentElement.addEventListener('mouseleave', function(){ m.x=-9999; m.y=-9999; });
  addEventListener('resize', resize);

  function tick() {
    ctx.clearRect(0,0,W,H);
    var sy = scrollY||0;
    for (var i=0; i<dots.length; i++) {
      var d = dots[i];
      var dx=d.x-m.x, dy=d.y-m.y, dist=Math.sqrt(dx*dx+dy*dy);
      var t = Math.max(0, 1-dist/RA);
      d.a += (BA + t*t*(PA-BA) - d.a)*LR;
      var dark = (d.y+sy) < window._rzt;
      ctx.beginPath(); ctx.arc(d.x, d.y, R, 0, Math.PI*2);
      ctx.fillStyle = dark ? 'rgba(255,255,255,'+d.a.toFixed(3)+')' : 'rgba(0,0,0,'+d.a.toFixed(3)+')';
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  resize(); tick();
})();

/* ═════════════════════════════════════════════════════════════════════
   HAPTIC MANAGER  v3 — fully native, no external dependency
   ─────────────────────────────────────────────────────────────────────
   iOS Safari 17.4+  →  switch-checkbox label trick (self-mounted)
     · CRITICAL: label/input must use position:fixed + opacity:0, NOT
       display:none — WebKit won't fire UIKit haptics on hidden elements
     · CRITICAL: must be called from a user gesture (touchstart, touchend,
       touchmove, click). Scroll events / RAF / setTimeout do NOT count.
       Bio scroll haptics use a separate touchmove listener (see below).

   Android Chrome  →  navigator.vibrate() with on/off pattern arrays
     · Works from any context including scroll/RAF
     · Pattern arrays [on, off, on...] give nuanced feel (success, error)
   ═════════════════════════════════════════════════════════════════════ */
class HapticManager {
  constructor() {
    // iOS detection: covers iPhone, iPad (modern iPadOS reports MacIntel)
    // Excludes Chrome/Firefox/Opera on iOS (they don't have the switch trick)
    this.isIOS = (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
                 !/CriOS|FxiOS|OPiOS/i.test(navigator.userAgent);
    this.isAndroid = /Android/i.test(navigator.userAgent);
    this._droidOK  = this.isAndroid && 'vibrate' in navigator;
    this._lastFired = 0;
    this._minGap    = 40;
    this._label     = null; // iOS switch label — click THIS, not the input
    this._input     = null;

    // Mount iOS switch elements as soon as DOM is ready
    if (this.isIOS) {
      var self = this;
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { self._mount(); }, { once: true });
      } else {
        this._mount();
      }
    }
  }

  // ── Mount hidden switch + label pair ─────────────────────────────────
  // position:fixed + opacity:0 is REQUIRED — display:none blocks UIKit haptic
  _mount() {
    if (this._label) return; // already mounted
    var uid = '__hap_sw__';
    var inp = document.createElement('input');
    inp.type = 'checkbox';
    inp.id = uid;
    inp.setAttribute('switch', '');
    inp.setAttribute('aria-hidden', 'true');
    inp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    var lbl = document.createElement('label');
    lbl.htmlFor = uid;
    lbl.setAttribute('aria-hidden', 'true');
    lbl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(inp);
    document.body.appendChild(lbl);
    this._input = inp;
    this._label = lbl;
  }

  get _iosOK()     { return this.isIOS && !!this._label; }
  get isSupported() { return this._iosOK || this._droidOK; }

  // ── Throttle guard ───────────────────────────────────────────────────
  _canFire(bypass) {
    if (!this.isSupported) return false;
    var now = Date.now();
    if (!bypass && now - this._lastFired < this._minGap) return false;
    this._lastFired = now;
    return true;
  }

  // ── iOS: click the LABEL (NOT the input) ─────────────────────────────
  // Label click toggles checkbox → UIKit fires one haptic pulse
  // Must be called synchronously inside a user gesture handler
  _ios() {
    if (!this._label) this._mount();
    try { this._label.click(); } catch(e) {}
  }

  // ── Android: vibrate single duration or [on,off,on...] pattern ───────
  _droid(p) { try { navigator.vibrate(p); } catch(e) {} }

  // ══ PUBLIC API ════════════════════════════════════════════════════════

  // Single soft tick — any button press, badge show, bio per-word
  light() {
    if (!this._canFire()) return;
    this._iosOK ? this._ios() : this._droid(12);
  }

  // Solid single — modal open, card tap, sphere mode entry
  medium() {
    if (!this._canFire()) return;
    this._iosOK ? this._ios() : this._droid(36);
  }

  // Strong single (+ trailing Android rumble)
  heavy() {
    if (!this._canFire()) return;
    this._iosOK ? this._ios() : this._droid(70);
  }

  // Two-bump confirm — sticker placed, email sent, download
  success() {
    if (!this._canFire(true)) return;
    this._iosOK ? this._ios() : this._droid([40, 30, 65]);
  }

  // Triple rattle — validation fail, rejected action
  error() {
    if (!this._canFire(true)) return;
    this._iosOK ? this._ios() : this._droid([22, 18, 22, 18, 44]);
  }

  // Two-beat notify
  notify() {
    if (!this._canFire(true)) return;
    this._iosOK ? this._ios() : this._droid([50, 30, 32]);
  }
}

const haptics = new HapticManager();
window.haptics = haptics; // expose to module script

/* ═══ LENIS + GSAP ════════════════════════════════════════════════════ */
gsap.registerPlugin(ScrollTrigger);
var lenis = new Lenis({
  duration: 1.2,
  easing: function(t){ return Math.min(1, 1.001-Math.pow(2,-10*t)); },
  smoothWheel: true,
  syncTouch: false
});
gsap.ticker.add(function(time){ lenis.raf(time*1000); });
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);

/* ═══ HERO CORNERS ════════════════════════════════════════════════════ */
gsap.set('.cor',{opacity:0,y:6});
gsap.to('.cor',{opacity:1,y:0,stagger:0.1,duration:0.7,ease:'power3.out',delay:0.2});

/* Restore default cursor once hero (sphere) scrolls out */
ScrollTrigger.create({
  trigger: '#hero',
  start: 'bottom top',
  onLeave: function() {
    document.body.style.cursor = 'auto';
    window._sphereVisible = false;
  },
  onEnterBack: function() {
    document.body.style.cursor = 'none';
    window._sphereVisible = true;
  }
});

/* ═══ HERO: sphere scale/blur + hero statement fade (pinned) ═══════════
   After 50% progress: fade WebGL to zero, hide canvas, skip Three render loop (see animate()). */
var PIN = 900;
var sphereVisual = document.getElementById('sphere-visual');
var sphereCanvas = document.getElementById('sphere-canvas');
var heroStatement = document.getElementById('hero-statement');
window._sphereWebglSuspended = false;

gsap.set(heroStatement, {opacity: 0, y: 40});
if (sphereVisual) gsap.set(sphereVisual, {scale: window.innerWidth <= 768 ? 0.75 : 1, opacity: 1, filter: 'blur(0px)'});

ScrollTrigger.create({
  trigger: '#hero',
  start: 'top top',
  end: '+=' + PIN,
  pin: '#hs',
  pinSpacing: true,
  scrub: 0.45,
  onUpdate: function(self) {
    var p = self.progress;
    if (!sphereVisual) return;
    var sc = 1 - p * 0.6;
    if (window.innerWidth <= 768) sc *= 0.75;
    var bl = p * 10;
    var baseOp = 1 - p * 0.15;
    /* Fade sphere out after halfway through hero scrub; then stop WebGL work */
    var t0 = 0.5;
    var t1 = 0.63;
    var killT = p <= t0 ? 0 : Math.min(1, (p - t0) / (t1 - t0));
    var visOp = baseOp * (1 - killT);
    var suspended = killT >= 1;

    sphereVisual.style.transform = 'scale(' + sc + ')';
    sphereVisual.style.opacity = String(visOp);
    sphereVisual.style.filter = 'blur(' + bl + 'px)';
    sphereVisual.style.pointerEvents = suspended ? 'none' : '';

    if (sphereCanvas) sphereCanvas.style.display = suspended ? 'none' : '';

    window._sphereWebglSuspended = suspended;
    /* Cursor sticker / sphere hit-tests only while WebGL is active */
    window._sphereVisible = !suspended;

    /* ─ HERO STATEMENT: fade in and slide up as sphere animates ─ */
    /* Starts appearing at 10% progress, fully visible by 45% */
    var stmtStartP = 0.1;
    var stmtEndP = 0.45;
    var stmtProgress = p < stmtStartP ? 0 : Math.min(1, (p - stmtStartP) / (stmtEndP - stmtStartP));
    heroStatement.style.opacity = String(stmtProgress);
    heroStatement.style.transform =
      'translateY(' + (40 * (1 - stmtProgress)) + 'px) ' +
      'scale(' + (0.92 + stmtProgress * 0.08) + ') ' +
      'rotateY(' + (-8 * (1 - stmtProgress)) + 'deg)';
    heroStatement.style.transformOrigin = 'center center';
  }
});

/* ═══ STATS: reveal when stats section enters viewport ═══════════════════ */
gsap.fromTo('#stats',
  { opacity: 0, y: 30 },
  {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '#stats',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    }
  }
);

/* ═══ STATS: count up once ═════════════════════════════════════════════ */
var statsDone = false;
function formatStatNum(el, n, suf) {
  var t = Math.round(n);
  if (suf === 'K+') return t + 'K+';
  if (suf === '+') return t + '+';
  return String(t);
}
ScrollTrigger.create({
  trigger: '#stats',
  start: 'top 78%',
  once: true,
  onEnter: function() {
    if (statsDone) return;
    statsDone = true;
    document.querySelectorAll('.stat-num[data-count]').forEach(function(el) {
      var target = parseFloat(el.getAttribute('data-count'), 10);
      var suf = el.getAttribute('data-suffix') || '';
      var obj = {v: 0};
      gsap.to(obj, {
        v: target,
        duration: 1.85,
        ease: 'power2.out',
        onUpdate: function() {
          el.textContent = formatStatNum(el, obj.v, suf);
        }
      });
    });
  }
});

/* ═══ CARDS — scrub stack (560vh wrap, full-viewport stage — card proportions restored) ═══════════ */
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

function mix(a, b, p) {
  return Math.round(a + (b - a) * p);
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function rgb(r, g, b) {
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function rgba(r, g, b, a) {
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

/* ─────────────────────────────────────────────────────────────────────
   Corner + side label chrome sync
   · Tints corners from white text → dark text as page goes light
   · Exits corners AND side labels exactly in step with the white flip:
     exit starts at ~88.5% progress (= moment white transition begins),
     completes at 98% so everything is fully gone before resume arrives
   ───────────────────────────────────────────────────────────────────── */
function syncCornerChrome(lightSmoothP, cardsWrapProgress) {
  var lp    = clamp01(lightSmoothP);
  var wrapP = clamp01(cardsWrapProgress == null ? 0 : cardsWrapProgress);

  /* Exit window: 0.885 → 0.975 (tightly matches the white flip) */
  var exitT = clamp01((wrapP - 0.885) / 0.09);

  /* Corner label colour: white → dark as bg lightens */
  var r = mix(255, 18, lp);
  var g = mix(255, 19, lp);
  var b = mix(255, 20, lp);
  var a = (0.28 + 0.5 * lp) * (1 - exitT);

  gsap.set('.cor', {
    color:   'rgba(' + r + ',' + g + ',' + b + ',' + a + ')',
    y:       -exitT * 22,   /* subtle 22 px upward drift with the card */
    opacity: 1 - exitT
  });

  /* Side labels (BLOG / LET'S TALK): same exit, colour fades with bg */
  var sideA = mix(55, 0, lp) / 100;          /* 0.55 on dark → 0 on white */
  gsap.set('.side-label', {
    y:       -exitT * 22,
    opacity: sideA * (1 - exitT)
  });
}

/* All 4 cards share the same light-mode transition so they all flip together */
function setLastCardLightMode(progress) {
  /* steep ease: snap quickly once threshold is crossed */
  var raw = clamp01(progress);
  var p = clamp01(raw * raw * (3 - 2 * raw)); /* smoothstep for fast snap */

  document.body.style.background = rgb(
    mix(10, 253, p),
    mix(10, 253, p),
    mix(11, 253, p)
  );

  cardEls.forEach(function(el) {
    var num   = el.querySelector('.crd-num');
    var title = el.querySelector('.crd-title');
    var body  = el.querySelector('.crd-body');
    var tools = el.querySelector('.crd-tools');

    el.style.backgroundColor = rgb(mix(14, 253, p), mix(14, 253, p), mix(15, 253, p));
    /* border: white→light-grey */
    el.style.borderColor = rgba(mix(255, 18, p), mix(255, 18, p), mix(255, 20, p), 0.10);
    /* shadow: heavy dark → soft neutral on light (alpha stays readable on white) */
    var shY = mix(24, 10, p);
    var shBlur = mix(64, 32, p);
    var shR = mix(0, 22, p);
    var shG = mix(0, 24, p);
    var shB = mix(0, 28, p);
    var shA = mix(80, 16, p) / 100;
    el.style.boxShadow = '0 ' + shY + 'px ' + shBlur + 'px ' + rgba(shR, shG, shB, shA);
    /* Type hierarchy: title strongest → body mid → num/tools muted (aligned with CSS) */
    if (num)   num.style.color   = rgba(mix(255, 18, p), mix(255, 19, p), mix(255, 20, p), 0.26 + 0.36 * p);
    if (title) title.style.color = rgba(mix(255, 18, p), mix(255, 19, p), mix(255, 20, p), 0.94);
    if (body)  body.style.color  = rgba(mix(255, 18, p), mix(255, 19, p), mix(255, 20, p), 0.52 + 0.28 * p);
    if (tools) tools.style.color = rgba(mix(255, 18, p), mix(255, 19, p), mix(255, 20, p), 0.24 + 0.32 * p);
  });
  return p;
}

setLastCardLightMode(0);

/* ═══ RESUME TRANSITION ═══════════════════════════════════════════════ */
ScrollTrigger.create({
  trigger: '#rz',
  start: 'top 85%',
  onEnter: function() {
    window._rzt = document.getElementById('rz').getBoundingClientRect().top + scrollY;
  }
});

requestAnimationFrame(function(){ ScrollTrigger.refresh(); });
window.addEventListener('resize', function(){ ScrollTrigger.refresh(); });

/* ═══ RESUME SCROLL ACTIVATION ════════════════════════════════════════
   While the cursor is over .rzmc the inner panel scrolls independently.
   Lenis is stopped so its smooth-scroll doesn't fight the inner scroll.
   Moving out of #rz restores Lenis page scroll.
══════════════════════════════════════════════════════════════════════ */
(function() {
  var rzmc = document.querySelector('.rzmc');
  var rz   = document.getElementById('rz');
  if (!rzmc || !rz) return;

  rzmc.addEventListener('mouseenter', function() {
    lenis.stop();
  });

  rzmc.addEventListener('mouseleave', function() {
    lenis.start();
  });

  rz.addEventListener('mouseleave', function() {
    lenis.start();
  });
})();

/* ═══ RESUME ANIMATIONS — identical to zip ═══════════════════════════ */
window.addEventListener('load', function() {
  var scr = document.querySelector('.rzmc');
  if (!scr) return;
  var mm = gsap.matchMedia();
  mm.add(
    {motion:'(prefers-reduced-motion:no-preference)', reduced:'(prefers-reduced-motion:reduce)'},
    function(ctx) {
      var motion = ctx.conditions.motion;
      var allEls = ['.rzppw','.rznm','.rzbio','.rzdiv','.rzci',
        '.rzsl','.rzrt','.rzmr','.rzbul li','.rztc','.rzsr'];
      if (!motion) { gsap.set(allEls, {clearProps:'all'}); return; }

      gsap.set('.rzppw',{autoAlpha:0,y:-20});
      gsap.set('.rznm', {autoAlpha:0,x:-18});
      gsap.set('.rzbio',{autoAlpha:0});
      gsap.set('.rzdiv',{autoAlpha:0,scaleX:0,transformOrigin:'left center'});
      gsap.set('.rzci', {autoAlpha:0,x:-14});
      gsap.set('.rzsl', {autoAlpha:0,y:10});
      gsap.set('.rzsr', {autoAlpha:0,scaleX:0,transformOrigin:'left center'});
      gsap.set('.rzrt', {autoAlpha:0,y:20});
      gsap.set('.rzmr', {autoAlpha:0,y:12});
      gsap.set('.rzbul li',{autoAlpha:0,y:14});
      gsap.set('.rztc', {autoAlpha:0,y:10});

      ScrollTrigger.create({
        trigger:'#rz', start:'top 65%', once:true,
        onEnter: function() {
          gsap.timeline({delay:0.1})
            .to('.rzppw',{autoAlpha:1,y:0,duration:0.7,ease:'power2.out'})
            .to('.rznm', {autoAlpha:1,x:0,duration:0.8,ease:'power2.out'},'-=0.4')
            .to('.rzbio',{autoAlpha:1,duration:0.65},'-=0.35')
            .to('.rzdiv',{autoAlpha:1,scaleX:1,duration:0.55,ease:'power2.inOut'},'-=0.25')
            .to('.rzci', {autoAlpha:1,x:0,stagger:0.08,duration:0.45},'-=0.2');
        }
      });

      gsap.utils.toArray('.rzsl').forEach(function(el,i){
        gsap.to(el,{autoAlpha:1,y:0,duration:0.5,ease:'power2.out',
          scrollTrigger:{trigger:el,scroller:scr,start:'top 88%',once:true,refreshPriority:-i}});
      });
      gsap.utils.toArray('.rzsr').forEach(function(el,i){
        gsap.to(el,{autoAlpha:1,scaleX:1,duration:0.85,ease:'power2.inOut',
          scrollTrigger:{trigger:el,scroller:scr,start:'top 92%',once:true,refreshPriority:-i}});
      });
      gsap.utils.toArray('.rzrt').forEach(function(el,i){
        gsap.to(el,{autoAlpha:1,y:0,duration:0.7,ease:'power2.out',
          scrollTrigger:{trigger:el,scroller:scr,start:'top 88%',once:true,refreshPriority:-i}});
      });
      gsap.utils.toArray('.rzmr').forEach(function(el,i){
        gsap.to(el,{autoAlpha:1,y:0,duration:0.55,
          scrollTrigger:{trigger:el,scroller:scr,start:'top 90%',once:true,refreshPriority:-i}});
      });
      ScrollTrigger.batch('.rzbul li',{
        scroller:scr, start:'top 90%',
        onEnter: function(b){ gsap.to(b,{autoAlpha:1,y:0,stagger:0.04,duration:0.45,ease:'power2.out',overwrite:true}); }
      });
      gsap.utils.toArray('.rztools').forEach(function(s){
        gsap.to(s.querySelectorAll('.rztc'),{
          autoAlpha:1,y:0,stagger:{each:0.05,from:'start'},duration:0.45,
          scrollTrigger:{trigger:s,scroller:scr,start:'top 88%',once:true}
        });
      });
    }
  );
  ScrollTrigger.refresh();
});

