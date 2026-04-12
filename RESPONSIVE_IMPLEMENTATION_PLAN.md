# Portfolio Responsive Design & Spacing Fix Plan

## Phase 1: Fix Blank Scroll Space (Stats → Cards)

### Issue
- CARD_VH currently set to 140%, creating 560vh total scroll height (5.6 screens)
- Makes card transitions feel slow with excessive blank scrolling

### Solution
**Reduce CARD_VH from 140% to 100%**
- Calculated as: 4 cards × 100vh per card = 400vh total
- Each card gets ~100% viewport height to animate through
- Cards will feel snappier with faster transitions
- Still smooth animation, but 3 screens less blank scroll

### Changes
- Line 816: `var CARD_VH = 140;` → `var CARD_VH = 100;`
- This automatically updates: `#cards-wrap height: 560vh` → `400vh`
- All dependent calculations update automatically

---

## Phase 2: Mobile Responsive Design (< 768px)

### 2.1 Hero Section Adjustments
**Current Issues:**
- Sphere may not scale properly on mobile
- Hero statement text may be too large
- Stats grid becomes 2×2 on mobile (good, but needs spacing adjustment)

**Mobile Fixes:**
- Reduce sphere size by 60-70% on mobile
- Clamp hero statement font-size to 14px-24px
- Add `gap: 12px` instead of 24px in stats grid
- Reduce stat-num font from clamp(28px,4vw,44px) to clamp(18px,5vw,28px)
- Add viewport-based padding adjustments

### 2.2 Bio Section (Text Reveal)
**Current Issues:**
- Text block might overflow on narrow screens
- Font size could be too large
- 3/4 positioning may push text off-screen on small devices

**Mobile Fixes:**
- Reduce text-block font size with media query
- Adjust 3/4 positioning to work with smaller viewports
- Use max-width: 90vw for text-block
- Reduce GHOST (fade preview) from 9 to 4 on mobile

### 2.3 Stats Section
**Current Issues:**
- 4-column grid breaks nicely at 2×2, but margins are cramped
- Already handled by existing `@media(max-width:720px)` - verify padding works

**Mobile Fixes:**
- Add specific padding for mobile: `padding: 16px 4vw 16px;`
- Reduce stat-cell gap from 24px to 12px
- Keep existing 2-column grid

### 2.4 Cards Section
**Current Issues:**
- Cards may overflow (crd has min(580px,86vw))
- Card text might be too large for mobile
- Touch interactions not optimized for cards

**Mobile Fixes:**
- Card width: `width: min(90vw, 340px)` (narrower on mobile)
- Reduce .crd-title: clamp(18px,3.6vw,52px) → clamp(14px,4vw,32px)
- Reduce .crd-body: clamp(10px,.84vw,12px) → clamp(9px,2.5vw,11px)
- Adjust padding: clamp(26px,4vh,46px) → clamp(16px,3vh,28px)

### 2.5 Corner & Side Labels
**Current Issues:**
- Labels (8.5px) too small on mobile, hard to read
- Side labels (40px width) take up 10% of screen on narrow devices
- Corner labels (5vw) create excessive margins on small screens

**Mobile Fixes:**
- Hide side labels on mobile (display: none on < 768px)
- Reduce corner label font to 7px on mobile
- Adjust corner label positions: `top: 12px; left: 2vw;` on mobile
- Use `right: 2vw;` instead of 5vw

### 2.6 Resume Section
**Current Issues:**
- Sidebar takes 364px (too wide on mobile)
- Resume sidebar + content breaks layout below 800px

**Mobile Fixes:**
- Hide sidebar completely on < 768px
- Move sidebar content to collapsible header
- Full-width content on mobile
- Stack resume sections vertically with reduced padding

---

## Phase 3: iPad Responsive Design (768px - 1024px)

### 3.1 Layout Adjustments
- Keep 2-column stats grid (working well)
- Increase card width slightly: `min(95vw, 480px)`
- Adjust sidebar width: 300px → 240px
- Maintain readable font sizes

