/**
 * WANDERCRAFT — Interactive Voxel Globe
 *
 * A bright Minecraft-style blocky Earth rendered with Three.js. Two instances
 * exist: the big interactive one in the hero, and a small auto-rotating one
 * in the About section.
 *
 * Coordinate convention: see js/utils/geo.js.
 *
 * THREE is loaded as a global from a CDN <script> in index.html. We don't
 * import it as a module because there's no bundler in this project; pulling
 * in three.module.js from a CDN works but doubles the network request count
 * for no real benefit at this scale.
 */

import { latLonToCartesian } from './utils/geo.js';
// isLandPoint was used by the previous spherical globe to bias biome
// distribution by continent bounding box. The cube uses face-aware
// biome rules instead, so isLandPoint is no longer needed here. It
// stays in utils/geo.js for any future spherical use.
import { GLOBE_PINS } from './data/globePins.js';
import { prefersReducedMotion } from './utils/dom.js';

/* ============================================================
   CONFIG — every magic number in the file lives here.
   Tune visuals from this block instead of hunting through code.
   ============================================================ */
const GLOBE_CONFIG = {
  // Camera
  fov: 45,                 // degrees; lower = more zoom
  cameraZ: { hero: 8.5, mini: 8 },

  // Canvas size (ceiling on width to avoid huge canvases on wide displays)
  maxSize: { hero: 750, mini: 400 },

  // Globe geometry — `radius` is the cube's half-edge length.
  // Smaller values shrink the on-screen size proportionally and also
  // reduce voxel count (the per-face grid is sized from 2*radius/cubeSize).
  radius: { hero: 1.6, mini: 1.3 },
  cubeSize: { hero: 0.22, mini: 0.25 },
  cubeStepFactor: 1.02,    // slightly > 1 prevents z-fighting between cubes

  // Lighting
  ambientIntensity: 0.6,
  sunIntensity: 1.0,
  fillIntensity: 0.3,
  topIntensity: 0.2,

  // Animation
  autoRotateSpeed: 0.002,        // radians per frame
  damping: 0.95,                 // velocity carryover from drag
  dragSensitivity: 0.003,        // pointer pixel → radians
  cloudBaseSpeed: 0.0003,        // radians per frame
  cloudSpeedRange: 0.0005,       // randomized addition per cloud
  oceanShimmerOpacityMin: 0.7,   // ocean cubes pulse between min and 1.0
  oceanShimmerStride: 3,         // shimmer every Nth ocean cube (perf)
  starsRotationSpeed: 0.0001,

  // Pin visibility
  pinFrontDotThreshold: 0.05,    // pin must face camera by at least this dot product

  // Polar / climate bands (radians of latitude)
  polarLat: 1.2,
  arcticLat: 0.9,
  borealLat: 0.7,
  desertBeltLat: 0.25,
  desertChance: 0.4,
  mountainElevationChance: 0.15,
};

const PALETTE = {
  grass:      [0x5ABF2A, 0x6AD633, 0x4DA824, 0x78E63E, 0x3D9E1B],
  darkGrass:  [0x3B8C1A, 0x2E7A12, 0x4A9E22],
  ocean:      [0x29C5E8, 0x22B8DB, 0x3ED4F0, 0x1AADCF],
  deepOcean:  [0x1B96B8, 0x1688AA, 0x2099BB],
  ice:        [0xFFFFFF, 0xF0F8FF, 0xE8F4F8, 0xDCEEF5],
  sand:       [0xE8D690, 0xDBC87A, 0xF0DE9A],
  mountain:   [0x8B8B7A, 0x9A9A86, 0x7A7A6A],
};

const pickColor = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ============================================================
   PUBLIC API
   ============================================================ */

/** Initialize both globes. Called from main.js after DOM is ready. */
export function initGlobe() {
  if (typeof THREE === 'undefined') {
    // Three.js failed to load (offline / blocked CDN). Hide the canvases
    // gracefully — the rest of the site still works.
    document.querySelectorAll('#globeCanvas, #miniGlobe').forEach((c) => {
      c.style.display = 'none';
    });
    return;
  }

  new VoxelGlobe('globeCanvas', { variant: 'hero' });

  // Mini globe is below the fold — only build it when scrolled into view.
  const miniCanvas = document.getElementById('miniGlobe');
  if (!miniCanvas) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      new VoxelGlobe('miniGlobe', { variant: 'mini' });
      observer.disconnect();
    }
  }, { threshold: 0.1 });
  observer.observe(miniCanvas);
}

