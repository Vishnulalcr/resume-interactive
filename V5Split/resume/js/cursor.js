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
