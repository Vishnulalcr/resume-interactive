# Portfolio Improvements Plan

## 1. TEXT REVEAL CENTERING & SPEED

### Current Behavior
```
Scroll 0%     Scroll 50%      Scroll 100%
│             │               │
  [Word 1]      [Word 50]       [Word 203]
  [Word 2]      [Word 51]       (JUMPS TO NEXT SECTION)
  [Word 3]      [Word 52]       ✗ User can't see full paragraph
```
**Problem:** Text stays centered vertically, but when animation ends, scroll jumps abruptly to next section.

### Proposed Solution
```
Scroll 0%     Scroll 50%      Scroll 100%
│             │               │
  [Word 1]      [Word 50]       [Word 195]
  [Word 2]      [Word 51]       [Word 196]
  [Word 3]      [Word 52]       [Word 197]
                               [Word 198]
                               [Word 199] ✓ Full paragraph visible
                               [Word 200]
                               [Word 201]
```

**Implementation:**
1. **Dynamic Center Point**: Instead of always centering at `window.innerHeight / 2`, calculate it based on scroll progress
   - At 0% progress: Center high (let text scroll down from above)
   - At 50% progress: Center middle (optimal viewing)
   - At 100% progress: Center low (text scrolls up, paragraph visible below)
   
   **Formula:**
   ```javascript
   var scrollProgress = 0 to 1
   var centerOffset = Math.easeInCubic(scrollProgress) * 200  // 200px downward
   var target = (window.innerHeight / 2) + centerOffset - wordTop - lineHeight / 2
   ```

2. **Speed**: Already increased scrub to 0.2 (2x faster), but can optimize further
   - Current: `scrub: 0.2` 
   - Consider: `scrub: 0.1` for even snappier feel (or test 0.2 first)

**Code Changes:**
- Modify `centerOnWord(index)` function in bio-section script
- Add progress parameter to track scroll position
- Calculate dynamic center point based on progress

**Visual Result:**
- Text smoothly transitions from upper-center → middle → lower-center
- User always sees context: previous words + current word + upcoming words
- Paragraph is fully readable by end of animation
- No abrupt jump to next section

---

## 2. HERO SVG SCALE ANIMATION

### Current Behavior
- Hero statement appears with opacity fade + Y translation
- No scale animation
- Feels flat

### Proposed Solution

**Add 3D Depth Effect:**
```javascript
// Current (lines 2046-2052 area)
heroStatement.style.opacity = String(stmtProgress);
heroStatement.style.transform = 'translateY(' + (40 * (1 - stmtProgress)) + 'px)';

// New → Add scale + slight rotation
heroStatement.style.opacity = String(stmtProgress);
heroStatement.style.transform = 
  'translateY(' + (40 * (1 - stmtProgress)) + 'px) ' +
  'scale(' + (0.92 + stmtProgress * 0.08) + ') ' +  // Scales from 92% → 100%
  'rotateY(' + (-8 * (1 - stmtProgress)) + 'deg)';  // Subtle 3D tilt
heroStatement.style.transformOrigin = 'center center';
```

**Visual Timeline:**
```
0% progress:  opacity: 0%,   scale: 92%,   rotateY: -8°  (small, tilted away)
20% progress: opacity: 20%,  scale: 94%,   rotateY: -6.4°
50% progress: opacity: 50%,  scale: 96%,   rotateY: -4°
80% progress: opacity: 80%,  scale: 98%,   rotateY: -1.6°
100% progress: opacity: 100%, scale: 100%, rotateY: 0°   (full size, facing forward)
```

**Code Location:**
- File: `index_v7.html`, around line 2046-2052
- Function: Hero ScrollTrigger onUpdate, where hero statement is animated

**Benefits:**
- SVG appears to "grow" and "turn" toward viewer
- Syncs with sphere animation (both are growing/appearing)
- More engaging, premium feel
- Smooth easing through entire animation

---

## 3. SIX FIXED UI LABELS LAYOUT

### Current State
- 4 corner labels positioned absolutely within body
- Dynamic positioning, responsive to viewport

### Proposed New System

**Layout Diagram (Fixed Full-Height Edge Strips):**
```
┌─ VISHNULAL CR ────────────────────────────────── 09:28:43 PM IST ─┐
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │B                                                          L   │ │
│  │L        ┌────────────────────┐                           E   │ │
│  │O        │   HERO SECTION     │                           T   │ │
│  │G        │ (sphere + SVG text)│                           '   │ │
│  │         │                    │                           S   │ │
│  │(full    ├────────────────────┤                           T   │ │
│  │height   │                    │                           A   │ │
│  │fixed    │   BIO SECTION      │                           L   │ │
│  │strip,   │  (word reveal)     │                           K   │ │
│  │40px     │                    │                               │ │
│  │wide,    ├────────────────────┤                               │ │
│  │flex     │                    │                               │ │
│  │centered)│  RESUME SECTION    │                               │ │
│  │         │  (stats + content) │                               │ │
│  │         │                    │                               │ │
│  │         └────────────────────┘                               │ │
│  │                                                               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─ SCROLL ────────────────────────────────────────────────── PORTFOLIO ─┘

LEGEND:
┌─ Corner labels (existing, 4 positions) ─┐
│ Left side strip:  40px wide, full height, flex-centered │
│ Left text reads:  BOTTOM → TOP (with rotate 180°) │
│ Right side strip: 40px wide, full height, flex-centered │
│ Right text reads: TOP → BOTTOM (no rotation) │
└────────────────────────────────────────┘
```

