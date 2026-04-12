# Quick Reference: Line-by-Line Changes

## File: index_v7.html

### CHANGE 1: HTML Lines 258-261

Find this:
```html
258 | <div id="stage">
259 |   <div id="text-block">
260 |     <!-- words injected here -->
261 |   </div>
262 | </div>
263 |
264 | <div id="runway"></div>
```

Replace with:
```html
258 | <section id="bio-section">
259 |   <div id="stage">
260 |     <div id="text-block">
261 |       <!-- words injected here -->
262 |     </div>
263 |   </div>
264 | </section>
265 |
266 | <!-- #runway is DELETED — GSAP creates it automatically -->
```

---

### CHANGE 2: CSS Lines 117-149

Find this:
```css
117 | /* ── BIO WORD-REVEAL ── */
118 |
119 | /* runway: purely scroll distance */
120 | #runway { /* height set by JS */ }
121 |
122 | /* fixed stage */
123 | #stage {
124 |   position: fixed;
125 |   inset: 0;
126 |   overflow: hidden;
127 |   pointer-events: none;
128 |   z-index: 10;
129 | }
130 |
131 | /* top / bottom vignette masks */
132 | #stage::before,
133 | #stage::after {
134 |   content: '';
135 |   position: absolute;
136 |   left: 0; right: 0;
137 |   height: 32vh;
138 |   z-index: 5;
139 |   pointer-events: none;
140 | }
141 | #stage::before {
142 |   top: 0;
143 |   background: linear-gradient(to bottom, #0c0c0c 20%, transparent 100%);
144 | }
145 | #stage::after {
146 |   bottom: 0;
147 |   background: linear-gradient(to top, #0c0c0c 20%, transparent 100%);
148 | }
```

Replace with:
```css
117 | /* ── BIO WORD-REVEAL ── */
118 |
119 | /* BIO SECTION — pinned during scroll */
120 | #bio-section {
121 |   position: relative;
122 |   width: 100%;
123 |   height: 100vh;
124 |   overflow: hidden;
125 |   z-index: 3;
126 | }
127 |
128 | /* stage: absolute, fills pinned section */
129 | #stage {
130 |   position: absolute;
131 |   inset: 0;
131 |   overflow: hidden;
133 |   pointer-events: none;
134 |   z-index: 1;
135 | }
136 |
137 | /* top / bottom vignette masks */
138 | #stage::before,
139 | #stage::after {
140 |   content: '';
141 |   position: absolute;
142 |   left: 0; right: 0;
143 |   height: 32vh;
144 |   z-index: 5;
145 |   pointer-events: none;
146 | }
147 | #stage::before {
148 |   top: 0;
149 |   background: linear-gradient(to bottom, #0c0c0c 20%, transparent 100%);
150 | }
151 | #stage::after {
152 |   bottom: 0;
153 |   background: linear-gradient(to top, #0c0c0c 20%, transparent 100%);
154 | }
```

---

### CHANGE 3: JavaScript Lines 1931-2073

**Delete everything from line 1931 to 2073.**

**Copy and paste the entire contents of `BIO_REVEAL_CORRECTED.js`** in its place.

Key differences:
- Line ~1950: Change `var runway =` to `var bioSection =`
- Line ~1984: Delete `runway.style.height = ...`
- Line ~1985: Add `var totalScrollDistance = total * PX_PER_WORD;`
- Lines ~2045-2059: Complete rewrite of ScrollTrigger config
  - Change `trigger: runway` → `trigger: bioSection`
  - Change `end: 'bottom bottom'` → `end: '+=' + totalScrollDistance`
  - Add `pin: true`
  - Delete `onLeave` and `onEnterBack` functions

---

### CHANGE 4: JavaScript Lines 735-755 (Stats Section)

Find this:
```javascript
744 |       trigger: '#runway',
745 |       start: 'top 50%',
```

Replace with:
```javascript
744 |       trigger: '#stats',
745 |       start: 'top 80%',
```

Full context:
```javascript
742 | gsap.from('#stats', {
743 |   opacity: 0,
744 |   y: 40,
745 |   scrollTrigger: {
746 |     trigger: '#stats',      // ← CHANGED from '#runway'
747 |     start: 'top 80%',       // ← CHANGED from 'top 50%'
748 |     once: true
749 |   }
750 | })
```

---

## Summary of All Changes

| Location | What | From | To |
|----------|------|------|-----|
| Line 258 | HTML wrapper | `<div id="stage">` | `<section id="bio-section">` + `<div id="stage">` |
| Line 261 | HTML closing | `</div>` × 1 | `</div>` × 2 + `</section>` |
| Line 264 | HTML spacer | `<div id="runway"></div>` | Deleted |
| Line 117 | CSS section | Nothing | New `#bio-section` block |
| Line 123-129 | CSS stage | `position: fixed; ... z-index: 10;` | `position: absolute; ... z-index: 1;` |
| Line 1949 | JS var | `var runway = document.getElementById('runway')` | `var bioSection = document.getElementById('bio-section')` |
| Line 1984 | JS height | `runway.style.height = (window.innerHeight + total * PX_PER_WORD) + 'px'` | Deleted |
| Line 1985 | JS calc | Nothing | New `var totalScrollDistance = total * PX_PER_WORD;` |
| Lines 2045-2059 | JS ScrollTrigger | Old config (6 lines) | New config (12 lines) with `pin: true` |
| Line 2054-2057 | JS callbacks | `onLeave` and `onEnterBack` | Deleted |
| Line 746 | JS stats trigger | `trigger: '#runway'` | `trigger: '#stats'` |
| Line 747 | JS stats start | `start: 'top 50%'` | `start: 'top 80%'` |

---

## Critical Checklist

Before testing, verify:

- [ ] HTML: `#bio-section` wraps `#stage`
- [ ] HTML: `#runway` div is completely gone
- [ ] CSS: `#bio-section` added with `height: 100vh`
- [ ] CSS: `#stage` changed to `position: absolute`
- [ ] CSS: `#stage` z-index changed from 10 to 1
- [ ] JS: `bioSection` variable references correct element
- [ ] JS: `totalScrollDistance` calculated
- [ ] JS: ScrollTrigger `trigger: bioSection` (not string)
- [ ] JS: ScrollTrigger has `pin: true`
- [ ] JS: ScrollTrigger `end: '+=' + totalScrollDistance`
- [ ] JS: Stats trigger changed to `#stats`
- [ ] File saved

---

## Testing

After changes, open browser and:

1. Open DevTools → Console tab
2. Scroll through page
3. Check for red error messages (should be none)
4. Bio text should reveal word by word
5. At bio end, stats section should appear
6. Stats should not be covered by anything
7. Resize window → text centering should adjust

---

## If It Breaks

1. Check console errors first
2. Compare your code line-by-line against `IMPLEMENTATION_GUIDE.md`
3. Verify `#bio-section` exists in DevTools Elements tab
4. Check that `#stage` is NOT position: fixed
5. Open `BIO_REVEAL_CORRECTED.js` and copy the ENTIRE script again

---

## Success Indicators

✓ Bio text reveals smoothly  
✓ Stats section appears (not hidden)  
✓ No console errors  
✓ No white space gaps  
✓ Smooth scroll transitions  
✓ Window resize doesn't break layout  
✓ Mobile viewport works  

