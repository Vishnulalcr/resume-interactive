# Haptic Feedback Implementation Plan
## iOS Safari + Android Chrome via Tactus + Native APIs

---

## 1. Platform Reality Check

| Platform | API | Works? | Notes |
|---|---|---|---|
| Android Chrome | `navigator.vibrate(ms)` | ✅ Yes | Duration in ms, patterns supported |
| Android Chrome | `navigator.vibrate([on,off,on])` | ✅ Yes | Full pattern arrays |
| iOS Safari < 17.4 | `navigator.vibrate()` | ❌ No | Never implemented by WebKit |
| iOS Safari 17.4+ | `navigator.vibrate()` | ⚠️ Inconsistent | Reports mixed results, not reliable |
| iOS Safari 17.4+ | `<input type=checkbox switch>` toggle | ✅ Yes | The REAL technique — fires native UIKit haptic on each toggle |
| Tactus `triggerHaptic(n)` | wrapper | ⚠️ Depends | Likely wraps the switch trick for iOS, vibrate for Android |

**The fundamental problem with the current code**: `light(15)`, `medium(40)`, `heavy(80)` all pass a duration to `triggerHaptic()`. On iOS, duration is ignored — every toggle fires the same UIKit haptic intensity. On Android, duration works correctly but we lose the ability to use patterns.

---

## 2. How the iOS Switch Trick Works

Safari 17.4 introduced the `switch` attribute on checkboxes (a non-standard WebKit extension that renders toggle-style UI). Native UIKit haptic feedback fires on every state change.

```javascript
// Each call to this fires ONE haptic pulse on iOS
function iosHapticPulse() {
  const el = document.createElement('input');
  el.type = 'checkbox';
  el.setAttribute('switch', '');
  el.style.cssText = 'position:fixed;opacity:0;pointer-events:none;top:-9999px;left:-9999px';
  document.body.appendChild(el);
  el.click();           // unchecked → checked  = 1 pulse
  setTimeout(() => el.remove(), 100);
}
```

**To simulate intensity, fire multiple pulses with timed delays:**
- Light = 1 pulse
- Medium = 1 pulse (same hardware, contextually medium)
- Heavy = 2 pulses 20ms apart (stronger perceived weight)
- Success = 2 pulses 50ms apart (feels like a double-tap confirm)
- Error = 3 pulses 30ms apart (feels like a rejection rattle)

**Critical rule**: Must be called from within a user gesture handler (touchstart/touchend/click). Async callbacks that are too delayed will be silently blocked by the browser.

---

## 3. Android Vibration Patterns

Android has far more granularity via pattern arrays `[vibrate, pause, vibrate, pause, ...]`:

```javascript
// Single short buzz
navigator.vibrate(15);   // light

// Medium single
navigator.vibrate(40);   // medium

// Strong single
navigator.vibrate(80);   // heavy

// Success: two bumps
navigator.vibrate([50, 40, 80]);

// Error: three quick rattles
navigator.vibrate([30, 25, 30, 25, 50]);

// Notification: descending
navigator.vibrate([60, 40, 40, 40, 20]);
```

---

## 4. The New HapticManager

Replace the current class entirely:

