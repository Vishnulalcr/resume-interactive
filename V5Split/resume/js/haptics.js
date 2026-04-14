/* ═════════════════════════════════════════════════════════════════════
   HAPTIC MANAGER  v3 — fully native, no external dependency
   ─────────────────────────────────────────────────────────────────────
   iOS Safari 17.4+  →  switch-checkbox label trick (self-mounted)
     · CRITICAL: label/input must use position:fixed + opacity:0, NOT
       display:none — WebKit won't fire UIKit haptics on hidden elements
     · CRITICAL: must be called from a user gesture (touchstart, touchend,
       touchmove, click). Scroll events / RAF / setTimeout do NOT count.
       Bio scroll haptics use a separate touchmove listener (see below).

   Android Chrome  →  navigator.vibrate() with on/off pattern arrays
     · Works from any context including scroll/RAF
     · Pattern arrays [on, off, on...] give nuanced feel (success, error)
   ═════════════════════════════════════════════════════════════════════ */
class HapticManager {
  constructor() {
    // iOS detection: covers iPhone, iPad (modern iPadOS reports MacIntel)
    // Excludes Chrome/Firefox/Opera on iOS (they don't have the switch trick)
    this.isIOS = (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
                 !/CriOS|FxiOS|OPiOS/i.test(navigator.userAgent);
    this.isAndroid = /Android/i.test(navigator.userAgent);
    this._droidOK  = this.isAndroid && 'vibrate' in navigator;
    this._lastFired = 0;
    this._minGap    = 40;
    this._label     = null; // iOS switch label — click THIS, not the input
    this._input     = null;

    // Mount iOS switch elements as soon as DOM is ready
    if (this.isIOS) {
      var self = this;
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { self._mount(); }, { once: true });
      } else {
        this._mount();
      }
    }
  }

  // ── Mount hidden switch + label pair ─────────────────────────────────
  // position:fixed + opacity:0 is REQUIRED — display:none blocks UIKit haptic
  _mount() {
    if (this._label) return; // already mounted
    var uid = '__hap_sw__';
    var inp = document.createElement('input');
    inp.type = 'checkbox';
    inp.id = uid;
    inp.setAttribute('switch', '');
    inp.setAttribute('aria-hidden', 'true');
    inp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    var lbl = document.createElement('label');
    lbl.htmlFor = uid;
    lbl.setAttribute('aria-hidden', 'true');
    lbl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(inp);
    document.body.appendChild(lbl);
    this._input = inp;
    this._label = lbl;
  }

  get _iosOK()     { return this.isIOS && !!this._label; }
  get isSupported() { return this._iosOK || this._droidOK; }

  // ── Throttle guard ───────────────────────────────────────────────────
  _canFire(bypass) {
    if (!this.isSupported) return false;
    var now = Date.now();
    if (!bypass && now - this._lastFired < this._minGap) return false;
    this._lastFired = now;
    return true;
  }

  // ── iOS: click the LABEL (NOT the input) ─────────────────────────────
  // Label click toggles checkbox → UIKit fires one haptic pulse
  // Must be called synchronously inside a user gesture handler
  _ios() {
    if (!this._label) this._mount();
    try { this._label.click(); } catch(e) {}
  }

  // ── Android: vibrate single duration or [on,off,on...] pattern ───────
  _droid(p) { try { navigator.vibrate(p); } catch(e) {} }

  // ══ PUBLIC API ════════════════════════════════════════════════════════

  // Single soft tick — any button press, badge show, bio per-word
  light() {
    if (!this._canFire()) return;
    this._iosOK ? this._ios() : this._droid(12);
  }

  // Solid single — modal open, card tap, sphere mode entry
  medium() {
    if (!this._canFire()) return;
    this._iosOK ? this._ios() : this._droid(36);
  }

  // Strong single (+ trailing Android rumble)
  heavy() {
    if (!this._canFire()) return;
    this._iosOK ? this._ios() : this._droid(70);
  }

  // Two-bump confirm — sticker placed, email sent, download
  success() {
    if (!this._canFire(true)) return;
    this._iosOK ? this._ios() : this._droid([40, 30, 65]);
  }

  // Triple rattle — validation fail, rejected action
  error() {
    if (!this._canFire(true)) return;
    this._iosOK ? this._ios() : this._droid([22, 18, 22, 18, 44]);
  }

  // Two-beat notify
  notify() {
    if (!this._canFire(true)) return;
    this._iosOK ? this._ios() : this._droid([50, 30, 32]);
  }
}

const haptics = new HapticManager();
window.haptics = haptics; // expose to module script