/* ============================================================
   VoxelGlobe — one instance per canvas
   ============================================================ */
class VoxelGlobe {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.variant = options.variant || 'hero';
    this.isMini = this.variant === 'mini';
    this.radius = GLOBE_CONFIG.radius[this.variant];
    this.cubeSize = GLOBE_CONFIG.cubeSize[this.variant];
    this.interactive = !this.isMini;
    this.reduceMotion = prefersReducedMotion();

    // Drag state
    this.isDragging = false;
    this.prevPointer = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0, y: 0 };
    this.time = 0;

    this.initScene();
    this.buildGlobe();
    this.buildCreatorPins();
    // Clouds intentionally disabled — the white puffs orbiting the cube
    // read as visual noise next to the voxel patches. If you ever want
    // them back, uncomment the next line and `buildClouds()` will run.
    // this.buildClouds();
    this.cloudGroups = [];   // keep the array empty so tick() bails cleanly
    this.buildStars();
    this.bindResize();
    if (this.interactive) this.bindPointer();
    this.tick();
  }

  initScene() {
    const size = this.computeSize();
    this.scene = new THREE.Scene();

    // Aspect = 1 because the canvas is square. If we ever go non-square,
    // pass canvas.clientWidth / canvas.clientHeight here.
    this.camera = new THREE.PerspectiveCamera(GLOBE_CONFIG.fov, 1, 0.1, 100);
    this.camera.position.z = GLOBE_CONFIG.cameraZ[this.variant];

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(size, size);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    // Lights — a warm sun, a cool fill, a soft top, and ambient.
    this.scene.add(new THREE.AmbientLight(0xffffff, GLOBE_CONFIG.ambientIntensity));

    const sun = new THREE.DirectionalLight(0xfff5e0, GLOBE_CONFIG.sunIntensity);
    sun.position.set(5, 4, 5);
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x88ccff, GLOBE_CONFIG.fillIntensity);
    fill.position.set(-3, -1, -3);
    this.scene.add(fill);

    const top = new THREE.DirectionalLight(0xffffff, GLOBE_CONFIG.topIntensity);
    top.position.set(0, 5, 0);
    this.scene.add(top);

    this.globeGroup = new THREE.Group();
    this.globeGroup.rotation.x = 0.15;   // slight axial tilt
    this.scene.add(this.globeGroup);
  }

  computeSize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    return Math.min(rect.width, GLOBE_CONFIG.maxSize[this.variant]);
  }

  /**
   * Build the world as a cube made of voxels.
   *
   * Six faces. The `radius` config value is reinterpreted as the cube's
   * half-edge length so existing tunings (size/lighting/pins) stay
   * roughly proportional. Each face is tiled with `gridSize × gridSize`
   * voxel cubes; biome distribution is face-aware:
   *   • top + bottom face → ice caps
   *   • four side faces   → mixed land/ocean with elevation jitter
   *
   * The cube voxels still get outward-elevation offsets and an ocean
   * shimmer animation, so it reads as a voxel world rather than a
   * featureless rubik's cube.
   */
  buildGlobe() {
    this.landCubes = [];
    this.oceanCubes = [];

    const half = this.radius;
    // Number of voxels per face row. Tuned so the cube reads as a
    // voxel surface at the existing radius without overloading the GPU.
    const gridSize = Math.max(10, Math.round((2 * half) / this.cubeSize));
    const step = (2 * half) / gridSize;

    // Each face is defined by an outward normal axis (which face it is)
    // plus two orthogonal in-face axes (u, v) for tiling.
    // `phase` is the per-face noise offset; distinct integers per face keep
    // adjacent/opposite faces from producing identical patterns.
    const FACES = [
      { name: 'top',    normal: [ 0,  1,  0], u: [1, 0, 0], v: [0, 0, 1], biome: 'ice',   phase:  1.7 },
      { name: 'bottom', normal: [ 0, -1,  0], u: [1, 0, 0], v: [0, 0, 1], biome: 'ice',   phase: 11.3 },
      { name: 'front',  normal: [ 0,  0,  1], u: [1, 0, 0], v: [0, 1, 0], biome: 'mixed', phase:  4.2 },
      { name: 'back',   normal: [ 0,  0, -1], u: [1, 0, 0], v: [0, 1, 0], biome: 'mixed', phase:  7.9 },
      { name: 'right',  normal: [ 1,  0,  0], u: [0, 0, 1], v: [0, 1, 0], biome: 'mixed', phase: 14.5 },
      { name: 'left',   normal: [-1,  0,  0], u: [0, 0, 1], v: [0, 1, 0], biome: 'mixed', phase: 18.1 },
    ];

    for (const face of FACES) {
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          // u, v go from -half + half-step to +half - half-step so voxels
          // sit centered inside their grid cells rather than overhanging.
          const uPos = -half + step * (i + 0.5);
          const vPos = -half + step * (j + 0.5);
          const cube = this.makeFaceVoxel(face, uPos, vPos, step);
          if (cube) this.globeGroup.add(cube);
        }
      }
    }
  }

  /**
   * Build one voxel sitting on the given cube face at (uPos, vPos) within
   * the face's local 2D grid. Biome and elevation come from a noise field
   * sampled at (uPos, vPos), so neighboring voxels cluster into coherent
   * green/blue/white patches instead of scattering randomly.
   */
  makeFaceVoxel(face, uPos, vPos, step) {
    // ── Biome decision via a cheap sum-of-sinusoids noise field ──
    //
    // Three octaves of sin() produce smooth, organic contours that vary
    // slowly across the face. Different frequencies per face give each face
    // its own pattern so opposite faces don't mirror each other. The result
    // is shifted into roughly [0, 1] for threshold comparisons below.
    const fx = face.phase;   // distinct per face — see FACES table in buildGlobe()
    const n =
      Math.sin(uPos * 1.3 + vPos * 0.9 + fx) +
      Math.sin(uPos * 0.7 - vPos * 1.5 + fx * 2) * 0.7 +
      Math.sin(uPos * 2.1 + vPos * 0.4 + fx * 3) * 0.4;
    const noise = (n + 2.1) / 4.2;   // normalize to ~0..1

    // Per-face biome bias — top/bottom skew toward snow, sides balanced.
    const snowBias = face.biome === 'ice' ? 0.25 : 0;

    // Compute thresholds in order: deepOcean / ocean / sand / grass / darkGrass / mountain / snow.
    const adjusted = noise + snowBias;

    let color, outwardOffset, scaleJitter, isOcean = false;

    if (adjusted < 0.25) {
      // Deep ocean — recessed.
      color = pickColor(PALETTE.deepOcean);
      outwardOffset = -0.04;
      scaleJitter = 0.9;
      isOcean = true;
    } else if (adjusted < 0.40) {
      // Shallow ocean — slightly higher than deep, still recessed.
      color = pickColor(PALETTE.ocean);
      outwardOffset = -0.02;
      scaleJitter = 0.9;
      isOcean = true;
    } else if (adjusted < 0.46) {
      // Sandy coast — narrow band right above sea level.
      color = pickColor(PALETTE.sand);
      outwardOffset = 0.02 + Math.random() * 0.04;
      scaleJitter = 1.0;
    } else if (adjusted < 0.68) {
      // Grass — the dominant land biome.
      color = pickColor(PALETTE.grass);
      outwardOffset = 0.06 + Math.random() * 0.10;
      scaleJitter = 1.0 + Math.random() * 0.2;
    } else if (adjusted < 0.82) {
      // Forest / boreal — slightly elevated land.
      color = pickColor(PALETTE.darkGrass);
      outwardOffset = 0.10 + Math.random() * 0.12;
      scaleJitter = 1.0 + Math.random() * 0.3;
    } else if (adjusted < 0.92) {
      // Mountain — significantly taller, gives the cliff look.
      color = pickColor(PALETTE.mountain);
      outwardOffset = 0.18 + Math.random() * 0.14;
      scaleJitter = 1.1 + Math.random() * 0.4;
    } else {
      // Snow cap.
      color = pickColor(PALETTE.ice);
      outwardOffset = 0.12 + Math.random() * 0.10;
      scaleJitter = 1.0 + Math.random() * 0.3;
    }

    // Build the cube's position by combining face normal + in-face u/v
    // offsets, plus the random outward elevation.
    const totalOutward = this.radius + outwardOffset;
    const x = face.normal[0] * totalOutward + face.u[0] * uPos + face.v[0] * vPos;
    const y = face.normal[1] * totalOutward + face.u[1] * uPos + face.v[1] * vPos;
    const z = face.normal[2] * totalOutward + face.u[2] * uPos + face.v[2] * vPos;

    const s = step * 0.95 * scaleJitter;
    const geo = new THREE.BoxGeometry(s, s, s);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: isOcean ? 0.3 : 0.8,
      metalness: isOcean ? 0.1 : 0.0,
      flatShading: true,
      transparent: isOcean,   // required for ocean shimmer (opacity animates)
      opacity: 1,
    });

    const cube = new THREE.Mesh(geo, mat);
    cube.position.set(x, y, z);
    // Orient the voxel so one face points outward along the face normal.
    cube.lookAt(face.normal[0] * 100, face.normal[1] * 100, face.normal[2] * 100);

    if (isOcean) this.oceanCubes.push(cube);
    else this.landCubes.push(cube);
    return cube;
  }

  buildCreatorPins() {
    this.creatorPins = [];
    const container = document.getElementById('globeCreators');
    if (!container || this.isMini) return;

    const pinOutset = this.radius + 0.3;

    for (const pin of GLOBE_PINS) {
      const marker = new THREE.Object3D();
      // Each pin still carries its original lat/lon (a direction vector
      // from the origin). Convert to a unit-sphere position, then project
      // outward to the cube surface using max-norm: scale the unit vector
      // so the LARGEST absolute coordinate equals pinOutset. That places
      // the pin on whichever face it points towards.
      const unit = latLonToCartesian(pin.pin.lat, pin.pin.lon, 1);
      const maxAxis = Math.max(Math.abs(unit.x), Math.abs(unit.y), Math.abs(unit.z));
      const scale = pinOutset / maxAxis;
      marker.position.set(unit.x * scale, unit.y * scale, unit.z * scale);
      this.globeGroup.add(marker);

      const pinEl = this.makePinElement(pin);
      container.appendChild(pinEl);
      this.creatorPins.push({ marker, element: pinEl });
    }
  }

  /**
   * Build a decorative location pin's DOM element. Popup links to the
   * #creators section — the real creator list lives there, not per-pin.
   */
  makePinElement(pin) {
    const pinEl = document.createElement('div');
    pinEl.className = 'globe-creator-pin';
    pinEl.innerHTML = `
      <div class="pin-dot"></div>
      <div class="pin-pulse"></div>
      <div class="pin-popup">
        <div class="pin-popup-header">
          <div class="pin-popup-avatar" style="background: ${pin.color}">${pin.initials}</div>
          <div>
            <h4>${pin.label}</h4>
            <span class="pin-location">${pin.sub}</span>
          </div>
        </div>
        <a href="#creators" class="pin-cta" data-region="${pin.id}">Meet the wanderers →</a>
      </div>
    `;
    pinEl.querySelector('.pin-cta').addEventListener('click', (e) => {
      e.stopPropagation();
      const target = document.getElementById('creators');
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return pinEl;
  }

  updatePinPositions() {
    if (!this.creatorPins || !this.creatorPins.length) return;
    const rect = this.canvas.getBoundingClientRect();

    for (const pin of this.creatorPins) {
      const worldPos = new THREE.Vector3();
      pin.marker.getWorldPosition(worldPos);

      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      const facing = worldPos.clone().normalize().dot(camDir.negate());

      // Hide the pin if it's facing away from the camera (back of globe).
      if (facing < GLOBE_CONFIG.pinFrontDotThreshold) {
        pin.element.style.opacity = '0';
        pin.element.style.pointerEvents = 'none';
        continue;
      }
      pin.element.style.opacity = '';
      pin.element.style.pointerEvents = '';

      const projected = worldPos.clone().project(this.camera);
      const px = (projected.x * 0.5 + 0.5) * rect.width;
      const py = (-projected.y * 0.5 + 0.5) * rect.height;

      pin.element.style.left = `${px}px`;
      pin.element.style.top = `${py}px`;
      pin.element.style.transform = 'translate(-50%, -50%)';
    }
  }

  buildClouds() {
    this.cloudGroups = [];
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 1.0,
      metalness: 0,
      transparent: true,
      opacity: 0.85,
      flatShading: true,
    });

    const cloudCount = this.isMini ? 5 : 8;
    // Clouds orbit on a sphere larger than the cube's bounding sphere
    // (corners reach radius * √3) so they always pass *outside* the cube
    // — no clipping through corners.
    const CUBE_CORNER_DISTANCE = this.radius * Math.sqrt(3);
    for (let i = 0; i < cloudCount; i++) {
      const cluster = new THREE.Group();
      const lat = (Math.random() - 0.5) * Math.PI * 0.7;
      const lon = Math.random() * Math.PI * 2;
      const r = CUBE_CORNER_DISTANCE + 0.4;

      const { x, y, z } = latLonToCartesian(lat, lon, r);

      const puffCount = 3 + Math.floor(Math.random() * 4);
      for (let j = 0; j < puffCount; j++) {
        const puffSize = 0.1 + Math.random() * 0.15;
        const geo = new THREE.BoxGeometry(puffSize, puffSize * 0.5, puffSize);
        const puff = new THREE.Mesh(geo, cloudMat.clone());
        puff.position.set(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.15,
        );
        cluster.add(puff);
      }

      cluster.position.set(x, y, z);
      cluster.lookAt(0, 0, 0);
      cluster.userData = {
        lat,
        lon,
        r,
        speed: GLOBE_CONFIG.cloudBaseSpeed + Math.random() * GLOBE_CONFIG.cloudSpeedRange,
      };

      this.cloudGroups.push(cluster);
      this.globeGroup.add(cluster);
    }
  }

  buildStars() {
    const positions = [];
    for (let i = 0; i < 300; i++) {
      positions.push(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
      );
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.06,
      transparent: true,
      opacity: 0.5,
    });
    this.stars = new THREE.Points(starsGeo, starsMat);
    this.scene.add(this.stars);
  }

  bindPointer() {
    const onDown = (x, y) => {
      this.isDragging = true;
      this.prevPointer.x = x;
      this.prevPointer.y = y;
    };
    const onMove = (x, y) => {
      if (!this.isDragging) return;
      this.rotationVelocity.x = (y - this.prevPointer.y) * GLOBE_CONFIG.dragSensitivity;
      this.rotationVelocity.y = (x - this.prevPointer.x) * GLOBE_CONFIG.dragSensitivity;
      this.prevPointer.x = x;
      this.prevPointer.y = y;
    };
    const onUp = () => { this.isDragging = false; };

    this.canvas.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onUp);

    this.canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      onDown(t.clientX, t.clientY);
    }, { passive: true });
    this.canvas.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    }, { passive: true });
    this.canvas.addEventListener('touchend', onUp);
  }

  bindResize() {
    let pending = false;
    window.addEventListener('resize', () => {
      // rAF coalesces rapid resize events (during window drag).
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const size = this.computeSize();
        this.renderer.setSize(size, size);
      });
    });
  }

  tick() {
    requestAnimationFrame(() => this.tick());
    this.time += 0.016;

    if (!this.isDragging && !this.reduceMotion) {
      this.globeGroup.rotation.y += GLOBE_CONFIG.autoRotateSpeed;
    }

    this.globeGroup.rotation.x += this.rotationVelocity.x;
    this.globeGroup.rotation.y += this.rotationVelocity.y;
    this.rotationVelocity.x *= GLOBE_CONFIG.damping;
    this.rotationVelocity.y *= GLOBE_CONFIG.damping;

    if (this.cloudGroups && !this.reduceMotion) {
      for (const cloud of this.cloudGroups) {
        cloud.userData.lon += cloud.userData.speed;
        const { lat, r } = cloud.userData;
        const { x, y, z } = latLonToCartesian(lat, cloud.userData.lon, r);
        cloud.position.set(x, y, z);
        cloud.lookAt(0, 0, 0);
      }
    }

    // Ocean shimmer — visible now that the material is `transparent: true`.
    if (this.oceanCubes && !this.isMini && !this.reduceMotion) {
      for (let i = 0; i < this.oceanCubes.length; i += GLOBE_CONFIG.oceanShimmerStride) {
        const cube = this.oceanCubes[i];
        const wave = Math.sin(this.time * 2 + i * 0.5) * 0.5 + 0.5;  // 0..1
        cube.material.opacity =
          GLOBE_CONFIG.oceanShimmerOpacityMin
          + wave * (1 - GLOBE_CONFIG.oceanShimmerOpacityMin);
      }
    }

    if (this.stars && !this.reduceMotion) {
      this.stars.rotation.y += GLOBE_CONFIG.starsRotationSpeed;
    }

    this.renderer.render(this.scene, this.camera);
    if (!this.isMini) this.updatePinPositions();
  }
}