```javascript
class HapticManager {
  constructor() {
    // Strict iOS detection — exclude Chrome on iOS which also has iPhone in UA
    this.isIOS     = /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
                     !/CriOS|FxiOS|OPiOS/i.test(navigator.userAgent);
    this.isAndroid = /Android/i.test(navigator.userAgent);

    // iOS: check switch attribute support (Safari 17.4+)
    this._iosOK    = this.isIOS && this._detectSwitchSupport();

    // Android: check vibration API
    this._droidOK  = this.isAndroid && 'vibrate' in navigator;

    // Tactus fallback for everything else
    this._tactusOK = typeof triggerHaptic !== 'undefined';

    this.isSupported = this._iosOK || this._droidOK || this._tactusOK;

    this._lastFired  = 0;
    this._minGap     = 40; // ms — prevents saturation
  }

  // ── Feature detection ──────────────────────────────────────────────────
  _detectSwitchSupport() {
    // Safari 17.4+ on iOS 17.4+ supports the switch attribute
    // Parse iOS version from UA string
    const m = navigator.userAgent.match(/OS (\d+)_(\d+)/);
    if (!m) return false;
    const major = parseInt(m[1], 10);
    const minor = parseInt(m[2], 10);
    return major > 17 || (major === 17 && minor >= 4);
  }

  // ── Throttle guard ─────────────────────────────────────────────────────
  _canFire(bypassGap = false) {
    if (!this.isSupported) return false;
    const now = Date.now();
    if (!bypassGap && (now - this._lastFired) < this._minGap) return false;
    this._lastFired = now;
    return true;
  }

  // ── iOS: fire N pulses with timing ─────────────────────────────────────
  _iosPulses(count, spacing = 30) {
    // Create ONE element, toggle it count times
    const el = document.createElement('input');
    el.type = 'checkbox';
    el.setAttribute('switch', '');
    el.style.cssText = 'position:fixed;opacity:0;pointer-events:none;top:-9999px;left:-9999px';
    document.body.appendChild(el);

    for (let i = 0; i < count; i++) {
      setTimeout(() => el.click(), i * spacing);
    }
    setTimeout(() => el.remove(), count * spacing + 100);
  }

  // ── Android: vibrate with duration or pattern ──────────────────────────
  _droid(durOrPattern) {
    navigator.vibrate(durOrPattern);
  }

  // ── Tactus fallback ────────────────────────────────────────────────────
  _tactus(duration) {
    try { triggerHaptic(duration); } catch(e) {}
  }

  // ══ PUBLIC API ══════════════════════════════════════════════════════════

  // Single short pulse — UI acknowledgement, hover, subtle confirmation
  light() {
    if (!this._canFire()) return;
    if (this._iosOK)    this._iosPulses(1);
    else if (this._droidOK)  this._droid(15);
    else if (this._tactusOK) this._tactus(15);
  }

  // Single medium pulse — tap confirmation, mode entry, card interaction
  medium() {
    if (!this._canFire()) return;
    if (this._iosOK)    this._iosPulses(1, 0);     // same pulse, heavier context
    else if (this._droidOK)  this._droid(40);
    else if (this._tactusOK) this._tactus(40);
  }

  // Double pulse — strong impact, major event, heavy discovery
  heavy() {
    if (!this._canFire()) return;
    if (this._iosOK)    this._iosPulses(2, 20);    // two quick pulses = weight
    else if (this._droidOK)  this._droid(80);
    else if (this._tactusOK) this._tactus(80);
  }

  // Two-pulse confirm — success, email sent, sticker placed
  success() {
    if (!this._canFire(true)) return;
    if (this._iosOK)    this._iosPulses(2, 50);    // bump + confirm
    else if (this._droidOK)  this._droid([50, 40, 80]);
    else if (this._tactusOK) this._tactus(80);
  }

  // Three-pulse rattle — error, failed validation, rejected action
  error() {
    if (!this._canFire(true)) return;
    if (this._iosOK)    this._iosPulses(3, 30);    // rattle rattle rattle
    else if (this._droidOK)  this._droid([30, 25, 30, 25, 50]);
    else if (this._tactusOK) this._tactus(30);
  }

  // Notification: escalating — new discovery, first-time moment
  notify() {
    if (!this._canFire(true)) return;
    if (this._iosOK)    this._iosPulses(2, 60);
    else if (this._droidOK)  this._droid([60, 40, 40]);
    else if (this._tactusOK) this._tactus(60);
  }
}
```

---

## 5. Interaction → Haptic Mapping

### Sphere Interactions (Mobile)

| Interaction | Haptic | Why |
|---|---|---|
| First tap (enter mode) | `light()` immediately + `heavy()` after 100ms | Light = acknowledgement, heavy = discovery |
| Sticker placed | `success()` | Double-bump confirms placement |
| Pinch gesture start | `light()` | Acknowledge two-finger mode |
| Exit mode (outside tap) | `light()` | Gentle close |
| Pinch scale hits min/max limit | `light()` | Boundary feel |

### Bio Word Reveal (Currently Too Frequent)

Current code fires `haptics.light(duration)` on **every word** — this is too frequent, phone buzzes constantly. Replace with:

| Moment | Haptic | Why |
|---|---|---|
| Every 5th word (milestone) | `light()` | Rhythm without saturation |
| OR: paragraph boundary only | `medium()` | Structural beat |
| OR: disable entirely | — | Cleaner for long text |

