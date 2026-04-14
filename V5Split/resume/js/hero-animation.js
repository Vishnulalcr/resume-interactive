/**
 * Works canvas timeline:
 * 0-20% hero entry, 20-35% hero settles, 35-75% interactive pause,
 * 75-100% canvas exit, then cards in extra post-exit scroll.
 */
(function () {
  var driver = document.getElementById('wcScrollDriver');
  var sticky = document.getElementById('wcStickyFrame');
  if (!driver || !sticky || typeof ScrollTrigger === 'undefined') return;

  var worksCanvas = document.getElementById('worksCanvas');
  var motionLayer = document.getElementById('worksMotionLayer');
  var panRoot = document.getElementById('bentoPanRoot');
  var heroFly = document.getElementById('worksHeroFly');
  var cardsStage = document.getElementById('cards-stage');
  var worksContinue = document.getElementById('worksContinue');

  var WORKS_VH = 600;
  var CARDS_VH = 520;
  var P1_END = 0.2;
  var P2_END = 0.35;
  var EXPLORE_END = 0.75;
  var st;
  var interactiveActive = false;
  var interactiveComplete = false;
  var touchStartY = 0;

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smooth(t) {
    var p = clamp01(t);
    return p * p * (3 - 2 * p);
  }

  function worksPx() {
    return (window.innerHeight || 600) * WORKS_VH;
  }

  function cardsPx() {
    return (window.innerHeight || 600) * CARDS_VH;
  }

  function totalPx() {
    return worksPx() + cardsPx();
  }

  function layoutDriver() {
    driver.style.minHeight = WORKS_VH + CARDS_VH + 'vh';
  }

  function setPanEnabled(on) {
    if (!worksCanvas) return;
    worksCanvas.classList.toggle('is-pannable', on);
    worksCanvas.classList.toggle('is-interactive', on);
    window.dispatchEvent(new CustomEvent(on ? 'works:pan-enabled' : 'works:pan-disabled'));
  }

  function stopLenis() {
    var lenis = window.lenis;
    if (lenis && typeof lenis.stop === 'function') lenis.stop();
  }

  function startLenis() {
    var lenis = window.lenis;
    if (lenis && typeof lenis.start === 'function') lenis.start();
  }

  function jumpTo(scrollY) {
    var y = Math.max(0, Math.round(scrollY));
    if (window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(y, { immediate: true, force: true });
    } else {
      window.scrollTo(0, y);
    }
    ScrollTrigger.update();
  }

  function getHeroTarget() {
    var rect = window.__bentoHeroCellFinalRect;
    if (!rect || !heroFly) {
      return { dx: 0, dy: 0, scale: 0.82 };
    }
    var baseWidth = heroFly.offsetWidth || rect.width || 1;
    var baseHeight = heroFly.offsetHeight || rect.height || 1;
    return {
      dx: rect.cx - window.innerWidth / 2,
      dy: rect.cy - window.innerHeight / 2,
      scale: Math.min(rect.width / baseWidth, rect.height / baseHeight) || 0.82
    };
  }

  function syncChrome(p1) {
    var t = smooth(p1);
    // top labels slide UP and fade out as works canvas appears
    gsap.set('.c-tl, .c-tr', { y: lerp(0, -80, t), opacity: lerp(1, 0, t) });
    // bottom labels slide DOWN and fade out
    gsap.set('.c-bl, .c-br', { y: lerp(0, 80, t), opacity: lerp(1, 0, t) });
    // side labels slide sideways and fade out
    gsap.set('.side-label-left', { x: lerp(0, -80, t), opacity: lerp(1, 0, t) });
    gsap.set('.side-label-right', { x: lerp(0, 80, t), opacity: lerp(1, 0, t) });
  }

  function renderWorksPhase(worksProgress) {
    var p = clamp01(worksProgress);
    var p1 = smooth(p / P1_END);
    var p2 = smooth((p - P1_END) / (P2_END - P1_END));
    var pExit = smooth((p - EXPLORE_END) / (1 - EXPLORE_END));
    var heroTarget = getHeroTarget();
    var heroCell = document.querySelector('.bento-hero');

    syncChrome(Math.min(1, p / P1_END));

    if (worksCanvas) {
      gsap.set(worksCanvas, {
        opacity: p < 1 ? lerp(0, 1, p1) * (1 - pExit) : 0,
        scale: lerp(0.7, 1, p1),
        y: lerp(0, -(window.innerHeight || 600) * 0.9, pExit),
        transformOrigin: '50% 50%'
      });
    }

    if (motionLayer) {
      // motionLayer only handles entry appearance — exit is handled entirely by worksCanvas parent
      gsap.set(motionLayer, {
        opacity: lerp(0.25, 1, p1),
        scale: lerp(0.96, 1, p1),
        y: 0
      });
    }

    if (panRoot) {
      gsap.set(panRoot, {
        opacity: p < P1_END ? 0 : lerp(0, 1, p2)
      });
    }

    if (heroFly) {
      var entryY = lerp((window.innerHeight || 600) * 1.1, 0, p1);
      var settleX = heroTarget.dx * p2;
      var settleY = heroTarget.dy * p2;
      var settleScale = lerp(1, heroTarget.scale, p2);
      // fade IN during entry (p1 goes 0→1), then fade OUT as it settles into grid (p2 goes 0→1)
      var heroOpacity = p < P1_END ? p1 : lerp(1, 0, p2);
      gsap.set(heroFly, {
        xPercent: -50,
        yPercent: -50,
        x: settleX,
        y: entryY + settleY,
        scale: settleScale,
        opacity: heroOpacity * (1 - pExit),
        transformOrigin: '50% 50%'
      });
    }

    if (heroCell) {
      heroCell.style.opacity = String(p < P1_END ? 0 : p2);
    }
  }

  function renderCards(cardProgress) {
    var fn = window.applyCardStackAtPx;
    var ids = window.cardIds || ['c1', 'c2', 'c3', 'c4'];
    var seg = window.segVh || window.innerHeight || 600;
    if (typeof fn !== 'function') return;

    var cardsScroll = seg * ids.length;
    fn(clamp01(cardProgress) * cardsScroll, clamp01(cardProgress));

    if (cardsStage) {
      cardsStage.classList.toggle('cards-interactive', cardProgress > 0.02);
    }
  }

  function enterInteractive() {
    if (interactiveActive || interactiveComplete) return;
    interactiveActive = true;
    stopLenis();
    setPanEnabled(true);
  }

  function exitInteractive() {
    if (!interactiveActive || !st) return;
    interactiveActive = false;
    interactiveComplete = true;
    setPanEnabled(false);
    jumpTo(st.start + worksPx() * EXPLORE_END + 2);
    startLenis();
  }

  function maybeResetInteractive(worksProgress) {
    if (worksProgress < P2_END - 0.04) {
      interactiveActive = false;
      interactiveComplete = false;
      setPanEnabled(false);
    }
  }

  function update(self) {
    var scrollPx = self.progress * totalPx();
    var worksProgress = clamp01(scrollPx / worksPx());

    maybeResetInteractive(worksProgress);

    if (!interactiveComplete && worksProgress >= P2_END) {
      enterInteractive();
    }

    if (interactiveActive) {
      renderWorksPhase(P2_END);
      renderCards(0);
      return;
    }

    if (worksProgress < 1) {
      renderWorksPhase(worksProgress);
      renderCards(0);
      return;
    }

    renderWorksPhase(1);
    renderCards((scrollPx - worksPx()) / cardsPx());
  }

  function createScrollTrigger() {
    if (st) st.kill();
    layoutDriver();

    st = ScrollTrigger.create({
      trigger: driver,
      start: 'top bottom',
      end: function () {
        return '+=' + totalPx();
      },
      pin: sticky,
      pinSpacing: true,
      scrub: 0.45,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: update,
      onLeave: function () {
        gsap.set('.cor', { opacity: 0, y: -22 });
        gsap.set('.side-label', { opacity: 0, y: -22 });
        setPanEnabled(false);
        interactiveActive = false;
      }
    });
  }

  function bindExitControls() {
    if (worksContinue) {
      worksContinue.addEventListener('click', function () {
        exitInteractive();
      });
    }

    if (worksCanvas) {
      worksCanvas.addEventListener(
        'wheel',
        function (e) {
          if (!interactiveActive) return;
          e.preventDefault();
          if ((window.__bentoUserPanned || window.__bentoPanGestureCount > 0) && e.deltaY > 10) {
            exitInteractive();
          }
        },
        { passive: false }
      );

      worksCanvas.addEventListener(
        'touchstart',
        function (e) {
          if (!interactiveActive || !e.touches[0]) return;
          touchStartY = e.touches[0].clientY;
        },
        { passive: true }
      );

      worksCanvas.addEventListener(
        'touchend',
        function (e) {
          if (!interactiveActive || !e.changedTouches[0]) return;
          var dy = touchStartY - e.changedTouches[0].clientY;
          if ((window.__bentoUserPanned || window.__bentoPanGestureCount > 0) && dy > 36) {
            exitInteractive();
          }
        },
        { passive: true }
      );
    }
  }

  function onBentoReady() {
    // Wait two full paint frames so centerGridOnHero measurements complete
    // before ScrollTrigger.refresh() recalculates positions.
    // This fixes the race where __bentoHeroCellFinalRect is null when settling runs.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (typeof window.centerBentoGridOnHero === 'function') {
          window.centerBentoGridOnHero();
        }
        layoutDriver();
        ScrollTrigger.refresh();
        // Re-render frame 0 so heroFly starts at correct off-screen position
        // with freshly measured target rect now available
        renderWorksPhase(0);
        renderCards(0);
      });
    });
  }

  bindExitControls();
  layoutDriver();
  createScrollTrigger();
  renderWorksPhase(0);
  renderCards(0);
  window.addEventListener('works:bentoready', onBentoReady);
  window.addEventListener('resize', function () {
    layoutDriver();
    ScrollTrigger.refresh();
  });

  setTimeout(function () {
    if (window.__bentoImageUrls && window.__bentoImageUrls.length) onBentoReady();
  }, 0);
})();
