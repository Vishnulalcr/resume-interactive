---
name: 12-principles-of-animation
description: >-
  Applies Disney's 12 animation principles to web interfaces so motion feels
  natural, organic, and human. Use when designing or implementing CSS/JS
  transitions, keyframes, micro-interactions, loading states, modals, hovers,
  scroll-driven motion, or when the user mentions Disney principles, easing,
  timing, anticipation, squash and stretch, or motion polish.
---

# 12 principles of animation (web UI)

When improving UI motion, walk the interface through these deliberately—do not apply all at once; pick what the interaction needs.

## 1. Squash and stretch

- **Web**: Subtle scale on press (`transform: scale(0.97)`), elastic overshoot on release, slight width/height asymmetry during drag or success bursts.
- **Avoid**: Extreme distortion on text-heavy controls (readability).

## 2. Anticipation

- **Web**: Brief reverse motion or pause before a big state change (drawer opens, modal scales in, delete confirm): e.g. tiny shrink before expand, or opacity dip before flash.

## 3. Staging

- **Web**: One focal transition at a time; dim or blur non-focused layers; sequence entrance (hero → supporting → chrome). Reduce competing simultaneous animations.

## 4. Straight ahead vs pose to pose

- **Web**: **Pose to pose** for predictable UI: define start/end keyframes and interpolate. **Straight ahead** sparingly for organic flourishes (particles, decorative loops) where keyframes are impractical.

## 5. Follow-through & overlapping action

- **Web**: Staggered list/item delays (`transition-delay`, FLIP stagger); child elements lag parent (icons, badges settle after card); scroll momentum with deceleration curves.

## 6. Slow in, slow out

- **Web**: Prefer custom cubic-beziers over linear. Default “UI sweet spot” is often something like `cubic-bezier(0.4, 0, 0.2, 1)` or gentler outs for large moves; ease-in for exits, ease-out for entrances.

## 7. Arcs

- **Web**: Parabolic or curved paths for draggable elements, tooltips, and decorative motion—not only straight `translateX/Y`. Use `offset-path` or multi-step keyframes when it helps readability.

## 8. Secondary action

- **Web**: Small parallel motion that supports the primary action: icon wiggle while toast appears, subtle background shift when panel opens—never stealing focus from the main affordance.

## 9. Timing

- **Web**: Durations scale with distance and importance (~120–200ms micro, ~250–400ms panel, longer only for intentional emphasis). Respect `prefers-reduced-motion`: replace with opacity/short fades or instant state.

## 10. Exaggeration

- **Web**: Amplify clarity, not chaos: slightly overshoot snap-to-grid, emphasize success/error with one bold motion curve or scale pop—keep one exaggerated beat per interaction.

## 11. Solid drawing (spatial clarity)

- **Web**: Consistent perspective and depth: shadows, layers, and motion align with the design’s z-index story. Avoid ambiguous overlaps; match `transform-origin` to the user’s mental hinge (top of modal, corner of card).

## 12. Appeal

- **Web**: Motion matches brand tone (playful vs clinical); curves and rhythm feel intentional; idle states and micro-rewards feel crafted, not stock.

## Quick review checklist

- [ ] Easing is non-linear where humans expect mass (slow in/out).
- [ ] Important transitions have anticipation or staging, not a single hard pop.
- [ ] Lists and hierarchies use stagger/overlap, not everything at once.
- [ ] `prefers-reduced-motion` has a simpler or minimal path.
- [ ] One primary motion per beat; secondary motion supports only.

## When to load more context

If the task is character illustration or film-style rigs, this skill is the wrong layer—use art/animation tooling. For product UI, stay in CSS, motion libraries, and reduced-motion accessibility.
