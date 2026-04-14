<script type="module">
import * as THREE from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

// ─── ASSETS ──────────────────────────────────────────────────────────────────
const CURSOR_GIFS = [
  "assets/cursors/cursor_0.gif",
  "assets/cursors/cursor_1.gif",
  "assets/cursors/cursor_2.gif",
  "assets/cursors/cursor_3.gif",
  "assets/cursors/cursor_4.gif",
  "assets/cursors/cursor_5.gif",
  "assets/cursors/cursor_6.gif",
  "assets/cursors/cursor_7.gif",
  "assets/cursors/cursor_8.gif"
]

const STICKER_SRCS = [
  "assets/stickers/sticker_0.webp",
  "assets/stickers/sticker_1.webp",
  "assets/stickers/sticker_2.webp",
  "assets/stickers/sticker_3.webp",
  "assets/stickers/sticker_4.webp",
  "assets/stickers/sticker_5.webp",
  "assets/stickers/sticker_6.webp",
  "assets/stickers/sticker_7.webp",
  "assets/stickers/sticker_8.webp",
  "assets/stickers/sticker_9.webp",
  "assets/stickers/sticker_10.webp",
  "assets/stickers/sticker_11.webp",
  "assets/stickers/sticker_12.webp",
  "assets/stickers/sticker_13.webp",
  "assets/stickers/sticker_14.webp",
  "assets/stickers/sticker_15.webp"
]

const WRINKLE_SRC = "assets/stickers/wrinkle.webp";

// ─── RENDERER ────────────────────────────────────────────────────────────────
const canvas = document.getElementById('sphere-canvas');
const sphereVisualEl = document.getElementById('sphere-visual');
const W = () => window.innerWidth;
const H = () => window.innerHeight;

function getCanvasViewportSize() {
  const el = sphereVisualEl || canvas;
  const r = el.getBoundingClientRect();
  return { w: Math.max(1, Math.floor(r.width)), h: Math.max(1, Math.floor(r.height)) };
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 3.8;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 0, 5.5);

