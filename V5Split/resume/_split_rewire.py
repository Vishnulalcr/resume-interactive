from pathlib import Path
import re

root = Path(__file__).resolve().parent
idx = root / "index.html"
text = idx.read_text(encoding="utf-8", errors="replace")

# CSS files requested by user
base_css = (root / "css" / "base.css").read_text(encoding="utf-8", errors="replace")
hero_css = (root / "css" / "hero.css").read_text(encoding="utf-8", errors="replace")

(root / "css" / "variables.css").write_text(base_css, encoding="utf-8")

stats_lines = []
for line in hero_css.splitlines():
    s = line.strip()
    if (
        s.startswith("/* STATS */")
        or s.startswith("#stats")
        or s.startswith(".stats-")
        or s.startswith(".stat-")
    ):
        stats_lines.append(line)
if not stats_lines:
    stats_lines = ["/* Stats styles currently live in hero.css */"]
(root / "css" / "stats.css").write_text("\n".join(stats_lines) + "\n", encoding="utf-8")

bio_lines = []
capture = False
for line in hero_css.splitlines():
    s = line.strip()
    if (
        "BIO WORD-REVEAL" in s
        or s.startswith("#bio-section")
        or s.startswith("#stage")
        or s.startswith("#text-block")
        or s.startswith(".w")
        or s.startswith(".para-gap")
    ):
        capture = True
    if capture:
        bio_lines.append(line)
if not bio_lines:
    bio_lines = ["/* Bio styles currently live in hero.css */"]
(root / "css" / "bio.css").write_text("\n".join(bio_lines) + "\n", encoding="utf-8")

(root / "css" / "works-canvas.css").write_text(
    "/* Works canvas bundle */\n"
    "@import url('./hero-animation.css');\n"
    "@import url('./bento-grid.css');\n"
    "@import url('./canvas-interaction.css');\n"
    "@import url('./image-preview.css');\n",
    encoding="utf-8",
)

# JS files requested by user
(root / "js" / "config.js").write_text(
    "window.APP_CONFIG = {\n"
    "  smoothScroll: true,\n"
    "  sphereEnabled: true,\n"
    "  worksCanvasEnabled: false\n"
    "};\n"
    "window._sphereVisible = true;\n",
    encoding="utf-8",
)

animations_js = (root / "js" / "animations.js").read_text(encoding="utf-8", errors="replace")
(root / "js" / "scroll-animations.js").write_text(animations_js, encoding="utf-8")

(root / "js" / "bio-reveal.js").write_text(
    "/* Bio reveal currently executed from scroll-animations.js */\n",
    encoding="utf-8",
)

(root / "js" / "works-canvas.js").write_text(
    "/* Works canvas kept disabled in current stable baseline. */\n",
    encoding="utf-8",
)

sphere_text = (root / "js" / "sphere.js").read_text(encoding="utf-8", errors="replace")
sphere_text = re.sub(r"^\s*<script[^>]*>\s*", "", sphere_text)
sphere_text = re.sub(r"\s*</script>\s*$", "\n", sphere_text)
(root / "js" / "three-sphere.js").write_text(sphere_text, encoding="utf-8")

# Replace inline style with external css links
style_start = text.find("<style>")
style_end = text.find("</style>", style_start)
if style_start == -1 or style_end == -1:
    raise RuntimeError("Could not locate inline style block")
style_end += len("</style>")

css_links = (
    '<link rel="stylesheet" href="css/variables.css">\n'
    '<link rel="stylesheet" href="css/hero.css">\n'
    '<link rel="stylesheet" href="css/stats.css">\n'
    '<link rel="stylesheet" href="css/cards.css">\n'
    '<link rel="stylesheet" href="css/bio.css">\n'
    '<link rel="stylesheet" href="css/resume.css">\n'
    '<link rel="stylesheet" href="css/works-canvas.css">\n'
    '<link rel="stylesheet" href="css/modal.css">\n'
    '<link rel="stylesheet" href="css/responsive.css">\n'
)
text = text[:style_start] + css_links + text[style_end:]

# Replace classic inline script block with external scripts
classic_start = text.find("<script>\n\n/* ═══ CURSOR")
if classic_start == -1:
    classic_start = text.find("<script>\n/* ═══ CURSOR")
if classic_start == -1:
    raise RuntimeError("Could not locate main inline script block")
classic_end = text.find("</script>", classic_start)
if classic_end == -1:
    raise RuntimeError("Could not locate end of main inline script block")
classic_end += len("</script>")

external_js = (
    '<script src="js/config.js"></script>\n'
    '<script src="js/haptics.js"></script>\n'
    '<script src="js/cursor.js"></script>\n'
    '<script src="js/bio-reveal.js"></script>\n'
    '<script src="js/scroll-animations.js"></script>\n'
    '<script src="js/modal.js"></script>\n'
    '<script src="js/works-canvas.js"></script>\n'
    '<script src="js/main.js"></script>\n'
)
text = text[:classic_start] + external_js + text[classic_end:]

# Remove old inline sphere visibility seed
text = text.replace('<script>window._sphereVisible = true;</script>\n\n', "")

# Replace inline module with external module script
mod_start = text.find('<script type="module">')
mod_end = text.find("</script>", mod_start)
if mod_start == -1 or mod_end == -1:
    raise RuntimeError("Could not locate module script block")
mod_end += len("</script>")
text = text[:mod_start] + '<script type="module" src="js/three-sphere.js"></script>' + text[mod_end:]

idx.write_text(text, encoding="utf-8")
print("Split and rewire complete.")
