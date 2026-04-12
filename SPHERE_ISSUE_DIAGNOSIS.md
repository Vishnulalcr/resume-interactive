# Sphere Interaction Issue - Root Cause & Fix

## Problem Description
After user interacts with sphere (adds badges), the rest of the page assets break:
- Text becomes transparent/invisible
- Cards become transparent/invisible
- Issue persists when scrolling back up and down
- Issue worsens with repeated interactions

## Root Cause Analysis

### Issue #1: Faulty State Check
```javascript
if (dim === isCurrentlyDimmed) return;  // ❌ PROBLEM!
```

**Why it's broken**:
- `isCurrentlyDimmed` starts as `false`
- User taps sphere → `dimNonSphereUI(true)` called → sets `isCurrentlyDimmed = true`
- User taps outside → `dimNonSphereUI(false)` called → BUT `isCurrentlyDimmed` is already `false`?
- Wait... this should work... Let me dig deeper

### Issue #2: GSAP clearProps Timing
```javascript
gsap.to(el, {
  opacity: 1,
  duration: 0.4,
  overwrite: 'auto',
  clearProps: 'opacity'  // Applied AFTER animation completes
});
```

**The problem**:
- `clearProps` only removes inline styles AFTER animation completes
- If another animation starts before 0.4s completes, the inline style is still there
- ScrollTrigger animations might start DURING restoration, creating conflict

### Issue #3: No Force Reset
When exiting interactive mode, if restoration fails:
- `isCurrentlyDimmed` stays `true` or gets stuck
- Subsequent calls return early due to state check
- Elements stay at 0.4 opacity permanently

### Issue #4: Multiple Interactions
```
Tap 1: dimNonSphereUI(true) ✓
Exit 1: dimNonSphereUI(false) ✓
Tap 2: dimNonSphereUI(true) ← might conflict with fading in from Tap 1
Exit 2: dimNonSphereUI(false) ← might conflict with fading out from Tap 2
...
Result: Opacity gets stuck in between states
```

## Solution Strategy

### Fix #1: Force Immediate Opacity Clear
Instead of relying on GSAP `clearProps`, directly remove opacity:

```javascript
function dimNonSphereUI(dim) {
  var stats = document.getElementById('stats');
  var textBlock = document.getElementById('text-block');
  var cardsWrap = document.getElementById('cards-wrap');
  var stageContainer = document.querySelector('#bio-section');

  var elements = [stats, textBlock, cardsWrap, stageContainer];

  elements.forEach(function(el) {
    if (!el) return;
    
    // Kill any existing animations on this element
    gsap.killTweensOf(el);
    
    if (dim) {
      // Immediate dim (no animation to prevent conflicts)
      el.style.opacity = '0.4';
    } else {
      // FORCE restore immediately
      el.style.opacity = '1';
    }
  });
}
```

### Fix #2: Reset State on Exit
Ensure state is properly reset:

```javascript
function exitInteractiveMode() {
  isInteractiveMode = false;
  isCurrentlyDimmed = false;  // FORCE reset state
  
  // ... fade out badge ...
  
  // Force restore opacity immediately
  var textBlock = document.getElementById('text-block');
  var cardsWrap = document.getElementById('cards-wrap');
  var stats = document.getElementById('stats');
  
  if (textBlock) textBlock.style.opacity = '1';
  if (cardsWrap) cardsWrap.style.opacity = '1';
  if (stats) stats.style.opacity = '1';
}
```

### Fix #3: Simpler Approach - Skip Dimming Animation
The dimming animation is causing conflicts. Better approach:

```javascript
function dimNonSphereUI(dim) {
  var elements = [
    document.getElementById('stats'),
    document.getElementById('text-block'),
    document.getElementById('cards-wrap'),
    document.querySelector('#bio-section')
  ];

  elements.forEach(function(el) {
    if (!el) return;
    
    // Kill any existing tweens first
    gsap.killTweensOf(el);
    
    // Set opacity immediately (no animation = no conflicts)
    el.style.opacity = dim ? '0.4' : '1';
  });
}
```

## Recommended Fix

**Use Fix #3 (Simplest & Most Reliable)**

Why?
- No GSAP animation conflicts
- No timing issues
- No state management problems
- Immediate visual feedback
- Works with scrolling
- Survives multiple interactions

## Implementation

Replace the current `dimNonSphereUI()` function with:

```javascript
var isCurrentlyDimmed = false;

function dimNonSphereUI(dim) {
  // Prevent redundant calls
  if (dim === isCurrentlyDimmed) return;
  isCurrentlyDimmed = dim;

  var stats = document.getElementById('stats');
  var textBlock = document.getElementById('text-block');
  var cardsWrap = document.getElementById('cards-wrap');
  var stageContainer = document.querySelector('#bio-section');

  var elements = [stats, textBlock, cardsWrap, stageContainer];

  elements.forEach(function(el) {
    if (!el) return;
    
    // Kill any existing GSAP tweens on this element
    gsap.killTweensOf(el);
    
    // Set opacity immediately (no animation)
    if (dim) {
      el.style.opacity = '0.4';
    } else {
      el.style.opacity = '1';
    }
  });
}
```

And update `exitInteractiveMode()`:

```javascript
function exitInteractiveMode() {
  isInteractiveMode = false;
  isCurrentlyDimmed = false;  // Force reset state

  // Phase 1: Exit feedback (30ms light pulse)
  haptics.light(30);

  // Fade out badge GIF
  var badgeGif = document.getElementById('cursor-sticker');
  if (badgeGif) {
    gsap.to(badgeGif, {
      opacity: 0,
      duration: 0.3,
      overwrite: false
    });
  }

  // IMMEDIATELY restore UI opacity (no animation = no conflicts)
  var textBlock = document.getElementById('text-block');
  var cardsWrap = document.getElementById('cards-wrap');
  var stats = document.getElementById('stats');
  var bioSection = document.querySelector('#bio-section');

  if (textBlock) textBlock.style.opacity = '1';
  if (cardsWrap) cardsWrap.style.opacity = '1';
  if (stats) stats.style.opacity = '1';
  if (bioSection) bioSection.style.opacity = '1';

  // Refresh ScrollTrigger
  setTimeout(function() {
    if (ScrollTrigger) {
      ScrollTrigger.refresh();
    }
  }, 100);
}
```

## Why This Works

1. **No animation conflicts** - Immediate opacity change avoids GSAP timing issues
2. **State is reset** - `isCurrentlyDimmed = false` ensures fresh state
3. **Forced restoration** - Direct style assignment guarantees visibility
4. **Kill tweens** - `gsap.killTweensOf()` stops any pending animations
5. **Scroll compatibility** - Immediate changes don't conflict with scroll animations
6. **Multiple interactions** - Each interaction starts with clean slate

## Testing After Fix

```
1. Mobile: Tap sphere 3-4 times
2. Exit (tap outside)
3. Scroll down
✓ Text MUST be fully visible
✓ Cards MUST be fully visible

4. Scroll back up
5. Tap sphere again
✓ Still fully visible after exit
✓ No degradation

6. Repeat 5-6 times
✓ No accumulation of opacity issues
```

---

**Status**: Fix ready for implementation ✅