function updateRendererSize() {
  const { w, h } = getCanvasViewportSize();
  camera.aspect = w / h;
  /* Portrait / narrow viewports: wider FOV + slightly farther camera so the sphere
     is not cropped on the left/right (horizontal frustum is tighter when aspect < 1). */
  if (w <= 768) {
    camera.fov = 50;
    camera.position.z = 6.15;
  } else {
    camera.fov = 42;
    camera.position.z = 5.5;
  }
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
updateRendererSize();
requestAnimationFrame(updateRendererSize);

// ─── HDRI ────────────────────────────────────────────────────────────────────
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const EXR_URL = 'assets/105_hdrmaps_com_free_1K.exr';
new EXRLoader().load(EXR_URL, (tex) => {
  tex.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = pmrem.fromEquirectangular(tex).texture;
  scene.environmentIntensity = 0.3;
  tex.dispose();
  pmrem.dispose();
});


// ─── LIGHTS ──────────────────────────────────────────────────────────────────
/* 3-point directional rig; ambient kept low so key/fill/rim shape the sphere */
const keyLight = new THREE.DirectionalLight(0xfff4e8, 2.35);
keyLight.position.set(5.8, 8.2, 5.5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xc8d8ff, 1.15);
fillLight.position.set(-6.5, 4, 4.5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 1.55);
rimLight.position.set(0, 3, -7.5);
scene.add(rimLight);

scene.add(new THREE.AmbientLight(0x252830, 0.075));

// ─── SPHERE GEOMETRY ─────────────────────────────────────────────────────────
const SPHERE_RADIUS = 1.188;
const SEG = 96; // segments — balanced between quality and perf
const sphereGeo = new THREE.SphereGeometry(SPHERE_RADIUS, SEG, SEG);
const posAttr = sphereGeo.attributes.position;
const uvAttr  = sphereGeo.attributes.uv;
const idxAttr = sphereGeo.index;

// Store original (theta, phi) for each vertex so we can identify it on the sphere
// and compute the deform displacement at any time
const vertCount = posAttr.count;
const origTheta = new Float32Array(vertCount); // longitude
const origPhi   = new Float32Array(vertCount); // latitude
const origNX    = new Float32Array(vertCount);
const origNY    = new Float32Array(vertCount);
const origNZ    = new Float32Array(vertCount);

for (let i = 0; i < vertCount; i++) {
  const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
  const len = Math.sqrt(x*x + y*y + z*z);
  origNX[i] = x/len; origNY[i] = y/len; origNZ[i] = z/len;
  origTheta[i] = Math.atan2(z, x);
  origPhi[i]   = Math.acos(Math.max(-1, Math.min(1, y/len)));
}

// ─── GLASS SPHERE SHADER ─────────────────────────────────────────────────────
// B&W glass with: rough top highlight, noise gradient, dot grid, Fresnel rim

// ─── SPHERE MATERIAL — matte black, 60% roughness, clean ────────────────────
// Procedural noise bump for base sphere surface
const noiseCanvas = document.createElement('canvas');
noiseCanvas.width = noiseCanvas.height = 512;
const nctx = noiseCanvas.getContext('2d');
const nImg = nctx.createImageData(512, 512);
for (let i = 0; i < nImg.data.length; i += 4) {
  const v = 96 + Math.random() * 160;
  nImg.data[i] = nImg.data[i + 1] = nImg.data[i + 2] = v;
  nImg.data[i + 3] = 255;
}
nctx.putImageData(nImg, 0, 0);
const noiseTex = new THREE.CanvasTexture(noiseCanvas);
noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping;
noiseTex.repeat.set(4, 4);

const sphereMat = new THREE.MeshStandardMaterial({
  color: 0x080808,
  roughness: 0.60,
  metalness: 0.0,
  envMapIntensity: 1.25,
  bumpMap: noiseTex,
  bumpScale: 0.015,
});

const sphere = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(sphere);

// Dummy back mesh no longer needed — just a plain MeshStandardMaterial
// sphereBack removed entirely

// ─── INTERIOR PARTICLES — 4x count, glowing types ────────────────────────────
const PARTICLE_COUNT = 720; // 4x original 180
const pPositions  = new Float32Array(PARTICLE_COUNT * 3);
const pVelocities = [];
const pPhases     = new Float32Array(PARTICLE_COUNT);
const pSizes      = new Float32Array(PARTICLE_COUNT);
const pGlow       = new Uint8Array(PARTICLE_COUNT); // 1 = glowing particle

// Particles orbit around the sphere surface
// Each particle stores its spherical coords (theta, phi) and orbit radius
// so they slide around the surface rather than float inside

const pTheta  = new Float32Array(PARTICLE_COUNT); // azimuth orbit angle
const pPhi    = new Float32Array(PARTICLE_COUNT); // elevation orbit angle
const pOrbitR = new Float32Array(PARTICLE_COUNT); // orbit radius (just above surface)
const pSpeed  = new Float32Array(PARTICLE_COUNT); // orbit speed

for (let i = 0; i < PARTICLE_COUNT; i++) {
  // Random start position on sphere surface
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(2 * Math.random() - 1);
  pTheta[i] = theta;
  pPhi[i]   = phi;

  // Orbit radius: just outside sphere surface + slight variation
  pOrbitR[i] = SPHERE_RADIUS * (1.02 + Math.random() * 0.12);

  // Position on sphere surface
  const r = pOrbitR[i];
  pPositions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
  pPositions[i*3+1] = r * Math.cos(phi);
  pPositions[i*3+2] = r * Math.sin(phi) * Math.sin(theta);

  // Orbit direction velocity (angular)
  pVelocities.push(new THREE.Vector3(
    (Math.random() - 0.5) * 0.000003, // dTheta per frame — slow drift
    (Math.random() - 0.5) * 0.000002, // dPhi per frame
    0
  ));
  pPhases[i] = Math.random() * Math.PI * 2;

  // ~20% glowing
  pGlow[i] = Math.random() < 0.2 ? 1 : 0;
  pSizes[i] = pGlow[i] ? (0.018 + Math.random() * 0.012) : (0.006 + Math.random() * 0.005);
}

// Two particle systems: regular + glowing
// Regular — small white dots
const regCount = PARTICLE_COUNT - Math.floor(PARTICLE_COUNT * 0.2);
const glowCount = Math.floor(PARTICLE_COUNT * 0.2);

const particleGeo = new THREE.BufferGeometry();
const pPosAttr = new THREE.BufferAttribute(pPositions, 3);
particleGeo.setAttribute('position', pPosAttr);

// Custom shader for size-per-particle variation
const PARTICLE_VERT = `
  attribute float aSize;
  attribute float aGlow;
  varying float vGlow;
  uniform float uTime;

  void main() {
    vGlow = aGlow;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    // Glow particles pulse in size
    float pulse = aGlow > 0.5 ? (1.0 + sin(uTime * 2.0 + position.x * 5.0) * 0.4) : 1.0;
    gl_PointSize = aSize * pulse * (300.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const PARTICLE_FRAG = `
  varying float vGlow;
  uniform float uTime;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;

    // Soft disc
    float alpha = 1.0 - smoothstep(0.2, 0.5, r);

    if (vGlow > 0.5) {
      // Glowing: bright white center, soft halo
      float core = 1.0 - smoothstep(0.0, 0.2, r);
      vec3 col = mix(vec3(0.7, 0.85, 1.0), vec3(1.0), core);
      gl_FragColor = vec4(col, alpha * 0.9);
    } else {
      // Regular: subtle white
      gl_FragColor = vec4(vec3(0.8, 0.9, 1.0), alpha * 0.45);
    }
  }
