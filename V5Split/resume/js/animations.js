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

/* ═══ BIO WORD-REVEAL (CORRECTED GSAP PIN PATTERN) ═══ */
(function() {
/* ─────────────────────────────────────
   CONTENT
───────────────────────────────────── */
var paragraphs = [
  ["I'm","Vishnulal.","A","designer","who","starts","with","how","something","looks","and","works","backwards","from","there.","Aesthetics","first,","everything","else","gets","figured","out","around","that."],
  ["I've","spent","12","years","at","the","intersection","of","motion,","brand,","and","product.","Which","is","a","polished","way","of","saying","I've","been","in","a","lot","of","rooms","insisting","that","how","something","looks","is","not","the","last","conversation,","it's","the","first","one."],
  ["Most","of","my","career","has","lived","in","the","detailed","middle:","between","a","brand","film","and","a","UI","system,","between","a","3D","render","and","an","interaction","state,","between","what","looks","exactly","right","and","what","actually","ships.","At","scale,","too.","Ola","Electric","—","visual","language","for","India's","EV","era,","built","from","nothing.","MoveOS","—","900,000+","users.","Kruti.AI","—","one","shot","to","introduce","an","AI","to","the","world."],
  ["Different","mediums.","Same","underlying","question:","does","this","look","exactly","right?"],
  ["These","days","I'm","interested","in","work","that","uses","all","of","it.","Motion,","product,","generative","art,","interactive","experience.","Work","where","the","visual","decision","has","real","weight,","and","where","someone","notices","when","you","get","it","wrong."],
  ["Looking","for","the","right","creative","challenge.","One","where","aesthetics","are","taken","seriously","from","day","one.","I","work","best","with","loud","music","and","good","collaborators,","both","are","non-negotiable."]
];

/* ─────────────────────────────────────
   BUILD DOM
───────────────────────────────────── */
var block     = document.getElementById('text-block');
var bioSection = document.getElementById('bio-section');

if (!block || !bioSection) {
  console.error('Bio section elements not found. Check HTML structure.');
  return;
}

var words = [];

paragraphs.forEach(function(para, pi) {
  para.forEach(function(word) {
    var wrapper = document.createElement('span');
    wrapper.className = 'w';

    var bg = document.createElement('span');
    bg.className = 'bg';

    var inner = document.createElement('span');
    inner.className = 'inner';
    inner.textContent = word + '\u00A0';

    wrapper.appendChild(bg);
    wrapper.appendChild(inner);
    block.appendChild(wrapper);
    words.push({ wrapper: wrapper, inner: inner });
  });

  if (pi < paragraphs.length - 1) {
    var gap = document.createElement('span');
    gap.className = 'para-gap';
    block.appendChild(gap);
  }
});

var total       = words.length;
var PX_PER_WORD = 10;
var GHOST       = 9;

var totalScrollDistance = total * PX_PER_WORD;

/* ─────────────────────────────────────
   CENTERING
───────────────────────────────────── */
function getWordTop(index) {
  var el = words[index].inner;
  var top = 0;
  var node = el;
  while (node && node !== block) {
    top += node.offsetTop;
    node = node.offsetParent;
  }
  return top;
}

function centerOnWord(index) {
  var clamp = Math.min(index, total - 1);
  var wordTop    = getWordTop(clamp);
  var lineHeight = words[clamp].inner.offsetHeight;
  var centerY = window.innerHeight * 0.75;  // Position at 3/4 down the screen
  var target = centerY - wordTop - lineHeight / 2;
  gsap.set(block, { y: target });
}

/* ─────────────────────────────────────
   WORD STATE UPDATER
───────────────────────────────────── */
var lastHead = -2;

// Paragraph end indices — heavier accent at structural breaks
var _bioParaEnds = [23, 61, 145, 149, 185, 220];

function updateWords(progress) {
  var head = Math.min(Math.floor(progress * total), total - 1);
  if (head === lastHead) return;

  var movingForward = head > lastHead;
  lastHead = head;

  // ── Android: scroll-driven per-word haptics ───────────────────────────
  // navigator.vibrate() works from any context including scroll events.
  // iOS haptics need a user gesture — handled separately via touchmove below.
  if (movingForward && haptics.isAndroid && haptics._droidOK) {
    if (_bioParaEnds.indexOf(head) !== -1) {
      haptics.medium();   // paragraph boundary — heavier beat
    } else {
      haptics.light();    // per-word tick
    }
  }

  words.forEach(function(item, i) {
    item.wrapper.classList.remove('active');

    if (i < head) {
      item.inner.style.opacity = '1';
      item.inner.style.color   = '';
    } else if (i === head) {
      item.inner.style.opacity = '1';
      item.inner.style.color   = '';
      item.wrapper.classList.add('active');
    } else if (i <= head + GHOST) {
      var dist    = i - head;
      var opacity = 0.14 * (1 - dist / (GHOST + 1));
      item.inner.style.opacity = String(Math.max(0.03, opacity));
      item.inner.style.color   = '';
    } else {
      item.inner.style.opacity = '0';
      item.inner.style.color   = '';
    }
  });

  requestAnimationFrame(function() { centerOnWord(head); });
}

/* ─────────────────────────────────────
   SCROLL TRIGGER — CORRECTED PATTERN
───────────────────────────────────── */
var _bioST = null; // stored so iOS touchmove can read progress

ScrollTrigger.create({
  trigger: bioSection,
  start: 'top top',
  end: '+=' + totalScrollDistance,
  pin: true,
  scrub: 0.2,
  onUpdate: function(self) {
    _bioST = self;
    updateWords(self.progress);
  }
});

/* ─────────────────────────────────────
   iOS BIO HAPTICS — touchmove bridge
   ─────────────────────────────────────
   scroll events are NOT a user gesture on iOS — UIKit haptics are silently
   blocked. touchmove IS a user gesture context and fires while the finger
   is actively moving, so haptics reliably fire from here.
   The progress is read from the stored ScrollTrigger instance (_bioST).
───────────────────────────────────── */
if (haptics.isIOS) {
  var _iosBioLastHead = -2;
  var _iosBioLastFire = 0;

  document.addEventListener('touchmove', function() {
    // Only active while bio section ScrollTrigger is between 0–100%
    if (!_bioST || _bioST.progress <= 0.003 || _bioST.progress >= 0.997) return;

    // Own throttle — 45ms min gap independent of HapticManager
    var now = Date.now();
    if (now - _iosBioLastFire < 45) return;

    var head = Math.min(Math.floor(_bioST.progress * total), total - 1);
    if (head <= _iosBioLastHead) return; // forward only

    _iosBioLastHead = head;
    _iosBioLastFire = now;

    // Call _ios() directly — we're inside touchmove, a confirmed user gesture
    haptics._ios();
  }, { passive: true });
}

window.addEventListener('resize', function() {
  centerOnWord(lastHead < 0 ? 0 : lastHead);
});

/* ─────────────────────────────────────
   INIT
───────────────────────────────────── */
window.addEventListener('load', function() {
  window.scrollTo(0, 0);
  updateWords(0);
  gsap.from('#stage', { opacity: 0, duration: 1.4, ease: 'power2.out' });
});

/* Prevent text selection on sphere canvas touch */
sphereCanvas.style.webkitTouchCallout = 'none';
sphereCanvas.style.webkitUserSelect   = 'none';
sphereCanvas.style.userSelect         = 'none';
})();
