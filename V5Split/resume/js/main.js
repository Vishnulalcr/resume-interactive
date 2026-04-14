/* ═════════════════════════════════════════════════════════════════════
   CLICKABLE ELEMENTS TAP FEEDBACK — All interactive UI
   ═════════════════════════════════════════════════════════════════════ */
document.addEventListener('click', function(e) {
  var target = e.target;

  // Check if element or its parent is clickable
  var isClickable = target.closest('.cor, .side-label, .crd, a[href], button, [role="button"]') !== null;

  if (isClickable) {
    haptics.light();
  }
}, true);