`;

const aSizeAttr = new THREE.BufferAttribute(pSizes, 1);
const aGlowAttr = new THREE.BufferAttribute(new Float32Array(pGlow), 1);
particleGeo.setAttribute('aSize', aSizeAttr);
particleGeo.setAttribute('aGlow', aGlowAttr);

const particleMat = new THREE.ShaderMaterial({
  vertexShader:   PARTICLE_VERT,
  fragmentShader: PARTICLE_FRAG,
  uniforms: { uTime: { value: 0 } },
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const particles = new THREE.Points(particleGeo, particleMat);
sphere.add(particles);

let particleImpulse = new THREE.Vector3(0, 0, 0);
let particleImpulseStrength = 0;

// ─── PARTICLE UPDATE — orbital surface motion ────────────────────────────────
function updateParticles(time, impStrength) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const phase = pPhases[i];
    const isGlow = pGlow[i] === 1;

    // Advance theta and phi — particles orbit surface
    // Slow sinusoidal drift creates natural flowing paths
    pTheta[i] += pVelocities[i].x * (1.0 + Math.sin(time * 0.02 + phase) * 0.0006);
    pPhi[i]   += pVelocities[i].y * (1.0 + Math.cos(time * 0.018 + phase) * 0.0004);

    // Keep phi in valid range [0.05, PI-0.05]
    if (pPhi[i] < 0.05) { pPhi[i] = 0.05; pVelocities[i].y *= -1; }
    if (pPhi[i] > Math.PI - 0.05) { pPhi[i] = Math.PI - 0.05; pVelocities[i].y *= -1; }

    // Touch impulse — perturb angular velocity
    if (impStrength > 0.01) {
      pVelocities[i].x += (Math.random() - 0.5) * impStrength * 0.006;
      pVelocities[i].y += (Math.random() - 0.5) * impStrength * 0.004;
    }

    // Glow particles orbit slightly further and drift orbit radius
    const orbitPulse = isGlow
      ? pOrbitR[i] + Math.sin(time * 0.8 + phase) * 0.04
      : pOrbitR[i] + Math.sin(time * 0.5 + phase) * 0.02;

    const sinPhi = Math.sin(pPhi[i]);
    const cosPhi = Math.cos(pPhi[i]);
    const sinTheta = Math.sin(pTheta[i]);
    const cosTheta = Math.cos(pTheta[i]);

    pPositions[i*3]   = orbitPulse * sinPhi * cosTheta;
    pPositions[i*3+1] = orbitPulse * cosPhi;
    pPositions[i*3+2] = orbitPulse * sinPhi * sinTheta;
  }

  pPosAttr.needsUpdate = true;
  particleMat.uniforms.uTime.value = time;
}

// ─── DEFORMATION ─────────────────────────────────────────────────────────────
let deformStrength = 0;
const deformDecay = 0.94;
let blobTime = 0;
let clickImpulse = { x: 0, y: 0 };
let rotVel = { x: 0, y: 0.003 };

// Compute displacement for a vertex normal at a given time
// Returns the radius (not displacement) — same formula used in deformSphere
function getRadius(nx, ny, nz, time, strength) {
  // Idle blob — increased ~50% from original
  const idle =
    Math.sin(nx * 3.2 + time * 0.8) * 0.027 +
    Math.sin(ny * 2.8 + time * 1.1) * 0.023 +
    Math.sin(nz * 3.5 + time * 0.6) * 0.018 +
    Math.sin((nx+ny) * 2.0 + time * 0.9) * 0.015;
  // Click impact — increased ~50% from original
  let click = 0;
  if (strength > 0.005) {
    const dot = nx * clickImpulse.x + ny * clickImpulse.y;
    click = Math.sin(dot * Math.PI * 3 - time * 8) * Math.max(0, dot) * strength * 0.24;
  }
  return SPHERE_RADIUS + idle + click;
}

function deformSphere(time, strength) {
  for (let i = 0; i < vertCount; i++) {
    const nx = origNX[i], ny = origNY[i], nz = origNZ[i];
    const r = getRadius(nx, ny, nz, time, strength);
    posAttr.setXYZ(i, nx*r, ny*r, nz*r);
  }
  posAttr.needsUpdate = true;
  sphereGeo.computeVertexNormals();
}

// ─── STICKER SYSTEM ──────────────────────────────────────────────────────────

const textureLoader = new THREE.TextureLoader();
const stickerTextures = STICKER_SRCS.map(src => {
  const t = textureLoader.load(src);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
});

// Wrinkle texture — bump map on all stickers, covers full UV 0-1
const wrinkleTex = textureLoader.load(WRINKLE_SRC);
wrinkleTex.wrapS = wrinkleTex.wrapT = THREE.ClampToEdgeWrapping;
wrinkleTex.repeat.set(1, 1); // covers full sticker exactly

// Normal map generation removed


// Normal maps removed — using bump map only

// ── Material variant system ───────────────────────────────────────────────
const MATERIAL_TYPES = [
  'matte',
  'iridescent',
  'glossy',
  'pearlescent',
  'metallic_rough',
  'iridescent',
  'metallic_clean',
  'pearlescent',
  'transparent',
  'iridescent',
  'glossy',
  'pearlescent',
];

// ── Iridescent / Pearlescent ShaderMaterial ───────────────────────────────
// Full custom GLSL: Fresnel angle → spectral ramp lookup → color shift
// Wrinkle texture used as normal map to perturb N before Fresnel dot product
// so folds catch different hues even on a flat surface

const IRIDESENT_VERT = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying vec2 vUv2;

  void main() {
    vUv = uv;
    vUv2 = uv; // full sticker coverage for wrinkle map
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const IRIDESCENT_FRAG = `
  uniform sampler2D stickerMap;
  uniform sampler2D wrinkleNormal;
  uniform sampler2D spectralRamp;
  uniform float uTime;
  uniform float uStrength;   // iridescent intensity
  uniform float uShift;      // per-sticker hue offset
  uniform bool uPearl;       // pearl mode = softer, whiter

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying vec2 vUv2;

  // Unpack normal map sample to [-1,1]
  vec3 unpackNormal(vec4 s) {
    return normalize(vec3(s.rg * 2.0 - 1.0, s.b));
  }

  // Spectral rainbow from t in [0,1]
  vec3 spectral(float t) {
    // 6-stop rainbow: red→yellow→green→cyan→blue→magenta
    t = fract(t);
    vec3 c;
    if      (t < 0.1667) c = mix(vec3(1,0,0),   vec3(1,1,0),   t/0.1667);
    else if (t < 0.3333) c = mix(vec3(1,1,0),   vec3(0,1,0),   (t-0.1667)/0.1667);
    else if (t < 0.5000) c = mix(vec3(0,1,0),   vec3(0,1,1),   (t-0.3333)/0.1667);
    else if (t < 0.6667) c = mix(vec3(0,1,1),   vec3(0,0,1),   (t-0.5000)/0.1667);
    else if (t < 0.8333) c = mix(vec3(0,0,1),   vec3(1,0,1),   (t-0.6667)/0.1667);
    else                 c = mix(vec3(1,0,1),   vec3(1,0,0),   (t-0.8333)/0.1667);
    return c;
  }

  void main() {
    // Sample sticker texture for color + alpha
    vec4 stickerColor = texture2D(stickerMap, vUv);
    if (stickerColor.a < 0.05) discard;

    // Sample wrinkle normal map and perturb surface normal
    vec4 wrinkleSample = texture2D(wrinkleNormal, vUv2);
    vec3 wrinkleN = unpackNormal(wrinkleSample);
    // Blend perturbed normal with geometry normal (TBN approximation)
    vec3 N = normalize(vNormal + vec3(wrinkleN.xy * 0.6, 0.0));

    // Fresnel: dot of view and (perturbed) normal
    float fresnel = clamp(dot(N, vViewDir), 0.0, 1.0);

    // Spectral ramp lookup — shift per sticker + slow time animation
    float rampT = fresnel + uShift + uTime * 0.08;
    vec3 iriColor = spectral(rampT);

    if (uPearl) {
      // Pearl: desaturate toward white, softer mix
      iriColor = mix(vec3(1.0), iriColor, 0.45);
      float blend = pow(1.0 - fresnel, 1.5) * uStrength;
      vec3 finalColor = mix(stickerColor.rgb, iriColor, blend * 0.7);
      // Add pearlescent sheen highlight
      float sheen = pow(fresnel, 4.0) * 1.2;
      finalColor += vec3(sheen * 0.5);
      gl_FragColor = vec4(finalColor, stickerColor.a);
    } else {
      // Iridescent: stronger, more saturated rainbow
      float blend = pow(1.0 - fresnel, 1.2) * uStrength;
      // Mix sticker graphic with spectral color
      vec3 finalColor = stickerColor.rgb * (1.0 - blend * 0.5) + iriColor * blend;
      // Add edge glow
      float rim = pow(1.0 - fresnel, 3.0);
      finalColor += iriColor * rim * 0.4;
      gl_FragColor = vec4(finalColor, stickerColor.a);
    }
  }
