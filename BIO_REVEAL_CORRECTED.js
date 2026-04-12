/**
 * CORRECTED BIO WORD-REVEAL ANIMATION
 *
 * This is the complete, corrected word-reveal section that should replace
 * lines 1931-2073 in index_v7.html
 *
 * Key changes:
 * 1. Use bio-section (not #runway) as trigger
 * 2. GSAP pin: true creates spacer automatically
 * 3. Remove onLeave/onEnterBack opacity tweens
 * 4. Keep updateWords() logic exactly the same
 */

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

// ✓ CHANGED: Get bio-section instead of runway
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
var PX_PER_WORD = 68;
var GHOST       = 9;

// ✓ CHANGED: Calculate total scroll distance instead of setting runway height
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
  var target     = window.innerHeight / 2 - wordTop - lineHeight / 2;
  gsap.set(block, { y: target });
}

/* ─────────────────────────────────────
   WORD STATE UPDATER
   (UNCHANGED — same logic)
───────────────────────────────────── */
var lastHead = -2;

function updateWords(progress) {
  var head = Math.min(Math.floor(progress * total), total - 1);
  if (head === lastHead) return;
  lastHead = head;

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
ScrollTrigger.create({
  trigger: bioSection,              // ✓ CHANGED: trigger on section (not runway)
  start: 'top top',                 // pin when section hits top
  end: '+=' + totalScrollDistance,  // ✓ CHANGED: GSAP creates spacer automatically
  pin: true,                        // ✓ ADDED: GSAP manages pinning + release
  scrub: 0.45,
  onUpdate: function(self) {
    updateWords(self.progress);
  }
  // ✓ REMOVED: onLeave and onEnterBack — GSAP handles automatic release
});

window.addEventListener('resize', function() {
  centerOnWord(lastHead < 0 ? 0 : lastHead);
});

/* ─────────────────────────────────────
   INIT
───────────────────────────────────── */
window.addEventListener('load', function() {
  updateWords(0);
  gsap.from('#stage', { opacity: 0, duration: 1.4, ease: 'power2.out' });
});

})();
