# Bio Section Refactoring: Step-by-Step Implementation

## Visual Comparison

### CURRENT FLOW (Broken)
```
┌─────────────────────────────────────────────────────────┐
│                      VIEWPORT                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  #stage (position: fixed, z-index: 10)          │   │
│  │  - Always covers entire viewport                │   │
│  │  - Managed separately from scroll distance      │   │
│  │  ────────────────────────────────────────────   │   │
│  │  #text-block (animated by updateWords)          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

Document Flow (independent):
┌──────────────────────────────────────────┐
│  <div id="runway" style="height: 5000px">  ← SEPARATE
│  </div>                                  │
│                                          │
│  <div id="stats">                        │   ✗ COVERED
│    Stats content...                      │   ✗ HIDDEN
│  </div>                                  │
└──────────────────────────────────────────┘

PROBLEM: Two independent systems
- #stage doesn't know when #runway ends
- Stats section gets overlapped
- Manual opacity management required
```

### CORRECT FLOW (Fixed)
```
Document Flow (coordinated):
┌───────────────────────────────────────────────────────┐
│  <section id="bio-section" style="height: 100vh">    │
│    ┌─────────────────────────────────────────────┐   │
│    │ #stage (position: absolute, inset: 0)      │   │
│    │                                             │   │
│    │ #text-block (animated by updateWords)      │   │
│    └─────────────────────────────────────────────┘   │
│  </section>                                          │
│                                                      │
│  [GSAP auto-creates spacer]                         │
│  [User scrolls through spacer]                      │
│                                                      │
│  <section id="stats">                               │
│    Stats content...  ← Natural flow, no overlay     │
│  </section>                                          │
└───────────────────────────────────────────────────────┘

BENEFIT: One ScrollTrigger owns it all
- GSAP manages pin, spacer, release
- Stats section appears naturally
- Automatic opacity management
```

---

## File: index_v7.html

### CHANGE 1: HTML Structure (around line 258)

#### BEFORE:
```html
<div id="stage">
  <div id="text-block">
    <!-- words injected here -->
  </div>
</div>

<div id="runway"></div>
```

#### AFTER:
```html
<section id="bio-section">
  <div id="stage">
    <div id="text-block">
      <!-- words injected here -->
    </div>
  </div>
</section>

<!-- #runway is DELETED — GSAP creates it automatically -->
```

---

### CHANGE 2: CSS (around lines 117-149)

#### BEFORE:
```css
/* runway: purely scroll distance */
#runway { /* height set by JS */ }

/* fixed stage */
#stage {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 10;
}
```

#### AFTER:
```css
/* BIO SECTION — pinned during scroll */
#bio-section {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;        /* clip #stage while section is pinned */
  z-index: 3;              /* above landing, below overlay things */
}

/* stage: absolute, fills pinned section */
#stage {
  position: absolute;      /* NOT fixed */
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;              /* only needs to sit above text-block */
}
```

---

### CHANGE 3: JavaScript (around lines 1945-2073)

#### BEFORE:
```javascript
var block  = document.getElementById('text-block');
var runway = document.getElementById('runway');  // ← Delete this line

var words = [];
// ... word building code ...

var total       = words.length;
var PX_PER_WORD = 68;
var GHOST       = 9;

runway.style.height = (window.innerHeight + total * PX_PER_WORD) + 'px';  // ← Delete

/* CENTERING */
function getWordTop(index) { /* unchanged */ }
function centerOnWord(index) { /* unchanged */ }

/* WORD STATE UPDATER */
var lastHead = -2;
function updateWords(progress) { /* unchanged */ }

/* SCROLL TRIGGER */
ScrollTrigger.create({
  trigger: runway,        // ← WRONG
  start: 'top top',
  end: 'bottom bottom',   // ← WRONG
  scrub: 0.45,
  onUpdate: function(self) {
    updateWords(self.progress);
  },
  onLeave: function() {
    gsap.to('#stage', { opacity: 0, duration: 0.4, ease: 'power2.out', overwrite: true });
  },
  onEnterBack: function() {
    gsap.to('#stage', { opacity: 1, duration: 0.3, overwrite: true });
  }
});
```

#### AFTER:
```javascript
var block  = document.getElementById('text-block');
var bioSection = document.getElementById('bio-section');  // ← NEW

var words = [];
// ... word building code (UNCHANGED) ...

var total       = words.length;
var PX_PER_WORD = 68;
var GHOST       = 9;

// Calculate total scroll distance GSAP will use
var totalScrollDistance = total * PX_PER_WORD;

/* CENTERING */
function getWordTop(index) { /* unchanged */ }
function centerOnWord(index) { /* unchanged */ }

/* WORD STATE UPDATER */
var lastHead = -2;
function updateWords(progress) { /* unchanged */ }

/* SCROLL TRIGGER — GSAP PIN PATTERN */
ScrollTrigger.create({
  trigger: bioSection,                    // ← Trigger on section, not spacer
  start: 'top top',                       // ← Pin when section hits top
  end: '+=' + totalScrollDistance,        // ← Release after scroll distance
  pin: true,                              // ← GSAP creates spacer automatically
  scrub: 0.45,
  onUpdate: function(self) {
    updateWords(self.progress);           // ← Same animation logic
  }
  // onLeave/onEnterBack DELETED — GSAP handles release automatically
});
```