**Visual Breakdown - Side by Side:**
```
LEFT EDGE STRIP                    CONTENT AREA                    RIGHT EDGE STRIP
(40px fixed, left:0)              (main viewport)                  (40px fixed, right:0)

│B│                               ┌──────────────┐                │L│
│L│                               │   HERO AREA  │                │E│
│O│ ◄── Reads                     │              │     Reads ──► │T│
│G│     BOTTOM→TOP                ├──────────────┤     TOP→BOTTOM│ │
│ │     (rotated 180°)            │   BIO AREA   │               │S│
│ │                               │              │               │T│
│ │     Full height               ├──────────────┤               │A│
│ │     Flex centered             │ RESUME AREA  │               │L│
│ │     writing-mode:             │              │               │K│
│ │     vertical-rl               └──────────────┘               │ │
│ │     transform:                                               │ │
│ │     rotate(180deg)            No rotation                    │ │
│ │                               writing-mode:                  │ │
│ │                               vertical-rl                    │ │
│ │                               (natural top→bottom)           │ │
```

**Key Properties:**
- `position: fixed; left: 0; top: 0; bottom: 0; width: 40px` = Full-height strip on left edge
- `position: fixed; right: 0; top: 0; bottom: 0; width: 40px` = Full-height strip on right edge
- `display: flex; align-items: center; justify-content: center` = Text perfectly centered within strip
- `writing-mode: vertical-rl` = Text flows vertically (letters stack)
- **Left side:** `transform: rotate(180deg)` = flips vertical text to read **bottom → top** ↑
- **Right side:** No rotation = `vertical-rl` naturally reads **top → bottom** ↓

**Side Labels - Key Details:**
- **Position:** `left: 24px` (left) / `right: 24px` (right)
- **Vertical Alignment:** `top: 50%` + `transform: translateY(-50%)` = **truly centered on viewport**
- **Always visible:** `position: fixed` (not affected by scrolling)
- **Rotation:** 
  - "BLOG" (left): `rotate(-90deg)` → reads **bottom-to-top**
  - "LET'S TALK" (right): `rotate(90deg)` → reads **top-to-bottom**
- **Text alignment:** Center-aligned within their rotated containers

**Positioning Details:**

### Four Corners (Enhanced):
```css
position: fixed;
font-size: 11px;
letter-spacing: 0.12em;
text-transform: uppercase;
color: rgba(15,15,15,0.68);
z-index: 100;

/* Top-left */
top: 20px;
left: 24px;

/* Top-right */
top: 20px;
right: 24px;

/* Bottom-left */
bottom: 20px;
left: 24px;

/* Bottom-right */
bottom: 20px;
right: 24px;
```

### Two New Side Labels (Vertical, Centered):

**Visual Layout (Letters Rotated Vertically):**
```
Left Edge (24px)              Viewport Center              Right Edge (24px)
     │                              │                              │
     │                              │                              │
     B                          [Content]                      L   │
     L                          [Content]                      E   │
     O   ◄─────────────────    [Content]   ───────────────►   T   │
     G    (reads bottom-up)     [Content]   (reads top-down)  '    │
                                [Content]                      S   │
                                [Content]                      T   │
     │                              │                          A   │
     │                              │                          L   │
     │                              │                          K   │
```

**CSS Positioning (Correct Implementation with Flexbox):**
```css
/* Base styles for both side labels */
.side-label {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 40px;               /* Fixed width strip on edge */
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(15,15,15,0.68);
  z-index: 100;
  white-space: nowrap;
}

/* LEFT SIDE — "BLOG" (reads bottom-to-top) */
.side-label-left {
  left: 0;
  transform: rotate(180deg);  /* Flips vertical-rl to bottom-up reading */
}

/* RIGHT SIDE — "LET'S TALK" (reads top-to-bottom) */
.side-label-right {
  right: 0;
  /* No rotation needed — vertical-rl naturally reads top-to-bottom */
}
```

**How This Works:**
- `position: fixed` with `top: 0; bottom: 0; width: 40px` = Full-height fixed strip on the edge
- `display: flex; align-items: center; justify-content: center` = Text centered within the strip
- `writing-mode: vertical-rl` = Text flows vertically
- **Left side:** `rotate(180deg)` flips the vertical text to read **bottom → top**
- **Right side:** No rotation, `vertical-rl` naturally reads **top → bottom**
- Much cleaner, perfectly centered, and handles all viewport heights!

