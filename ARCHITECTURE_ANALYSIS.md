# Portfolio Architecture Analysis: Bio Section Word-Reveal

## Current Structure (index_v7.html)

### HTML Structure
```html
<!-- Line 258-261 -->
<div id="stage">                    <!-- position: fixed; inset: 0; z-index: 10 -->
  <div id="text-block">             <!-- position: absolute; translateY driven by JS -->
    <!-- words dynamically injected here -->
  </div>
</div>

<div id="runway"></div>             <!-- purely scroll distance spacer -->
<!-- rest of page content -->
```

### CSS (lines 117-149)
```css
#runway {
  /* height set by JS to create scroll distance */
}

#stage {
  position: fixed;          /* ← THE PROBLEM */
  inset: 0;                 /* covers entire viewport */
  overflow: hidden;
  pointer-events: none;
  z-index: 10;              /* sits above everything */
}
```

### JavaScript (lines 1931-2073)
```javascript
// Line 1984: Manually set runway height to create scroll distance
runway.style.height = (window.innerHeight + total * PX_PER_WORD) + 'px';

// Lines 2045-2059: ScrollTrigger WITHOUT pin
ScrollTrigger.create({
  trigger: runway,          // ← triggers on the spacer, not a visual section
  start: 'top top',
  end: 'bottom bottom',
  scrub: 0.45,
  onUpdate: function(self) {
    updateWords(self.progress);  // drives text animation
  },
  onLeave: function() {
    gsap.to('#stage', { opacity: 0, /* fade out when done */ });
  }
});
```

---

## The Problem: Two Incompatible Patterns

### Pattern 1: Manual Fixed Overlay (Current)
- `#stage` is **always** position: fixed
- Lives outside the normal document flow
- `#runway` is a separate spacer div that creates scroll distance
- `#stage` doesn't know when it starts/ends — it's just always there
- When `#runway` ends, `#stage` still exists and overlays the next section

**Result:** 
- The stats section (and everything after) gets covered by `#stage`
- `#stage` opacity must be manually toggled (onLeave / onEnterBack)
- Visually disconnected: the animation and the spacer are separate concerns

### Pattern 2: GSAP ScrollTrigger.pin (Correct)
- One section is pinned while scrolling through it
- GSAP **automatically** creates the scroll spacer
- GSAP **automatically** manages start/end
- GSAP **automatically** releases the pin when done
- Everything after flows naturally without overlay

---

## Why This Causes the Stats Section Problem

Looking at line 735-755 (stats section):

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

**Issue:** The stats section triggers based on `#runway`'s position, but `#stage` (position: fixed) overlays it. The two systems don't coordinate:

1. **#runway** ends → `#stage` fades out (onLeave)
2. **#stats** enters viewport → animation fires
3. **But** `#stage` opacity transition (0.4s) might still be running
4. **And** `#stage` is z-index 10, so it was visually blocking content anyway

---

## Correct Architecture: GSAP Pin Pattern

### HTML (refactored)
```html
<!-- Remove #runway, it's created by GSAP automatically -->

<section id="bio-section">
  <div id="stage" style="position: absolute; inset: 0;">
    <div id="text-block">
      <!-- words here -->
    </div>
  </div>
</section>

<!-- Now appears naturally in flow, no #stage overlay -->
<section id="stats">
  ...
</section>
```

### CSS (refactored)
```css
#bio-section {
  position: relative;
  width: 100%;
  height: 100vh;        /* visible section height */
  overflow: hidden;
}

#stage {
  position: absolute;   /* NOT fixed */
  inset: 0;            /* fill the pinned section */
}
```

### JavaScript (refactored)
```javascript
// Calculate total scroll distance needed
var totalScrollDistance = total * PX_PER_WORD;  // 68px per word

// Pin the bio-section, GSAP creates scroll space automatically
ScrollTrigger.create({
  trigger: '#bio-section',
  start: 'top top',
  end: '+=' + totalScrollDistance,    // GSAP adds this much scroll space
  pin: true,                          // GSAP handles pinning + release
  scrub: 0.45,
  onUpdate: (self) => {
    updateWords(self.progress);       // same animation logic
  }
  // NO onLeave/onEnterBack needed — GSAP handles release automatically
});

// Stats now triggers on itself, no dependency on #runway
gsap.from('#stats', {
  opacity: 0,
  y: 40,
  scrollTrigger: {
    trigger: '#stats',    // ← triggers when #stats enters viewport
    start: 'top 80%',
    once: true
  }
});
```

---

## Key Differences

| Aspect | Manual (Current) | GSAP Pin (Correct) |
|--------|------------------|--------------------|
| **Pinning** | Manual CSS (position: fixed) | GSAP pin: true |
| **Scroll Space** | Manual div (#runway) + JS height | Automatic (end: '+=###') |
| **Release** | Manual opacity tween | Automatic when pin ends |
| **Next Section** | Overlay conflict, manual fade | Natural flow, no overlay |
| **Coordination** | Loose (two unrelated systems) | Tight (one ScrollTrigger owns it) |
| **Code Complexity** | Higher (manage fixed + spacer) | Lower (one trigger does it all) |

---

## Why GSAP's Pin System Works

When you use `pin: true`, GSAP:

1. **Measures** the pinned element
2. **Creates a spacer** with equivalent height (your end: '+=X')
3. **Pins the element** (applies position: fixed internally)
4. **While user scrolls**, the element stays in place (your scrub drives animations)
5. **When pin ends**, removes the position: fixed + spacer
6. **Everything after flows** naturally in normal document flow

This is **exactly what you need** for the bio section.

---

## The Refactoring Steps

### Step 1: HTML
- Wrap `#stage` in a `<section id="bio-section">`
- Delete `<div id="runway">` — GSAP creates it
- Move `#stage` to position: absolute, inside the section

### Step 2: CSS
- Change `#bio-section` to position: relative, height: 100vh
- Change `#stage` from fixed to absolute

### Step 3: JavaScript
- Calculate `totalScrollDistance = total * PX_PER_WORD`
- Create ONE ScrollTrigger on `#bio-section` with `pin: true`
- Update the `trigger` in the stats animation from `#runway` to `#stats`
- Remove manual onLeave/onEnterBack opacity tweens (GSAP handles it)

### Step 4: Testing
- Scroll through bio section — text reveals should work identically
- At bio section end, `#stage` should release automatically
- Stats section should appear naturally, no overlay
- Resize window — GSAP refreshes automatically

---

## Code Pattern Summary

```javascript
// ✗ CURRENT (broken coordination)
#runway { height: ... }     // separate spacer
#stage { position: fixed }  // separate overlay
ScrollTrigger on #runway    // manages animation only

// ✓ CORRECT (unified control)
section#bio-section { height: 100vh }
#stage { position: absolute }
ScrollTrigger on #bio-section with pin: true  // manages everything
```

---

## Files to Modify

1. **index_v7.html** (lines 258-261) — HTML structure
2. **index_v7.html** (lines 117-149) — CSS for #stage and #bio-section
3. **index_v7.html** (lines 1945-2073) — JavaScript word-reveal logic
4. **index_v7.html** (lines 735-755) — Stats section trigger

---

## Why This Matters

**Currently:** The portfolio has an elegant landing section (cards) that uses proper GSAP patterns, but the bio section uses a workaround that bypasses GSAP's coordinate system. This causes:
- Visual overlap bugs
- Manual opacity management
- Loose coordination between sections
- Harder to debug/maintain

**After refactoring:** Both sections use the same proven GSAP pattern. Clean, predictable, no overlays, no manual release logic.