`;

// Build spectral ramp canvas texture (1D gradient, 256px wide)
function buildSpectralRamp() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 1;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0,    '#ff0000');
  grad.addColorStop(0.17, '#ffff00');
  grad.addColorStop(0.33, '#00ff00');
  grad.addColorStop(0.50, '#00ffff');
  grad.addColorStop(0.67, '#0000ff');
  grad.addColorStop(0.83, '#ff00ff');
  grad.addColorStop(1.0,  '#ff0000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 1);
  return new THREE.CanvasTexture(c);
}
const spectralRampTex = buildSpectralRamp();

// Wrinkle normal map version (convert wrinkleTex to a normal map)
const wrinkleNormalTex = wrinkleTex.clone();
wrinkleNormalTex.needsUpdate = true;

function buildIridescentMaterial(texIndex, isPearl) {
  const uShift = Math.random(); // unique hue offset per sticker
  const mat = new THREE.ShaderMaterial({
    vertexShader: IRIDESENT_VERT,
    fragmentShader: IRIDESCENT_FRAG,
    uniforms: {
      stickerMap:   { value: stickerTextures[texIndex] },
      wrinkleNormal:{ value: wrinkleNormalTex },
      spectralRamp: { value: spectralRampTex },
      uTime:        { value: 0.0 },
      uStrength:    { value: isPearl ? 0.7 : 1.1 },
      uShift:       { value: uShift },
      uPearl:       { value: isPearl },
    },
    transparent: true,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    side: THREE.FrontSide,
  });
  return mat;
}

// Track iridescent shader materials for time uniform update
const iridescentMaterials = [];

function buildStickerMaterial(texIndex, matType, useWrinkle) {
  // Iridescent and pearlescent use custom ShaderMaterial
  if (matType === 'iridescent') {
    const m = buildIridescentMaterial(texIndex, false);
    iridescentMaterials.push(m);
    return m;
  }
  if (matType === 'pearlescent') {
    const m = buildIridescentMaterial(texIndex, true);
    iridescentMaterials.push(m);
    return m;
  }

  const base = {
    map: stickerTextures[texIndex],
    transparent: true,
    alphaTest: matType === 'transparent' ? 0.01 : 0.05,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    side: THREE.FrontSide,
  };

  if (useWrinkle) {
    base.bumpMap = wrinkleTex;
    base.bumpScale = 0.8;
  }

  switch (matType) {
    case 'matte':
      return new THREE.MeshStandardMaterial({ ...base, roughness: 0.95, metalness: 0.0, envMapIntensity: 0.6 });
    case 'glossy':
      return new THREE.MeshStandardMaterial({ ...base, roughness: 0.35, metalness: 0.05, envMapIntensity: 2.5 });
    case 'metallic_rough':
      return new THREE.MeshStandardMaterial({ ...base, roughness: 0.94, metalness: 0.9, envMapIntensity: 3.0 });
    case 'metallic_clean':
      return new THREE.MeshStandardMaterial({ ...base, roughness: 0.28, metalness: 1.0, envMapIntensity: 3.5 });
    case 'transparent':
      return new THREE.MeshStandardMaterial({
        ...base, roughness: 0.25, metalness: 0.05, envMapIntensity: 3.0,
        opacity: 0.65, alphaTest: 0.0, transparent: true,
      });
    default:
      return new THREE.MeshStandardMaterial({ ...base, roughness: 0.6, metalness: 0.0, envMapIntensity: 2.5 });
  }
}

// ── Shadow setup ──────────────────────────────────────────────────────────
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Use a dedicated SpotLight for shadow casting — SpotLight produces proper
// PCF soft shadows. PointLight shadow maps are cube maps and less reliable.
const shadowLight = new THREE.SpotLight(0xffffff, 22);
shadowLight.position.set(0, 1, -5);
shadowLight.angle = Math.PI / 5;
shadowLight.penumbra = 0.6;      // large penumbra = soft shadow edges
shadowLight.decay = 1.5;
shadowLight.distance = 25;
shadowLight.castShadow = true;
shadowLight.shadow.mapSize.width  = 2048;
shadowLight.shadow.mapSize.height = 2048;
shadowLight.shadow.camera.near = 1;
shadowLight.shadow.camera.far  = 20;
shadowLight.shadow.bias = -0.0005;
shadowLight.shadow.normalBias = 0.02;
shadowLight.target.position.set(0, 0, 0);
scene.add(shadowLight);
scene.add(shadowLight.target);

sphere.castShadow    = true;
sphere.receiveShadow = true;

// ── Triangle list ─────────────────────────────────────────────────────────
const liveStickerMeshes = [];
const MAX_DECALS = 25;

const idxArr = idxAttr.array;
const triCount = idxArr.length / 3;
const tris = [];
for (let t = 0; t < triCount; t++) {
  tris.push([idxArr[t*3], idxArr[t*3+1], idxArr[t*3+2]]);
}

function angularDist(theta1, phi1, theta2, phi2) {
  const dx = Math.sin(phi1)*Math.cos(theta1) - Math.sin(phi2)*Math.cos(theta2);
  const dy = Math.sin(phi1)*Math.sin(theta1) - Math.sin(phi2)*Math.sin(theta2);
  const dz = Math.cos(phi1) - Math.cos(phi2);
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

let stickerCounter = 0;

function createLiveSticker(hitPoint, texIndex) {
  const len = hitPoint.length();
  const nx = hitPoint.x/len, ny = hitPoint.y/len, nz = hitPoint.z/len;
  const centerTheta = Math.atan2(nz, nx);
  const centerPhi   = Math.acos(Math.max(-1, Math.min(1, ny)));

  // 50% smaller patch than before (was 0.38–0.50, now 0.19–0.25)
  const patchAngle = 0.19 + Math.random() * 0.06;

  const patchTris = [];
  const patchVerts = new Set();

  for (let t = 0; t < triCount; t++) {
    const [a, b, c] = tris[t];
    const inA = angularDist(origTheta[a], origPhi[a], centerTheta, centerPhi) < patchAngle * 1.5;
    const inB = angularDist(origTheta[b], origPhi[b], centerTheta, centerPhi) < patchAngle * 1.5;
    const inC = angularDist(origTheta[c], origPhi[c], centerTheta, centerPhi) < patchAngle * 1.5;
    if (inA || inB || inC) {
      patchTris.push([a, b, c]);
      patchVerts.add(a); patchVerts.add(b); patchVerts.add(c);
    }
  }

  if (patchTris.length === 0) return null;

  const vertMap = new Map();
  let vi = 0;
  for (const v of patchVerts) { vertMap.set(v, vi++); }
  const patchVertCount = vertMap.size;

  const patchIdx = new Uint32Array(patchTris.length * 3);
  for (let t = 0; t < patchTris.length; t++) {
    patchIdx[t*3]   = vertMap.get(patchTris[t][0]);
    patchIdx[t*3+1] = vertMap.get(patchTris[t][1]);
    patchIdx[t*3+2] = vertMap.get(patchTris[t][2]);
  }

  const centerDir = new THREE.Vector3(nx, ny, nz);
  const up = Math.abs(ny) < 0.99 ? new THREE.Vector3(0,1,0) : new THREE.Vector3(1,0,0);
  const tangentU = new THREE.Vector3().crossVectors(up, centerDir).normalize();
  const tangentV = new THREE.Vector3().crossVectors(centerDir, tangentU).normalize();

  const roll = Math.random() * Math.PI * 2;
  const cosR = Math.cos(roll), sinR = Math.sin(roll);
  const finalU = tangentU.clone().multiplyScalar(cosR).addScaledVector(tangentV,  sinR);
  const finalV = tangentU.clone().multiplyScalar(-sinR).addScaledVector(tangentV, cosR);

  const uvData = new Float32Array(patchVertCount * 2);
  for (const [sphereIdx, pi] of vertMap) {
    const vdir = new THREE.Vector3(origNX[sphereIdx], origNY[sphereIdx], origNZ[sphereIdx]);
    uvData[pi*2]   = vdir.dot(finalU) / patchAngle * 0.5 + 0.5;
    uvData[pi*2+1] = vdir.dot(finalV) / patchAngle * 0.5 + 0.5;
  }

  const posData = new Float32Array(patchVertCount * 3);

  const geo = new THREE.BufferGeometry();
  geo.setIndex(new THREE.BufferAttribute(patchIdx, 1));
  geo.setAttribute('position', new THREE.BufferAttribute(posData, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvData, 2));

  // Pick material variant — cycle through types so we get variety
  const matTypes = MATERIAL_TYPES;
  const matType = matTypes[stickerCounter % matTypes.length];
  const useWrinkle = true; // wrinkle bump on all stickers
  stickerCounter++;

  const mat = buildStickerMaterial(texIndex, matType, useWrinkle);

  // no normal map — bump only

  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 10 + liveStickerMeshes.length;
  mesh.castShadow    = true;
  mesh.receiveShadow = true;
  // depthWrite off for transparency but shadows still work via castShadow
  mesh.material.shadowSide = THREE.FrontSide;

  // iridescent tracked via iridescentMaterials

  sphere.add(mesh);

  const sticker = { mesh, geo, posAttrBuf: geo.attributes.position, vertMap, matType };
  liveStickerMeshes.push(sticker);

  if (liveStickerMeshes.length > MAX_DECALS) {
    const old = liveStickerMeshes.shift();
    sphere.remove(old.mesh);
    old.geo.dispose();
    old.mesh.material.dispose();
    // clean up shader material from iridescentMaterials if present
    const iriIdx = iridescentMaterials.indexOf(old.mesh.material);
    if (iriIdx !== -1) iridescentMaterials.splice(iriIdx, 1);
  }

  return sticker;
}

// Update all live sticker positions from current sphere vertex positions each frame
function updateStickerPositions() {
  for (const sticker of liveStickerMeshes) {
    const buf = sticker.posAttrBuf;
    for (const [sphereIdx, pi] of sticker.vertMap) {
      const x = posAttr.getX(sphereIdx);
      const y = posAttr.getY(sphereIdx);
      const z = posAttr.getZ(sphereIdx);

      // Push sticker outward along surface normal to prevent Z-fighting
      const len = Math.sqrt(x*x + y*y + z*z);
      const offsetScale = 0.015; // Small offset to prevent fighting
      const ox = (x / len) * offsetScale;
      const oy = (y / len) * offsetScale;
      const oz = (z / len) * offsetScale;

      buf.setXYZ(pi, x + ox, y + oy, z + oz);
    }
    buf.needsUpdate = true;
    sticker.geo.computeVertexNormals();
  }
}

// Update iridescent/pearlescent shader time uniforms
function updateIridescent(time) {
  for (const mat of iridescentMaterials) {
    if (mat.uniforms) mat.uniforms.uTime.value = time;
  }
}

// ─── INPUT ───────────────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isOverSphere = false;
let cursorGifIdx = 0;

const cursorEl = document.getElementById('cursor-sticker');
const wrinkleEl = document.getElementById('wrinkle-flash');
wrinkleEl.src = WRINKLE_SRC; // flash overlay img
cursorEl.src = CURSOR_GIFS[0];

// Map: cursor gif index → sticker index to place when clicked
// Sorted CURSOR_GIFS: gif0(0),gif11(1),gif12(2),gif13(3),gif16(4),gif18(5),gif4(6),gif6(7),gif9(8)
// Sorted STICKER_SRCS: sticker0(0),sticker1(1),sticker10(2),sticker11(3),sticker12(4),
//   sticker13(5),sticker14(6),sticker15(7),sticker16(8),sticker18(9),sticker2(10),
//   sticker4(11),sticker5(12),sticker6(13),sticker8(14),sticker9(15)
const GIF_TO_STICKER = [
  0,   // gif0   → sticker0
  3,   // gif11  → sticker11
  4,   // gif12  → sticker12
  5,   // gif13  → sticker13
  8,   // gif16  → sticker16
  9,   // gif18  → sticker18
  11,  // gif4   → sticker4
  13,  // gif6   → sticker6
  15,  // gif9   → sticker9
];

let cursorLerp = { x: W()/2, y: H()/2 };
let cursorTarget = { x: W()/2, y: H()/2 };

function pointerToNDC(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const rw = Math.max(1, rect.width);
  const rh = Math.max(1, rect.height);
  return {
    x: ((clientX - rect.left) / rw) * 2 - 1,
    y: -((clientY - rect.top) / rh) * 2 + 1
  };
}

// ═══════════════════════════════════════════════════════════════════════
// INPUT & INTERACTION — fully self-contained in this module.
// All shared state lives on window.* so other scripts can read it.
// NO disabling of ScrollTriggers — that was breaking the sphere.
// ═══════════════════════════════════════════════════════════════════════

// ─── Badge cursor helpers ───────────────────────────────────────────────
function showBadge(x, y) {
  cursorEl.style.left    = x + 'px';
  cursorEl.style.top     = y + 'px';
  cursorEl.style.opacity = '1';
  cursorEl.classList.add('visible');
}
function hideBadge() {
  cursorEl.style.opacity = '0';
  cursorEl.classList.remove('visible');
}

// ─── UI dim helpers — simple CSS opacity, no ScrollTrigger touching ────
const _dimEls = ['#stats', '#text-block', '#cards-wrap', '#bio-section'];
function setUIOpacity(val) {
  _dimEls.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.style.transition = 'opacity 0.3s ease';
    el.style.opacity    = val;
  });
}

// ─── Mobile interactive mode ────────────────────────────────────────────
window._mobileActive = false;

function enterMobileMode(tapX, tapY) {
  if (window._mobileActive) return;
  window._mobileActive = true;
  showBadge(tapX, tapY);
  cursorLerp.x = tapX;
  cursorLerp.y = tapY;
  setUIOpacity('0.4');
  if (window.haptics) {
    window.haptics.light();
    setTimeout(() => { if (window.haptics) window.haptics.heavy(); }, 100);
  }
}

function exitMobileMode() {
  if (!window._mobileActive) return;
  window._mobileActive = false;
  hideBadge();
  setUIOpacity('1');
  if (window.haptics) window.haptics.light();
}

// ─── Scroll → kill badge + reset pinch scale ───────────────────────────
let _scrollExitTimer;
window.addEventListener('scroll', () => {
  // 1. Always hide badge the instant scroll begins
  hideBadge();

  // 2. Smoothly snap pinch-scale back to 1 while scrolling
  if (_pinchLiveScale !== 1.0) {
    _pinchLiveScale = 1.0;
    _pinchBaseScale = 1.0;
    _pinchActive    = false;
    _applyCanvasScale(1.0, true); // animated snap-back
  }

  clearTimeout(_scrollExitTimer);
  _scrollExitTimer = setTimeout(() => {
    // If scrolled well past hero, also exit mobile interactive mode
    if (window._mobileActive && window.scrollY > window.innerHeight * 0.4) {
      exitMobileMode();
    }
  }, 250);
}, { passive: true });

// ─── Shared: place sticker + all effects ───────────────────────────────
function placeStickerFromHit(hit, screenX, screenY) {
  const localHit = sphere.worldToLocal(hit.point.clone());
  const idx = GIF_TO_STICKER[cursorGifIdx] !== undefined
    ? GIF_TO_STICKER[cursorGifIdx]
    : cursorGifIdx % STICKER_SRCS.length;
  createLiveSticker(localHit, idx);

  cursorGifIdx = (cursorGifIdx + 1) % CURSOR_GIFS.length;
  cursorEl.src = CURSOR_GIFS[cursorGifIdx];

  deformStrength = 1.0;
  clickImpulse.x = hit.point.x / SPHERE_RADIUS;
  clickImpulse.y = hit.point.y / SPHERE_RADIUS;

  particleImpulse.copy(sphere.worldToLocal(hit.point.clone()));
  particleImpulseStrength = 1.0;

  rotVel.x += (Math.random() - 0.5) * 0.04;
  rotVel.y += (Math.random() - 0.5) * 0.04;

  cursorEl.classList.add('clicking');
  setTimeout(() => cursorEl.classList.remove('clicking'), 150);

  wrinkleEl.style.left = screenX + 'px';
  wrinkleEl.style.top  = screenY + 'px';
  setTimeout(() => { wrinkleEl.style.opacity = '0'; }, 200);

  spawnSparkles(screenX, screenY);
  if (window.haptics) window.haptics.success();
}

// ─── Desktop: badge follows mouse over sphere ───────────────────────────
window.addEventListener('mousemove', (e) => {
  if (window.innerWidth <= 768) return; // touch handles mobile
  cursorTarget.x = e.clientX;
  cursorTarget.y = e.clientY;
  if (!window._sphereVisible || window._sphereWebglSuspended) { hideBadge(); return; }
  const ndc = pointerToNDC(e.clientX, e.clientY);
  mouse.x = ndc.x; mouse.y = ndc.y;
  raycaster.setFromCamera(mouse, camera);
  isOverSphere = raycaster.intersectObject(sphere).length > 0;
  isOverSphere ? showBadge(e.clientX, e.clientY) : hideBadge();
});
window.addEventListener('mouseleave', () => { isOverSphere = false; hideBadge(); });

// Desktop: click sphere to place sticker
let clickThrottle = false;
window.addEventListener('click', (e) => {
  if (window.innerWidth <= 768) return; // touch handles mobile
  if (clickThrottle) return;
  if (!window._sphereVisible || window._sphereWebglSuspended) return;
  const ndc = pointerToNDC(e.clientX, e.clientY);
  mouse.x = ndc.x; mouse.y = ndc.y;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(sphere);
  if (!hits.length) return;
  placeStickerFromHit(hits[0], e.clientX, e.clientY);
  clickThrottle = true;
  setTimeout(() => { clickThrottle = false; }, 130);
});

// ─── Mobile: tap + pinch-to-scale on the sphere canvas ─────────────────
//
// 1-finger tap  → enter interactive mode / place sticker
// 2-finger pinch → scale sphere canvas (independent of ScrollTrigger)
// Scroll         → snap canvas back to scale(1)
// ────────────────────────────────────────────────────────────────────────

// Canvas always scales from its own center
canvas.style.transformOrigin = '50% 50%';

// ── Pinch state ──────────────────────────────────────────────────────────
let _pinchActive    = false;
let _pinchStartDist = 0;
let _pinchBaseScale = 1.0;  // scale at the moment pinch started
let _pinchLiveScale = 1.0;  // current persisted scale

const PINCH_MIN = 0.55;
const PINCH_MAX = 2.0;

function _pinchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function _applyCanvasScale(s, animate) {
  canvas.style.transition = animate
    ? 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)'
    : 'none';
  canvas.style.transform = 'scale(' + s + ')';
}

// ── Tap state ─────────────────────────────────────────────────────────────
let _touchOrigin = null;

// ── touchstart: wire up both tap and pinch ────────────────────────────────
canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    // Single finger → record potential tap origin
    if (!_pinchActive) {
      _touchOrigin = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        t: Date.now()
      };
    }
  } else if (e.touches.length === 2) {
    // Two fingers → start pinch; cancel any pending tap
    _touchOrigin   = null;
    _pinchActive   = true;
    _pinchStartDist = _pinchDist(e.touches);
    _pinchBaseScale = _pinchLiveScale;
    _applyCanvasScale(_pinchLiveScale, false); // lock in current, no transition
    if (window.haptics) window.haptics.light();
  }
}, { passive: true });

// ── touchmove: update live pinch scale ───────────────────────────────────
canvas.addEventListener('touchmove', (e) => {
  if (!_pinchActive || e.touches.length < 2) return;
  const dist     = _pinchDist(e.touches);
  const raw      = _pinchBaseScale * (dist / _pinchStartDist);
  const clamped  = Math.max(PINCH_MIN, Math.min(PINCH_MAX, raw));
  // Fire boundary haptic when clamped against min or max limit
  if (Math.abs(raw - clamped) > 0.02 && clamped !== _pinchLiveScale) {
    if (window.haptics) window.haptics.light();
  }
  _pinchLiveScale = clamped;
  _applyCanvasScale(_pinchLiveScale, false);
}, { passive: true });

// ── touchend: end pinch OR fire tap ──────────────────────────────────────
canvas.addEventListener('touchend', (e) => {
  // If a finger lifts and fewer than 2 remain, pinch is over
  if (_pinchActive && e.touches.length < 2) {
    _pinchActive = false;
    // Keep _pinchLiveScale as-is — sphere stays at this scale
    return;
  }

  // Single-finger tap evaluation
  if (_pinchActive) return; // still pinching with other finger
  if (!_touchOrigin || !e.changedTouches.length) return;

  const t  = e.changedTouches[0];
  const dx = t.clientX - _touchOrigin.x;
  const dy = t.clientY - _touchOrigin.y;
  const dt = Date.now() - _touchOrigin.t;
  _touchOrigin = null;

  // Reject swipes / long-presses — only clean taps
  if (Math.sqrt(dx * dx + dy * dy) > 12 || dt > 450) return;

  if (!window._mobileActive) {
    enterMobileMode(t.clientX, t.clientY);
    return;
  }

  // Place sticker at tap point
  const ndc = pointerToNDC(t.clientX, t.clientY);
  mouse.x = ndc.x; mouse.y = ndc.y;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(sphere);
  if (hits.length) {
    placeStickerFromHit(hits[0], t.clientX, t.clientY);
    showBadge(t.clientX, t.clientY);
  }
}, { passive: true });

// Tap outside sphere canvas → exit interactive mode
document.addEventListener('touchend', (e) => {
  if (!window._mobileActive) return;
  if (!e.changedTouches.length) return;
  const t    = e.changedTouches[0];
  const rect = canvas.getBoundingClientRect();
  const outside = t.clientX < rect.left || t.clientX > rect.right ||
                  t.clientY < rect.top  || t.clientY > rect.bottom;
  if (outside) exitMobileMode();
}, { passive: true });

// ─── SPARKLES ────────────────────────────────────────────────────────────────
const SPARKS = ['✦', '✧', '⋆', '✸', '✺', '+', '×'];
function spawnSparkles(cx, cy) {
  const n = 7 + Math.floor(Math.random() * 5);
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span');
    el.className = 'sparkle';
    el.style.fontSize = `${22 + Math.random() * 16}px`;
    el.textContent = SPARKS[Math.floor(Math.random() * SPARKS.length)];
    const angle = (Math.PI * 2 * i / n) + Math.random() * 0.5;
    const dist = 70 + Math.random() * 100;
    el.style.cssText = `left:${cx}px;top:${cy}px;color:hsl(${20+Math.random()*40},100%,${60+Math.random()*30}%);animation-delay:${Math.random()*0.08}s`;
    el.style.setProperty('--tx', `${Math.cos(angle)*dist}px`);
    el.style.setProperty('--ty', `${Math.sin(angle)*dist}px`);
    el.style.setProperty('--rot', `${(Math.random()-0.5)*360}deg`);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }
}

// ─── ANIMATE ─────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  /* Hero scrub past ~50%: skip deform, particles, and draw; drain clock so resume has no spike */
  if (window._sphereWebglSuspended === true) {
    clock.getDelta();
    return;
  }

  const delta = clock.getDelta();
  blobTime += delta;

  deformStrength *= deformDecay;
  if (deformStrength < 0.001) deformStrength = 0;

  // 1. Deform sphere vertices
  deformSphere(blobTime, deformStrength);

  // 2. Update all sticker positions from the now-deformed sphere vertices
  updateStickerPositions();

  // 3. Animate iridescent sticker color shift
  updateIridescent(blobTime);

  // 3. Rotate sphere (children rotate with it)
  rotVel.x *= 0.97;
  rotVel.y = THREE.MathUtils.lerp(rotVel.y, 0.003, 0.02);
  sphere.rotation.x += rotVel.x;
  sphere.rotation.y += rotVel.y;


  // 6. Update interior particles
  particleImpulseStrength *= 0.92;
  updateParticles(blobTime, particleImpulseStrength);

  // 4. Desktop badge lerp — only runs on non-touch viewports when visible
  if (window.innerWidth > 768 && cursorEl.classList.contains('visible')) {
    cursorLerp.x += (cursorTarget.x - cursorLerp.x) * 0.14;
    cursorLerp.y += (cursorTarget.y - cursorLerp.y) * 0.14;
    cursorEl.style.left = cursorLerp.x + 'px';
    cursorEl.style.top  = cursorLerp.y + 'px';
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  updateRendererSize();
});

animate();
</script>
