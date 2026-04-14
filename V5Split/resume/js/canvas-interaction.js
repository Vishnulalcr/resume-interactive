/**
 * Pan the bento grid inside #bentoPanRoot.
 */
(function () {
  var root;
  var grid;
  var canvas;
  var dragging = false;
  var sx = 0;
  var sy = 0;
  var startPanX = 0;
  var startPanY = 0;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function getBounds() {
    if (!root || !grid) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    var rr = root.getBoundingClientRect();
    var baseX = window.__bentoBaseX || 0;
    var baseY = window.__bentoBaseY || 0;
    var margin = 56;

    return {
      minX: rr.width - grid.offsetWidth - margin - baseX,
      maxX: margin - baseX,
      minY: rr.height - grid.offsetHeight - margin - baseY,
      maxY: margin - baseY
    };
  }

  function applyTransform() {
    if (!grid) return;
    var bx = window.__bentoBaseX || 0;
    var by = window.__bentoBaseY || 0;
    var px = window.__bentoPanX || 0;
    var py = window.__bentoPanY || 0;
    grid.style.transform = 'translate(' + (bx + px) + 'px,' + (by + py) + 'px)';
  }

  function setPannable(on) {
    if (root) root.classList.toggle('is-pannable', on);
    if (canvas) canvas.classList.toggle('is-pannable', on);
  }

  function setPanning(on) {
    if (root) root.classList.toggle('is-panning', on);
    if (canvas) canvas.classList.toggle('is-panning', on);
  }

  function onDown(clientX, clientY) {
    if (!root || !grid) return;
    if (!canvas || !canvas.classList.contains('is-pannable')) return;
    dragging = true;
    window.__bentoUserPanned = true;
    sx = clientX;
    sy = clientY;
    startPanX = window.__bentoPanX || 0;
    startPanY = window.__bentoPanY || 0;
    setPanning(true);
    window.__bentoPanGestureCount = (window.__bentoPanGestureCount || 0) + 1;
  }

  function onMove(clientX, clientY) {
    if (!dragging) return;
    var bounds = getBounds();
    window.__bentoPanX = clamp(startPanX + (clientX - sx), bounds.minX, bounds.maxX);
    window.__bentoPanY = clamp(startPanY + (clientY - sy), bounds.minY, bounds.maxY);
    applyTransform();

    window.__bentoAtEdge =
      window.__bentoPanX <= bounds.minX + 2 ||
      window.__bentoPanX >= bounds.maxX - 2 ||
      window.__bentoPanY <= bounds.minY + 2 ||
      window.__bentoPanY >= bounds.maxY - 2;
  }

  function onUp() {
    if (!dragging) return;
    dragging = false;
    setPanning(false);
  }

  var bound = false;

  function bind() {
    if (bound) return;
    root = document.getElementById('bentoPanRoot');
    grid = document.getElementById('bentoGrid');
    canvas = document.getElementById('worksCanvas');
    if (!root || !grid) return;
    bound = true;

    root.addEventListener(
      'pointerdown',
      function (e) {
        if (e.button !== 0) return;
        var t = e.target;
        if (t && t.closest && t.closest('.bento-cell')) return;
        onDown(e.clientX, e.clientY);
        if (dragging) root.setPointerCapture(e.pointerId);
      },
      { passive: true }
    );

    root.addEventListener('pointermove', function (e) {
      onMove(e.clientX, e.clientY);
    });

    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);

    window.addEventListener('works:pan-enabled', function () {
      setPannable(true);
    });
    window.addEventListener('works:pan-disabled', function () {
      setPannable(false);
      onUp();
    });
  }

  window.addEventListener('works:bentoready', bind, { once: true });

  function tryBind() {
    var g = document.getElementById('bentoGrid');
    if (g && g.querySelector('.bento-cell')) bind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryBind);
  } else {
    tryBind();
  }

  setTimeout(tryBind, 0);
})();