**Recommendation**: Paragraph boundaries only. 6 paragraphs = 6 haptics total.

### Email Modal

| Interaction | Haptic | Why |
|---|---|---|
| Modal opens | `light()` | Soft appear |
| Submit — success | `success()` | Double confirm |
| Submit — validation error | `error()` | Triple rattle |
| Modal closes | `light()` | Soft dismiss |

### Navigation UI

| Interaction | Haptic | Why |
|---|---|---|
| Corner label tap (Portfolio/Blog) | `light()` | UI acknowledgement |
| Side label tap | `light()` | UI acknowledgement |
| Card title tap | `medium()` | Heavier element |
| Resume download | `medium()` | Action confirmation |

---

## 6. Critical Rules for Both Platforms

1. **Must be inside user gesture**: Call haptics directly inside `touchstart`, `touchend`, `click`. If called from `setTimeout` or a delayed async callback, iOS blocks it silently.

2. **Don't fire on scroll**: Scroll is frequent, fine-grained, and would make the phone buzz constantly. Zero haptics during scroll.

3. **Throttle minimum 40ms**: The current `_minGap` of 30ms is good; increase to 40ms for iOS to avoid saturation.

4. **`success()` and `error()` bypass gap**: Multi-pulse patterns need the gap reset bypassed (`bypassGap = true`) otherwise only the first pulse fires.

5. **Android silent mode**: `navigator.vibrate()` respects the device's Do Not Disturb and volume settings. Nothing to do — this is expected behavior.

6. **Test on real hardware**: iOS Simulator does NOT fire haptics. Android emulators usually don't either. Must use physical device.

---

## 7. What Changes in the Code

### Replace `HapticManager` class (lines 1022–1078)
Full rewrite as shown in section 4 above.

### Bio word reveal — change from per-word to per-paragraph
```javascript
// BEFORE (line 2496 in updateWords):
haptics.light(hapticDuration);

// AFTER — only at paragraph breaks (head hits a boundary word index)
const paragraphEnds = [23, 61, 145, 149, 185]; // last word index of each paragraph
if (paragraphEnds.includes(head)) haptics.medium();
```

### Email modal — add success/error haptics
```javascript
// On success:
haptics.success();

// On error (validation fail):
haptics.error();
```

### Pinch limits — add boundary haptic
```javascript
// In touchmove pinch handler, when clamped !== raw:
if (Math.abs(raw - clamped) > 0.02 && _pinchLiveScale !== prev) {
  if (window.haptics) window.haptics.light();
}
```

---

## 8. What Tactus Actually Does

Tactus (`https://unpkg.com/tactus`) is a small shim. Based on its API (`triggerHaptic(n)`), it most likely:
- iOS: Uses the switch checkbox trick (same as ios-haptics library)
- Android: Wraps `navigator.vibrate(n)`
- Desktop: No-op

**The problem**: It only exposes a single `triggerHaptic(duration)` — no `success`, `error`, `notify` types. For multi-pulse patterns we need our own implementation on top of it.

**The recommendation**: Keep Tactus loaded as a fallback but implement iOS switch trick and Android vibrate natively in `HapticManager`. Tactus becomes the last resort for edge cases.

---

## 9. Implementation Effort

| Task | Complexity | Time |
|---|---|---|
| Replace `HapticManager` class | Low | ~20 min |
| Fix bio word haptic (per-paragraph) | Low | ~5 min |
| Add success/error to email modal | Low | ~5 min |
| Add pinch boundary haptic | Low | ~5 min |
| Test on real iPhone | Medium | ~30 min |
| Test on real Android | Medium | ~30 min |

Total: ~1.5 hours including device testing.

---

## Sources

- [ios-haptics library (GitHub)](https://github.com/tijnjh/ios-haptics) — the switch checkbox technique
- [Ionic Framework iOS 18+ haptics issue](https://github.com/ionic-team/ionic-framework/issues/29942) — implementation details
- [navigator.vibrate iOS discussion (MDN)](https://github.com/mdn/browser-compat-data/issues/29166) — platform support reality
- [Maximiliano Firtman on the iOS switch hack](https://x.com/firt/status/2028807962295230776) — expert commentary
