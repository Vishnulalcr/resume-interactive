# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(r"c:\Users\crvis\OneDrive\Pictures\Desktop\_Resume Interactive")
INDEX = ROOT / "index_v7.html"

OLD_LIGHTS = """// ─── LIGHTS ──────────────────────────────────────────────────────────────────
/* Full lighting rig — all lights on, bright readable sphere */
const keyLight = new THREE.PointLight(0xfff4e0, 55, 30);
keyLight.position.set(3.5, 4, 5);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0xd0e8ff, 42, 26);
fillLight.position.set(-4, 2, 4);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xffffff, 52, 30);
rimLight.position.set(0, 1.5, -5);
scene.add(rimLight);

const topFill = new THREE.PointLight(0xffffff, 32, 22);
topFill.position.set(0, 4, 3);
scene.add(topFill);

const backRim = new THREE.PointLight(0xe8e0ff, 38, 26);
backRim.position.set(0, -1, -6);
scene.add(backRim);

scene.add(new THREE.AmbientLight(0x404040, 1.4));
"""

NEW_LIGHTS = """// ─── LIGHTS ──────────────────────────────────────────────────────────────────
/* 3-point lighting — key, fill, rim */
const keyLight = new THREE.PointLight(0xfff4e0, 55, 30);
keyLight.position.set(3.5, 4, 5);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0xd0e8ff, 42, 26);
fillLight.position.set(-4, 2, 4);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xffffff, 52, 30);
rimLight.position.set(0, 1.5, -5);
scene.add(rimLight);

scene.add(new THREE.AmbientLight(0x303030, 1.05));
"""

NEW_HDRI = """const EXR_URL = 'assets/105_hdrmaps_com_free_1K.exr';
new EXRLoader().load(EXR_URL, (tex) => {
  tex.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = pmrem.fromEquirectangular(tex).texture;
  scene.environmentIntensity = 0.5;
  tex.dispose();
  pmrem.dispose();
});
"""

def main():
    text = INDEX.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines(keepends=True)

    if len(lines) < 940:
        raise SystemExit("unexpected line count")

    # Drop embedded EXR line + blob loader; splice new HDRI block after line 931 (index 930 inclusive = first 931 lines)
    prefix = "".join(lines[:931])
    suffix = "".join(lines[938:])

    merged = prefix + NEW_HDRI + "\n" + suffix

    if OLD_LIGHTS not in merged:
        raise SystemExit("OLD_LIGHTS block not found")
    merged = merged.replace(OLD_LIGHTS, NEW_LIGHTS, 1)

    INDEX.write_text(merged, encoding="utf-8", newline="\n")
    print("patched", INDEX, "size", len(merged))


if __name__ == "__main__":
    main()
