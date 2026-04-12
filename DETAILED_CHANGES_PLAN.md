# Detailed Implementation Plan - Changes Overview

## Change 1: Remove Blur Mask & Add Top Gradient Fade

### Current (To Remove)
```css
#text-block {
  -webkit-mask-image: linear-gradient(to bottom, black 0%, black 85%, rgba(0,0,0,0.6) 95%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 0%, black 85%, rgba(0,0,0,0.6) 95%, transparent 100%);
}
```

### New (To Add)
Add a pseudo-element that creates a **top fade gradient** to prevent text from hitting the top edge:

```css
#stage::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 140px;  /* Fade zone at top */
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 11, 1) 0%,      /* Opaque dark at very top */
    rgba(10, 10, 11, 0.7) 50%,   /* Semi-transparent middle */
    transparent 100%              /* Transparent at bottom */
  );
  pointer-events: none;
  z-index: 5;
}
```

**Effect**: As text scrolls UP, it gradually fades out before reaching the top edge - clean, no text collision.

---

## Change 2: Scale Cards with Text on Mobile

### Current Card Sizing
```css
/* Desktop */
.crd { width: min(580px, 86vw); }

/* Mobile */
.crd { width: min(90vw, 320px); }
```

### New Scaling Strategy
Adjust card dimensions proportionally across breakpoints:

**Mobile (<768px)**
- Width: min(90vw, 340px) - slightly wider for better text
- Padding: clamp(16px, 3vh, 24px) ← scales with viewport
- All card text uses clamp() for responsive sizing

**Tablet (768px-1024px)**
- Width: min(85vw, 500px) - larger for iPad
- Padding: clamp(20px, 3.5vh, 32px)

**Desktop (>1024px)**
- Width: min(580px, 86vw) - keep original
- Padding: clamp(26px, 4vh, 46px)

---

## Change 3: Card Text Proportional Sizing

### Card Title
**Current**:
```css
.crd-title { 
  font-size: clamp(18px, 3.6vw, 52px); 
}
```

**New**:
```css
.crd-title {
  font-size: clamp(18px, 3.6vw, 52px); /* Desktop - keep */
}

@media(max-width:768px) {
  .crd-title { 
    font-size: clamp(16px, 5vw, 28px);  /* Mobile - adjusted */
  }
}

@media(min-width:769px) and (max-width:1024px) {
  .crd-title { 
    font-size: clamp(18px, 4.5vw, 38px); /* Tablet - adjusted */
  }
}
```

### Card Body
**Current**:
```css
.crd-body { 
  font-size: clamp(10px, .84vw, 12px); 
}
```

**New**:
```css
.crd-body {
  font-size: clamp(10px, .84vw, 12px); /* Desktop - keep */
}

@media(max-width:768px) {
  .crd-body { 
    font-size: clamp(10px, 2.8vw, 13px); /* Mobile - larger relative to card */
    line-height: 1.7; /* Improve readability */
  }
}

@media(min-width:769px) and (max-width:1024px) {
  .crd-body { 
    font-size: clamp(11px, 2.2vw, 13px); /* Tablet */
    line-height: 1.7;
  }
}
```

### Card Number
**New** (ensure it scales too):
```css
.crd-num {
  font-size: clamp(8px, 2vw, 10px); /* Mobile responsive */
}

@media(min-width:769px) {
  .crd-num { font-size: 9px; } /* Tablet/Desktop */
}
```

---

## Change 4: Hero Text 2x Larger

### Current Hero SVG
The hero statement uses SVG text that's rendered from a canvas or DOM element.

### New Sizing
**Current** (approximate):
```css
#hero-statement .hero-svg-wrap {
  width: clamp(280px, 82vw, 1400px);
}
```

**New** (2x larger):
```css
#hero-statement .hero-svg-wrap {
  width: clamp(560px, 92vw, 1600px); /* Doubled min, increased max */
}
```

**Mobile** (needs adjustment):
```css
@media(max-width:768px) {
  #hero-statement .hero-svg-wrap { 
    width: clamp(240px, 85vw, 380px); /* Larger for mobile too */
  }
}
```

---

## Summary of All Changes

| Element | Change | Mobile | Tablet | Desktop |
|---------|--------|--------|--------|---------|
| Hero SVG | +100% | 85vw | 90vw | 92vw |
| Cards Width | Responsive | 90vw, max 340px | 85vw, max 500px | Original |
| Card Title | Scaled to card | 5vw | 4.5vw | 3.6vw |
| Card Body | Scaled to card | 2.8vw | 2.2vw | 0.84vw |
| Card Padding | Responsive | clamp 16-24px | clamp 20-32px | clamp 26-46px |
| Text Fade | Top gradient | 140px fade zone at top | (same) | (same) |

---

## Expected Results

✓ **Top Gradient Fade**: Text smoothly disappears before hitting top - clean, professional
✓ **Scaled Cards**: Card dimensions proportional to text on all devices
✓ **Proportional Text**: Card text scales with card size, never cramped or oversized
✓ **Hero 2x Bigger**: Hero statement much more prominent and impactful
✓ **Mobile Friendly**: All text readable and well-balanced on small screens
✓ **Smooth Scaling**: Uses clamp() for perfect responsive sizing

---

## Implementation Steps

1. Remove blur mask from #text-block
2. Add ::before pseudo-element to #stage with top gradient fade
3. Update card width sizing for mobile/tablet
4. Add card title responsive sizing (media queries)
5. Add card body responsive sizing (media queries)
6. Update hero SVG width to 2x
7. Test on all breakpoints

---

**Ready to approve and implement?**
