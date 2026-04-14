# -*- coding: utf-8 -*-
"""One-shot: extract inline CSS/JS from monolithic resume/index.html into split files.

Requires index.html to still contain the original <style> block and inline scripts at the
line offsets in this script. After a successful run, re-run only after restoring the
monolithic HTML (e.g. from git). Run from repo root: python resume/_split_safe_extract.py
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / "index.html"


def main() -> None:
    text = INDEX.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)

    # --- CSS slices (1-based line numbers from monolithic <style> … </style>)
    # Slice by stable 1-based line numbers from current index.html
    def sl(a: int, b: int) -> str:
        return "".join(lines[a - 1 : b])

    css_chunks = {
        "css/variables.css": sl(23, 33),  # :root … #gc
        "css/hero.css": sl(34, 43),  # HERO block
        "css/stats.css": sl(44, 109),  # STATS, chrome, masks, mobile card padding
        "css/cards.css": sl(110, 119),
        "css/resume.css": sl(120, 173),
        "css/responsive.css": sl(174, 250),
        "css/bio.css": sl(251, 361),
        "css/modal.css": sl(362, 526),
        "css/works-canvas.css": "/* Works canvas — reserved; wire when canvas feature is enabled */\n",
    }

    for rel, body in css_chunks.items():
        p = ROOT / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(body, encoding="utf-8")

    # --- Main app script (after ScrollTrigger CDN, before importmap)
    main_js = "".join(lines[714:1558])
    (ROOT / "js/app-main.js").write_text(main_js, encoding="utf-8")

    # --- Three module (no <script> wrapper)
    mod = "".join(lines[1571:2702])
    mod = re.sub(r"^\ufeff?", "", mod)
    (ROOT / "js/three-sphere.js").write_text(mod, encoding="utf-8")

    # --- Bio + email modal + footer haptics (after Three module)
    tail_js = "".join(lines[2705:3054])
    (ROOT / "js/bio-email-footer.js").write_text(tail_js, encoding="utf-8")

    # --- Patch index.html
    links = "\n".join(
        [
            '<link rel="stylesheet" href="css/variables.css">',
            '<link rel="stylesheet" href="css/hero.css">',
            '<link rel="stylesheet" href="css/stats.css">',
            '<link rel="stylesheet" href="css/cards.css">',
            '<link rel="stylesheet" href="css/resume.css">',
            '<link rel="stylesheet" href="css/responsive.css">',
            '<link rel="stylesheet" href="css/bio.css">',
            '<link rel="stylesheet" href="css/modal.css">',
            '<link rel="stylesheet" href="css/works-canvas.css">',
        ]
    )

    nl = r"\r?\n"

    new_html, n = re.subn(
        rf"<style>[\s\S]*?</style>{nl}",
        links + "\n",
        text,
        count=1,
    )
    if n != 1:
        raise SystemExit(f"expected 1 style replace, got {n}")

    st_url = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"
    # Blank line between main bundle </script> and importmap (see index around line 1559–1561)
    main_pat = (
        "("
        + re.escape(f'<script src="{st_url}"></script>')
        + nl
        + ")"
        + r"<script>[\s\S]*?</script>"
        + r"(?:\r?\n)+"
        + r'(<script type="importmap">)'
    )
    new_html, n = re.subn(
        main_pat,
        r'\1<script src="js/app-main.js"></script>\n\2',
        new_html,
        count=1,
    )
    if n != 1:
        raise SystemExit(f"expected 1 main script replace, got {n}")

    new_html, n = re.subn(
        r'<script type="module">[\s\S]*?</script>(?:\r?\n)+',
        '<script type="module" src="js/three-sphere.js"></script>\n\n',
        new_html,
        count=1,
    )
    if n != 1:
        raise SystemExit(f"expected 1 module replace, got {n}")

    new_html, n = re.subn(
        r"<script>(?:\r?\n)/\* ═══ BIO WORD-REVEAL[\s\S]*?</script>(?:\r?\n)+(?=</body>)",
        '<script src="js/bio-email-footer.js"></script>\n',
        new_html,
        count=1,
    )
    if n != 1:
        raise SystemExit(f"expected 1 bio script replace, got {n}")

    INDEX.write_text(new_html, encoding="utf-8")
    print("Wrote CSS chunks, js/app-main.js, js/three-sphere.js, js/bio-email-footer.js, patched index.html")


if __name__ == "__main__":
    main()