#### Key Changes:
1. **Remove** `var runway = document.getElementById('runway');`
2. **Add** `var bioSection = document.getElementById('bio-section');`
3. **Remove** `runway.style.height = ...` — GSAP handles this
4. **Change trigger** from `runway` to `bioSection`
5. **Change end** from `'bottom bottom'` to `'+=' + totalScrollDistance`
6. **Add** `pin: true`
7. **Delete** `onLeave` and `onEnterBack` — automatic release

---

### CHANGE 4: Stats Section Trigger (around line 735-755)

#### BEFORE:
```javascript
gsap.from('#stats', {
  opacity: 0,
  y: 40,
  scrollTrigger: {
    trigger: '#runway',    // ← triggers on the OLD spacer
    start: 'top 50%',
    once: true
  }
})
```

#### AFTER:
```javascript
gsap.from('#stats', {
  opacity: 0,
  y: 40,
  scrollTrigger: {
    trigger: '#stats',     // ← triggers on itself when it enters viewport
    start: 'top 80%',      // ← when #stats is 80% visible
    once: true
  }
})
```

**Why this change:**
- Old: triggered based on #runway's position (indirect, coupled)
- New: triggers when #stats actually enters the viewport (direct, decoupled)
- Once #bio-section pin releases, #stats flows naturally and enters viewport
- Animation fires at the right moment automatically

---

## Testing Checklist

After making these changes, test:

- [ ] Scroll slowly through bio section — text reveals word by word ✓
- [ ] Text centering stays smooth during scroll ✓
- [ ] No flash or jumps at section transitions ✓
- [ ] At bio section end, text block stops animating ✓
- [ ] Stats section appears (not overlapped) ✓
- [ ] Stats section opacity animation fires at right time ✓
- [ ] Rest of page content is visible and interactive ✓
- [ ] Window resize works — text centering adjusts ✓
- [ ] Mobile/tablet view works ✓
- [ ] Scroll back up — animation reverses correctly ✓
- [ ] Open DevTools → no console errors ✓

---

## Scroll Distance Math

```javascript
// Your bio has these paragraphs:
// 1. "I'm Vishnulal..." (23 words)
// 2. "I've spent 12 years..." (43 words)
// 3. "Most of my career..." (65 words)
// 4. "Different mediums..." (13 words)
// 5. "These days I'm..." (37 words)
// 6. "Looking for..." (22 words)

total = 203 words
PX_PER_WORD = 68
totalScrollDistance = 203 × 68 = 13,804px ≈ 13.8vh of scroll

User sees: 100vh of pinned bio section
User scrolls through: 13.8vh of additional scroll distance
Total: ~14.8 "pages" of bio reading
```

---

## Optional Enhancements (After Testing)

### 1. More Refined Reveals
```javascript
// Instead of opacity fades, try stagger:
gsap.from('.stats-item', {
  opacity: 0,
  y: 20,
  stagger: 0.1,
  duration: 0.6,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '#stats',
    start: 'top 80%',
    once: true
  }
});
```

### 2. Parallax After Pin Release
```javascript
// Once #stats is visible, parallax it:
gsap.from('#stats', {
  y: 100,
  opacity: 0,
  scrollTrigger: {
    trigger: '#stats',
    start: 'top 100%',
    end: 'top 50%',
    scrub: 1,
    markers: false  // set to true for debugging
  }
});
```

### 3. Progress Indicator
```javascript
// Show user progress through bio reveal:
var bioTrigger = ScrollTrigger.getById('bio-section-trigger');
var progress = Math.round(bioTrigger.progress * 100);
document.getElementById('progress').textContent = progress + '%';
```

---

## Common Mistakes to Avoid

❌ **Don't** keep #runway in the HTML  
✓ **Do** let GSAP create the spacer via `end: '+=###'`

❌ **Don't** use `pin: '#stage'` (pins the wrong element)  
✓ **Do** use `pin: true` on the ScrollTrigger (pins the trigger element)

❌ **Don't** manually set `#stage { position: fixed }`  
✓ **Do** let GSAP apply fixed positioning internally, use `position: absolute` in CSS

❌ **Don't** trigger stats based on #runway  
✓ **Do** trigger stats based on #stats itself entering the viewport

❌ **Don't** keep the onLeave/onEnterBack opacity tweens  
✓ **Do** remove them — the pin system handles entry/exit automatically

---

## If You Get Stuck

### Debug Steps:
1. Open DevTools → Console, check for JS errors
2. Add `console.log('Bio progress:', self.progress)` in onUpdate
3. Set `markers: true` in ScrollTrigger to see trigger boundaries
4. Check that `#bio-section` has `height: 100vh` in DevTools
5. Verify `#stage` is `position: absolute` (not fixed)

### Fresh Start:
If CSS gets tangled, reset just the bio section styles:
```css
#bio-section {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  z-index: 3;
}

#stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

#stage::before,
#stage::after {
  /* keep these unchanged */
}
```

