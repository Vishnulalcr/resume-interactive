# -*- coding: utf-8 -*-
"""Patch resume/index.html: About section — large all-caps, scroll word-batch reveal."""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FILE = ROOT / "resume" / "index.html"

PARAS = [
    "I'm Vishnulal. A designer who starts with how something looks and works backwards from there. Aesthetics first, everything else gets figured out around that.",
    "I've spent 12 years at the intersection of motion, brand, and product. Which is a polished way of saying I've been in a lot of rooms insisting that how something looks is not the last conversation, it's the first one.",
    "Most of my career has lived in the detailed middle: between a brand film and a UI system, between a 3D render and an interaction state, between what looks exactly right and what actually ships. At scale, too.",
    "Ola Electric — visual language for India's EV era, built from nothing. MoveOS — 900,000+ users. Kruti.AI — one shot to introduce an AI to the world. Different mediums. Same underlying question: does this look exactly right?",
    "These days I'm interested in work that uses all of it. Motion, product, generative art, interactive experience. Work where the visual decision has real weight, and where someone notices when you get it wrong.",
    "Looking for the right creative challenge. One where aesthetics are taken seriously from day one. I work best with loud music and good collaborators, both are non-negotiable.",
]


def build_about_html():
    sr_text = " ".join(PARAS)
    lines = [
        '<section id="about" aria-label="About">',
        f'  <p class="about-sr-only">{html.escape(sr_text)}</p>',
        '  <div class="about-inner about-visual" aria-hidden="true">',
    ]
    for para in PARAS:
        words = [w for w in re.split(r"\s+", para.strip()) if w]
        parts = ['<p class="about-line">']
        for w in words:
            parts.append(f'<span class="about-w">{html.escape(w)}</span>')
            parts.append(" ")
        if parts[-1] == " ":
            parts.pop()
        parts.append("</p>")
        lines.append("    " + "".join(parts))
    lines.append("  </div>")
    lines.append("</section>")
    return "\n".join(lines)


NEW_CSS = """/* ABOUT — large caps + scroll word reveal */
#about{position:relative;z-index:2;padding:0 8vw;background:var(--dark)}
.about-inner{max-width:min(980px,94vw);margin:0 auto}
.about-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.about-visual{padding:clamp(72px,14vh,120px) 0 clamp(64px,12vh,100px)}
.about-line{font-family:var(--f);font-size:clamp(14px,2.1vw,26px);line-height:1.45;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.88);text-align:left;font-weight:600;margin:0 0 clamp(1.1em,3.5vh,1.75em);max-width:100%;hyphens:auto;overflow-wrap:anywhere}
.about-line:last-child{margin-bottom:0}
.about-w{display:inline-block;opacity:0;transform:translate3d(0,0.35em,0);margin:0 .14em .2em 0;vertical-align:baseline;will-change:opacity,transform}
@media(max-width:640px){.about-line{letter-spacing:.04em;line-height:1.42;font-size:clamp(12px,3.6vw,18px)}}"""

NEW_GSAP = """/* ═══ ABOUT: pinned scroll — words in small batches ═══════════════════ */
(function(){
  var root = document.querySelector('#about');
  var words = gsap.utils.toArray('.about-w');
  if (!root || !words.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BATCH = 3;
  var PX_PER_BATCH = 88;
  var batches = Math.max(1, Math.ceil(words.length / BATCH));
  var scrollDist = batches * PX_PER_BATCH;

  function applyBatch(n) {
    var cap = n <= 0 ? 0 : Math.min(words.length, n * BATCH);
    words.forEach(function(w, i) {
      var on = i < cap;
      gsap.set(w, { opacity: on ? 1 : 0, y: on ? 0 : '0.35em' });
    });
  }

  if (reduce) {
    applyBatch(batches);
    return;
  }

  gsap.set(words, { opacity: 0, y: '0.35em' });
  ScrollTrigger.create({
    trigger: '#about',
    start: 'top top',
    end: '+=' + scrollDist,
    pin: true,
    pinSpacing: true,
    scrub: 0.55,
    anticipatePin: 1,
    onUpdate: function(self) {
      var n = Math.ceil(self.progress * batches);
      applyBatch(n);
    }
  });
})();"""

