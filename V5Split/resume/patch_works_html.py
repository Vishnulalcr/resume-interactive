# One-shot: restructure wcScrollDriver block. Run from resume/: python patch_works_html.py
from pathlib import Path

p = Path("index.html")
s = p.read_text(encoding="utf-8", errors="replace")

d0 = s.find('<div id="wcScrollDriver">')
if d0 < 0:
    raise SystemExit("wcScrollDriver not found")
d1 = s.find('<div id="cards-wrap">', d0)
if d1 < 0:
    raise SystemExit("cards-wrap not found")

old = s[d0:d1]
st = old.find('<section id="stats"')
if st < 0:
    raise SystemExit("stats not found inside old block")
# end of stats section (first </section> after stats open — stats is shallow)
en = old.find("</section>", st) + len("</section>")
stats_html = old[st:en].strip()

hero_section = """<section id="hero-image-transition" aria-label="Selected work">
<div id="worksCanvas">
<div id="worksMotionLayer">
<div id="bentoPanRoot">
<div id="bentoGrid" class="bento-grid"></div>
</div>
</div>
</div>
</section>
"""

new_block = (
    stats_html
    + "\n\n"
    + '<div id="wcScrollDriver">\n'
    + '<div id="wcStickyFrame">\n'
    + hero_section
    + "\n"
)

s2 = s[:d0] + new_block + s[d1:]

# Remove WORKS CANVAS GALLERY inline script (replaced by external modules)
g0 = s2.find("<!-- WORKS CANVAS GALLERY -->")
if g0 >= 0:
    gs = s2.find("<script>", g0)
    ge = s2.find("</script>", gs)
    if gs >= 0 and ge >= 0:
        s2 = s2[:g0] + "<!-- WORKS CANVAS: see js/image-loader.js, hero-animation.js, image-preview.js -->\n" + s2[ge + len("</script>") :]

p.write_text(s2, encoding="utf-8")
print("patched index.html OK")
