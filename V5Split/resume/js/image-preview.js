/**
 * Full-viewport image preview for bento cells — keyboard, swipe, drag.
 */
(function () {
  var overlay;
  var imgEl;
  var urls = [];
  var index = 0;
  var open = false;
  var touchStartX = 0;
  var dragStartX = 0;
  var dragging = false;

  function lenisStop() {
    var L = window.lenis;
    if (L && typeof L.stop === 'function') L.stop();
  }

  function lenisStart() {
    var L = window.lenis;
    if (L && typeof L.start === 'function') L.start();
  }

  function showAt(i) {
    if (!urls.length || !imgEl) return;
    index = (i + urls.length) % urls.length;
    imgEl.src = urls[index];
  }

  function openPreview(i) {
    urls = window.__bentoImageUrls || [];
    if (!urls.length || !overlay) return;
    open = true;
    overlay.hidden = false;
    requestAnimationFrame(function () {
      overlay.classList.add('is-open');
    });
    showAt(i);
    lenisStop();
    document.documentElement.style.overflow = 'hidden';
  }

  function closePreview() {
    if (!overlay) return;
    open = false;
    overlay.classList.remove('is-open');
    lenisStart();
    document.documentElement.style.overflow = '';
    window.setTimeout(function () {
      if (!open) overlay.hidden = true;
    }, 320);
  }

  function next() {
    showAt(index + 1);
  }

  function prev() {
    showAt(index - 1);
  }

  function onKey(e) {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closePreview();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  }

  function init() {
    overlay = document.getElementById('preview-overlay');
    if (!overlay) return;
    imgEl = overlay.querySelector('.pv-img');
    var hit = overlay.querySelector('.pv-hit');
    var btnPrev = overlay.querySelector('.pv-prev');
    var btnNext = overlay.querySelector('.pv-next');
    var btnClose = overlay.querySelector('.pv-close');

    document.getElementById('bentoGrid') &&
      document.getElementById('bentoGrid').addEventListener('click', function (e) {
        var cell = e.target.closest('.bento-cell');
        if (!cell) return;
        var idx = parseInt(cell.getAttribute('data-index'), 10);
        if (!isNaN(idx)) openPreview(idx);
      });

    document.getElementById('bentoGrid') &&
      document.getElementById('bentoGrid').addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var cell = e.target.closest('.bento-cell');
        if (!cell) return;
        e.preventDefault();
        var idx = parseInt(cell.getAttribute('data-index'), 10);
        if (!isNaN(idx)) openPreview(idx);
      });

    if (hit)
      hit.addEventListener('click', function (e) {
        if (e.target === hit) closePreview();
      });
    if (btnClose)
      btnClose.addEventListener('click', function () {
        closePreview();
      });
    if (btnPrev)
      btnPrev.addEventListener('click', function (e) {
        e.stopPropagation();
        prev();
      });
    if (btnNext)
      btnNext.addEventListener('click', function (e) {
        e.stopPropagation();
        next();
      });

    overlay.addEventListener('touchstart', function (e) {
      if (!open || !e.touches[0]) return;
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    overlay.addEventListener('touchend', function (e) {
      if (!open || !e.changedTouches[0]) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) next();
        else prev();
      }
    }, { passive: true });

    if (imgEl) {
      imgEl.addEventListener('pointerdown', function (e) {
        if (!open) return;
        dragging = true;
        dragStartX = e.clientX;
        imgEl.setPointerCapture(e.pointerId);
      });
      imgEl.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var dx = e.clientX - dragStartX;
        if (Math.abs(dx) > 80) {
          dragging = false;
          if (dx < 0) next();
          else prev();
          dragStartX = e.clientX;
        }
      });
      imgEl.addEventListener('pointerup', function () {
        dragging = false;
      });
      imgEl.addEventListener('pointercancel', function () {
        dragging = false;
      });
    }

    document.addEventListener('keydown', onKey);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