def main():
    text = FILE.read_text(encoding="utf-8", errors="replace")

    old_css = """/* ABOUT */
#about{position:relative;z-index:2;padding:clamp(72px,12vh,120px) 8vw clamp(80px,14vh,140px);background:var(--dark)}
.about-inner{max-width:720px;margin:0 auto}
.about-chunk{font-family:var(--fs);font-size:clamp(15px,1.35vw,18px);line-height:1.75;color:rgba(255,255,255,.72);margin:0 0 1.25em;text-align:left;opacity:0;transform:translateY(16px)}
.about-chunk:last-child{margin-bottom:0}
.about-chunk .kw{cursor:pointer}"""

    if old_css not in text:
        raise SystemExit("CSS block not found (file may have changed)")
    text = text.replace(old_css, NEW_CSS)

    old_html = """<section id="about" aria-label="About">
  <div class="about-inner">
    <p class="about-chunk">I'm Vishnulal. A designer who starts with how something looks and works backwards from there. <span class="kw" data-scramble>Aesthetics</span> first, everything else gets figured out around that.</p>
    <p class="about-chunk">I've spent 12 years at the intersection of <span class="kw" data-scramble>motion</span>, brand, and product. Which is a polished way of saying I've been in a lot of rooms insisting that how something looks is not the last conversation, it's the first one.</p>
    <p class="about-chunk">Most of my career has lived in the detailed middle: between a brand film and a UI system, between a 3D render and an interaction state, between what looks exactly right and what actually ships. At scale, too.</p>
    <p class="about-chunk"><span class="kw" data-scramble>Ola Electric</span> — visual language for India's EV era, built from nothing. <span class="kw" data-scramble>MoveOS</span> — 900,000+ users. <span class="kw" data-scramble>Kruti.AI</span> — one shot to introduce an AI to the world. Different mediums. Same underlying question: does this look exactly right?</p>
    <p class="about-chunk">These days I'm interested in work that uses all of it. Motion, product, <span class="kw" data-scramble>generative art</span>, interactive experience. Work where the visual decision has real weight, and where someone notices when you get it wrong.</p>
    <p class="about-chunk">Looking for the right creative challenge. One where aesthetics are taken seriously from day one. I work best with loud music and good collaborators, both are <span class="kw" data-scramble>non-negotiable</span>.</p>
  </div>
</section>"""

    new_html = build_about_html()
    if old_html not in text:
        raise SystemExit("About HTML block not found")
    text = text.replace(old_html, new_html)

    old_gsap = """/* ═══ ABOUT: progressive reveal ══════════════════════════════════════════ */
var aboutChunks = gsap.utils.toArray('.about-chunk');
gsap.set(aboutChunks, {opacity: 0, y: 18});
ScrollTrigger.create({
  trigger: '#about',
  start: 'top 82%',
  end: 'bottom 25%',
  scrub: 0.6,
  onUpdate: function(self) {
    var total = aboutChunks.length;
    aboutChunks.forEach(function(el, i) {
      var stagger = i / Math.max(1, total - 0.5);
      var local = (self.progress - stagger * 0.55) / 0.45;
      var o = Math.max(0, Math.min(1, local * 1.4));
      gsap.set(el, {opacity: o, y: 18 * (1 - o)});
    });
  }
});"""

    if old_gsap not in text:
        raise SystemExit("About GSAP block not found")
    text = text.replace(old_gsap, NEW_GSAP)

    FILE.write_text(text, encoding="utf-8", newline="\n")
    import math
    wc = len(re.findall(r"\S+", " ".join(PARAS)))
    bc = max(1, math.ceil(wc / 3))
    print("OK: about section updated — words:", wc, "batches (~3 words):", bc)


if __name__ == "__main__":
    main()