### 3.2 Spacing
- Reduce top/bottom margins by 20%
- Adjust GHOST from 9 to 6 for bio section
- Keep card transitions smooth

---

## Phase 4: Desktop Optimization (> 1024px)

### 4.1 Current (Already Good)
- Hero section at full width
- Stats in 4-column grid ✓
- Cards with proper spacing ✓
- Resume sidebar works well ✓

### 4.2 Enhancements
- Side labels visible and functional ✓
- Corner labels at proper positions ✓
- Text reveal at 3/4 positioning ✓

---

## Phase 5: Touch Interactions & Sphere WebGL

### 5.1 Sphere WebGL Touch Support
**Current Issues:**
- Sphere may not respond to touch properly
- Pinch-to-zoom could interfere with scroll
- Touch events not optimized

**Implementation:**
- Add touch event listeners to sphere canvas
- Support: touch-move → scroll-like behavior
- Support: pinch → zoom (constrain to 0.5-2x)
- Prevent default zoom on pinch
- Add haptic feedback on mobile (vibration API)

### 5.2 Touch Scrolling
- Ensure smooth momentum scrolling on iOS
- Disable text selection on interactive elements
- Add `-webkit-touch-callout: none` to prevent long-press menu

---

## Phase 6: Text Overlap Prevention

### 6.1 Mobile Text Scaling
- Ensure no text-shadow or transforms cause overlap
- Use `line-height: 1.4` minimum on mobile
- Add `word-break: break-word` to card titles
- Test with large font-size accessibility mode

### 6.2 Gradient Masks for Mobile UI

#### 6.2.1 Hero Section
- Add top-to-bottom gradient fade on stats (top 10% fade)
- Prevents stats from overlapping with hero sphere

#### 6.2.2 Bio Section
- Add bottom gradient fade on text-block
- Smooth transition to stats section

#### 6.2.3 Cards Section
- Add side gradient masks (left/right 5% fade)
- Prevents card text from reaching screen edges
- Add bottom fade when card content is tall

#### 6.2.4 Implementation
- Use CSS `mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);`
- Or use `box-shadow: inset` for lighter effect
- Test on iOS Safari (may need `-webkit-` prefix)

---

## Phase 7: Verification & Testing

### 7.1 Breakpoints to Test
- Mobile: 375px (iPhone SE)
- Mobile: 414px (iPhone 11)
- Mobile: 480px (Small Android)
- Tablet: 768px (iPad)
- Tablet: 1024px (iPad Pro)
- Desktop: 1440px
- Desktop: 1920px

### 7.2 Features to Verify
- [ ] Sphere scales and rotates correctly on all devices
- [ ] Text reveal centering works at 3/4 position
- [ ] Stats grid responsive (4→2 columns)
- [ ] Cards animate smoothly
- [ ] Side labels hidden on mobile
- [ ] Corner labels readable on mobile
- [ ] No text overlap in any configuration
- [ ] Touch scroll smooth on iOS/Android
- [ ] Gradient masks visible and clean
- [ ] Resume section readable on all devices

---

## Implementation Order

1. **First**: Reduce CARD_VH (instant improvement)
2. **Second**: Add mobile media queries (< 768px)
3. **Third**: Add tablet media queries (768px-1024px)
4. **Fourth**: Implement touch handlers for sphere
5. **Fifth**: Add gradient masks
6. **Sixth**: Test and verify all breakpoints

---

## Files to Modify
- `index_v7.html` (Main file)
  - CSS: Add media queries
  - CSS: Add gradient masks
  - JavaScript: Add touch event handlers
  - JavaScript: Update CARD_VH value

---

## Expected Outcomes

✓ **Spacing**: Reduced blank scroll from 560vh to 400vh
✓ **Mobile**: Fully functional on iPhone, Android, small tablets
✓ **iPad**: Optimized layout with readable text
✓ **Desktop**: Enhanced with gradient masks and smooth interactions
✓ **Touch**: Sphere responds to touch with proper scaling
✓ **Accessibility**: No text overlap, readable on all devices
