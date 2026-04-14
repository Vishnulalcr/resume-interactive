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

/* ═════════════════════════════════════════════════════════════════════
   EMAIL REQUEST MODAL — Portfolio/Blog Access
   ═════════════════════════════════════════════════════════════════════ */
var emailModal = document.getElementById('email-modal');
var emailInput = document.getElementById('email-input');
var emailSubmit = document.getElementById('email-submit');
var emailStatusDiv = document.getElementById('email-status');

// Find Portfolio and Blog elements to intercept clicks
var portfolioLabel = document.querySelector('.cor.c-br');  // PORTFOLIO corner label
var blogLink = document.querySelector('a[href="/blog"]');   // BLOG side label

function openEmailModal() {
  haptics.light();
  emailModal.classList.add('visible');
  emailInput.focus();
}

function closeEmailModal() {
  emailModal.classList.remove('visible');
  emailInput.value = '';
  emailStatusDiv.className = 'email-modal-status';
  emailStatusDiv.textContent = '';
}

function showStatus(message, type) {
  emailStatusDiv.textContent = message;
  emailStatusDiv.className = 'email-modal-status ' + type;
}

// Portfolio click - prevent default navigation and show modal
if (portfolioLabel) {
  portfolioLabel.addEventListener('click', function(e) {
    e.preventDefault();
    openEmailModal();
  });
}

// Blog click - prevent default navigation and show modal
if (blogLink) {
  blogLink.addEventListener('click', function(e) {
    e.preventDefault();
    openEmailModal();
  });
}

// Email submit handler
if (emailSubmit) {
  emailSubmit.addEventListener('click', function() {
    var email = emailInput.value.trim();

    // Validate email
    if (!email || !email.includes('@')) {
      showStatus('Please enter a valid email', 'error');
      haptics.error();
      return;
    }

    // Disable submit button during request
    emailSubmit.disabled = true;
    emailSubmit.style.opacity = '0.6';
    showStatus('Sending...', '');

    // Send request to backend
    fetch('/api/request-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email })
    })
    .then(function(response) {
      if (!response.ok) throw new Error('Network error');
      return response.json();
    })
    .then(function(data) {
      if (data.success) {
        haptics.success();  // Double-pulse confirm
        showStatus('✓ Request sent! Check your email', 'success');
        emailInput.value = '';

        // Close modal after 2.5 seconds
        setTimeout(function() {
          closeEmailModal();
          emailSubmit.disabled = false;
          emailSubmit.style.opacity = '1';
        }, 2500);
      } else {
        throw new Error(data.message || 'Request failed');
      }
    })
    .catch(function(error) {
      haptics.error();  // Triple-rattle error feedback
      showStatus('Error: ' + (error.message || 'Failed to send request'), 'error');
      emailSubmit.disabled = false;
      emailSubmit.style.opacity = '1';
    });
  });
}

// Close modal on X button
var closeBtn = document.querySelector('.email-modal-close');
if (closeBtn) {
  closeBtn.addEventListener('click', closeEmailModal);
}

// Close modal on backdrop click
var backdrop = document.querySelector('.email-modal-backdrop');
if (backdrop) {
  backdrop.addEventListener('click', closeEmailModal);
}

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && emailModal.classList.contains('visible')) {
    closeEmailModal();
  }
});

// Allow Enter key to submit email
if (emailInput) {
  emailInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      emailSubmit.click();
    }
  });
}

// Resume download haptic
var resumeDownloadLink = document.getElementById('resume-download-link');
if (resumeDownloadLink) {
  resumeDownloadLink.addEventListener('click', function() {
    haptics.medium();
  });
}

})();
