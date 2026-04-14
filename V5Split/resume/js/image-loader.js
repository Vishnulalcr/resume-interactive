/**
 * Manifest-driven bento grid with hero-centred initial pan.
 */
(function () {
  var MANIFEST_URL = 'assets/images/PortfolioImages/manifest.json';
  var FOLDER = 'assets/images/PortfolioImages/';
  var HERO_FILE = '07.png';
  var EXT = /\.(png|jpe?g|webp|gif)$/i;
  var DESKTOP_COL = 272;
  var MOBILE_COL = 124;
  var DESKTOP_GAP = 14;
  var MOBILE_GAP = 10;
  var ROW_UNIT = 8;

  function isHeroName(name) {
    return name === HERO_FILE || /^0*7\.png$/i.test(name);
  }

  function fileToUrl(file) {
    return FOLDER + encodeURIComponent(file);
  }

  function getGridMetrics() {
    var mobile = window.matchMedia('(max-width: 767px)').matches;
    return {
      cols: mobile ? 6 : 8,
      colSize: mobile ? MOBILE_COL : DESKTOP_COL,
      gap: mobile ? MOBILE_GAP : DESKTOP_GAP,
      heroStart: mobile ? 2 : 4
    };
  }

  function getLayoutSpec(w, h, isHero) {
    var ratio = !w || !h ? 1 : w / h;
    var colSpan = 1;
    if (ratio >= 2.2) colSpan = 3;
    else if (ratio >= 1.4) colSpan = 2;

    if (isHero) colSpan = 2;

    return {
      ratio: ratio || 1,
      colSpan: colSpan,
      className: isHero
        ? 'bento-hero'
        : ratio < 0.75
          ? 'bento-tall'
          : ratio < 1.4
            ? 'bento-square'
            : ratio < 2.2
              ? 'bento-wide'
              : 'bento-panorama'
    };
  }

  function getRowSpan(spec, metrics) {
    var widthPx = spec.colSpan * metrics.colSize + (spec.colSpan - 1) * metrics.gap;
    var idealHeight = widthPx / Math.max(0.1, spec.ratio);
    return Math.max(10, Math.round((idealHeight + metrics.gap) / (ROW_UNIT + metrics.gap)));
  }

  function loadNaturalSize(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        resolve({
          ok: true,
          w: img.naturalWidth || 1,
          h: img.naturalHeight || 1
        });
      };
      img.onerror = function () {
        resolve({ ok: false, w: 1, h: 1 });
      };
      img.src = src;
    });
  }

  function applyHeroMetrics(dims) {
    if (!dims || !dims.w || !dims.h) return;
    var ratio = dims.w / dims.h || 1;
    var fly = document.getElementById('worksHeroFly');
    var grid = document.getElementById('bentoGrid');
    if (fly) {
      fly.style.setProperty('--hero-ratio', String(ratio));
    }
    if (grid) {
      grid.style.setProperty('--hero-ratio', String(ratio));
    }
    document.documentElement.style.setProperty('--works-hero-ratio', String(ratio));
    window.__bentoHeroDims = dims;
    window.__bentoHeroAspect = ratio;
  }

  function getMeasureRestoreTargets() {
    return [
      document.getElementById('worksCanvas'),
      document.getElementById('worksMotionLayer'),
      document.getElementById('bentoPanRoot')
    ].filter(Boolean);
  }

  function forceMeasureState() {
    var targets = getMeasureRestoreTargets();

    // Use GSAP to force final state for measurement so GSAP's internal
    // transform cache stays in sync. Direct style.transform overrides break
    // GSAP's cache and cause jumps when it next renders.
    if (window.gsap) {
      var saved = targets.map(function (el) {
        return {
          el: el,
          scale: gsap.getProperty(el, 'scaleX'),
          x: gsap.getProperty(el, 'x'),
          y: gsap.getProperty(el, 'y'),
          opacity: gsap.getProperty(el, 'opacity'),
          visibility: el.style.visibility
        };
      });
      targets.forEach(function (el) {
        gsap.set(el, { scale: 1, x: 0, y: 0, opacity: 1 });
        el.style.visibility = 'hidden';
      });
      return function () {
        saved.forEach(function (s) {
          gsap.set(s.el, { scale: s.scale, x: s.x, y: s.y, opacity: s.opacity });
          s.el.style.visibility = s.visibility;
        });
      };
    }

    // Fallback when GSAP not yet loaded
    var restore = targets.map(function (el) {
      return {
        el: el,
        transform: el.style.transform,
        opacity: el.style.opacity,
        visibility: el.style.visibility
      };
    });
    targets.forEach(function (el) {
      el.style.transform = 'none';
      el.style.opacity = '1';
      el.style.visibility = 'hidden';
    });
    return function () {
      restore.forEach(function (entry) {
        entry.el.style.transform = entry.transform;
        entry.el.style.opacity = entry.opacity;
        entry.el.style.visibility = entry.visibility;
      });
    };
  }

  function centerGridOnHero() {
    var root = document.getElementById('bentoPanRoot');
    var grid = document.getElementById('bentoGrid');
    if (!root || !grid) return;

    var heroCell = grid.querySelector('.bento-hero');
    if (!heroCell) return;

    var restore = forceMeasureState();
    var prevTransform = grid.style.transform;
    grid.style.transform = 'translate(0px, 0px)';

    var rr = root.getBoundingClientRect();
    var hr = heroCell.getBoundingClientRect();
    var heroCx = hr.left - rr.left + hr.width / 2;
    var heroCy = hr.top - rr.top + hr.height / 2;
    var ox = rr.width / 2 - heroCx;
    var oy = rr.height / 2 - heroCy;

    window.__bentoBaseX = ox;
    window.__bentoBaseY = oy;
    window.__bentoInitialOffsetX = ox;
    window.__bentoInitialOffsetY = oy;

    var px = window.__bentoPanX || 0;
    var py = window.__bentoPanY || 0;
    grid.style.transform = 'translate(' + (ox + px) + 'px, ' + (oy + py) + 'px)';

    var finalRect = heroCell.getBoundingClientRect();
    window.__bentoHeroCellFinalRect = {
      left: finalRect.left,
      top: finalRect.top,
      width: finalRect.width,
      height: finalRect.height,
      cx: finalRect.left + finalRect.width / 2,
      cy: finalRect.top + finalRect.height / 2
    };

    window.__bentoLayoutMetrics = {
      rootWidth: rr.width,
      rootHeight: rr.height,
      gridWidth: grid.offsetWidth,
      gridHeight: grid.offsetHeight,
      baseX: ox,
      baseY: oy
    };

    restore();
    if (!prevTransform) return;
  }

  function centerRaf2() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        centerGridOnHero();
      });
    });
  }

  window.centerBentoGridOnHero = centerGridOnHero;
  window.centerBentoGridOnHeroRaf2 = centerRaf2;

  async function loadManifestFiles() {
    try {
      var res = await fetch(MANIFEST_URL, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('manifest ' + res.status);
      var data = await res.json();
      return (data.files || [])
        .map(function (entry) {
          return entry && typeof entry.file === 'string' ? entry.file.trim() : '';
        })
        .filter(function (file) {
          if (!file) return false;
          if (file.indexOf('/') >= 0 || file.indexOf('\\') >= 0) return false;
          return EXT.test(file);
        });
    } catch (err) {
      console.warn('[works manifest]', err);
      return [HERO_FILE];
    }
  }

  function buildOrderedList(files) {
    var hero = null;
    var rest = [];
    files.forEach(function (file) {
      if (isHeroName(file)) hero = file;
      else rest.push(file);
    });

    rest.sort(function (a, b) {
      return a.localeCompare(b, undefined, { sensitivity: 'base' });
    });

    var mid = Math.floor(rest.length / 2);
    var ordered = hero
      ? rest.slice(0, mid).concat([hero], rest.slice(mid))
      : (rest.length ? rest : [HERO_FILE]);

    return {
      ordered: ordered,
      heroFile: hero || HERO_FILE,
      heroIndex: hero ? mid : 0
    };
  }

  async function build() {
    var grid = document.getElementById('bentoGrid');
    if (!grid) return;

    var files = await loadManifestFiles();
    var orderedInfo = buildOrderedList(files);
    var ordered = orderedInfo.ordered;
    var urls = ordered.map(fileToUrl);
    var dimsList = await Promise.all(urls.map(loadNaturalSize));
    var heroDims = dimsList[orderedInfo.heroIndex] || { w: 1, h: 1 };
    var metrics = getGridMetrics();
    var frag = document.createDocumentFragment();

    window.__bentoImageUrls = urls;
    applyHeroMetrics(heroDims);
    grid.innerHTML = '';

    for (var i = 0; i < ordered.length; i++) {
      var file = ordered[i];
      var src = urls[i];
      var dims = dimsList[i] || { w: 1, h: 1 };
      var isHero = i === orderedInfo.heroIndex;
      var spec = getLayoutSpec(dims.w, dims.h, isHero);
      var rowSpan = getRowSpan(spec, metrics);

      var cell = document.createElement('div');
      cell.className = 'bento-cell ' + spec.className;
      cell.setAttribute('data-index', String(i));
      cell.setAttribute('data-file', file);
      cell.setAttribute('role', 'button');
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('aria-label', 'Portfolio ' + (i + 1));
      cell.style.gridColumn = 'span ' + spec.colSpan;
      cell.style.gridRow = 'span ' + rowSpan;
      cell.style.aspectRatio = String(spec.ratio);

      if (isHero) {
        cell.style.gridColumnStart = String(metrics.heroStart);
        cell.style.setProperty('--hero-ratio', String(spec.ratio));
      }

      var img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.decoding = 'async';
      img.draggable = false;

      cell.appendChild(img);
      frag.appendChild(cell);
    }

    grid.appendChild(frag);

    var fly = document.getElementById('worksHeroFly');
    var flyImg = fly && fly.querySelector('img');
    if (flyImg) {
      flyImg.src = urls[orderedInfo.heroIndex];
    }

    centerRaf2();
    window.dispatchEvent(
      new CustomEvent('works:bentoready', {
        detail: {
          count: urls.length,
          heroIndex: orderedInfo.heroIndex
        }
      })
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

  window.addEventListener('resize', function () {
    centerRaf2();
  });
})();