**HTML Structure:**
```html
<!-- Corner labels (update existing) -->
<span class="cor c-tl" data-scramble>VISHNULAL CR</span>
<span class="cor c-tr" id="cor-clock">09:28:43 PM IST</span>
<span class="cor c-bl" data-scramble>SCROLL</span>
<span class="cor c-br" data-scramble>PORTFOLIO</span>

<!-- NEW: Side labels (full-height fixed strips) -->
<a class="side-label side-label-left" href="/blog" data-scramble>BLOG</a>
<a class="side-label side-label-right" href="/contact" data-scramble>LET'S TALK</a>
```

**CSS Structure:**
```css
/* Base for all fixed labels */
.cor {
  position: fixed;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(15,15,15,0.68);
  cursor: pointer;
  pointer-events: auto;
  z-index: 100;
}

/* Corners */
.c-tl { top: 20px; left: 24px; text-align: left; }
.c-tr { top: 20px; right: 24px; text-align: right; }
.c-bl { bottom: 20px; left: 24px; text-align: left; }
.c-br { bottom: 20px; right: 24px; text-align: right; }

/* Sides — vertically centered on viewport */
.c-side {
  display: inline-block;
  white-space: nowrap;
  top: 50%;
  transform-origin: center center;
}
.c-side-left {
  left: 24px;
  /* Translate to center, then rotate -90° so text reads bottom-to-top */
  transform: translateY(-50%) rotate(-90deg);
}
.c-side-right {
  right: 24px;
  /* Translate to center, then rotate 90° so text reads top-to-bottom */
  transform: translateY(-50%) rotate(90deg);
}

/* Make side labels clickable (anchor styling) */
.c-side {
  text-decoration: none;
  display: block;
}
```

**Dynamic Clock:**
```javascript
// Update clock every second (already exists, keep current logic)
setInterval(function() {
  var now = new Date();
  var hh = String(now.getHours()).padStart(2, '0');
  var mm = String(now.getMinutes()).padStart(2, '0');
  var ss = String(now.getSeconds()).padStart(2, '0');
  var ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  document.getElementById('cor-clock').textContent = hh + ':' + mm + ':' + ss + ' ' + ampm + ' IST';
}, 1000);
```

**Scramble Effect:**
- Side labels already included in `[data-scramble]` selector
- Will inherit scramble behavior (hover + random glitch every 2-3s)
- No additional code needed

**Responsive Considerations:**
```css
/* Mobile adjustments (below 640px) */
@media (max-width: 639px) {
  .c-side {
    display: none;  /* Hide vertical side labels on mobile */
  }
  /* Keep corners visible but adjust padding */
  .cor {
    font-size: 9px;
  }
}
```

---

## Implementation Order

1. **Phase 1 (Quick):** Text reveal centering + speed
   - Modify `centerOnWord()` function
   - Test scroll behavior
   - Files: `index_v7.html` (bio-section script)

2. **Phase 2 (Medium):** Hero SVG scale animation
   - Add scale + rotateY to hero statement transform
   - Adjust timing/easing
   - Files: `index_v7.html` (hero section script)

3. **Phase 3 (Full):** Fixed UI labels system
   - Update HTML (add side labels as anchors)
   - Update CSS (fixed positioning)
   - Ensure scramble effect works on new elements
   - Test responsive behavior
   - Files: `index_v7.html` (HTML + CSS sections)

---

## Visual Impact Summary

| Change | Before | After | Impact |
|--------|--------|-------|--------|
| **Text Reveal** | Centered, abrupt jump | Dynamic centering, smooth flow | Professional, readable, polished |
| **Hero SVG** | Flat fade | Scale + 3D tilt | Premium, engaging, cohesive |
| **UI Labels** | 4 corners | 4 corners + 2 sides | Bold layout, professional, symmetrical |
| **Side Labels** | N/A | Fixed, rotated, interactive | Modern, guidance, encourages exploration |

---

## Questions for Approval

1. **Text Reveal:**
   - Should the center point move down aggressively or subtly? (200px vs 100px)
   - Keep `scrub: 0.2` or go faster to `scrub: 0.1`?

2. **Hero SVG:**
   - Do you like the 3D rotateY effect, or prefer just scale?
   - Scale range good (92% → 100%) or adjust?

3. **UI Labels:**
   - Happy with `BLOG` and `LET'S TALK` text, or different CTA?
   - Like the rotated text on sides, or prefer vertical writing-mode?
   - Should side labels disappear on mobile, or stay visible?
   - Link destinations: `/blog` and `/contact` correct?

---

## Ready to Implement?

Once you approve this plan, I'll execute all three phases in order. Each one should take 5-10 minutes to implement and test.

**Estimated total time:** 20-30 minutes (including testing)

Shall we proceed? 🚀
