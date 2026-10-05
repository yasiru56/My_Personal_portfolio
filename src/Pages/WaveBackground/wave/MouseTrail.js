import * as THREE from "three";

// Must match the literal 128.0 used in the grid's vertex shader texture lookup
const MAX_TRAIL = 128;
// Without mouse movement, ripples start appearing on their own
const IDLE_DELAY = 3; // seconds
const IDLE_INTERVAL = 1.5; // seconds
const IDLE_STRENGTH = 0.8;

/**
 * Records the pointer path on the grid and uploads it every frame as a
 * MAX_TRAIL×1 float texture, one texel per point: (worldX, worldZ, age, distDelta).
 * The grid's vertex shader turns every point into an expanding ripple.
 */
export default class MouseTrail {
  params = {
    fadeTime: 2.0, // seconds for a ripple to fall to ~37 %
    trailSpacing: 0.1, // minimum world distance between trail points
  };

  #camera;
  #bounds;
  #trail = [];
  #lastPoint = null;
  #idleTime = 0;
  #idleTimer = 0;
  #isIdle = true; // start with idle ripples straight away

  #raycaster = new THREE.Raycaster();
  #pointer = new THREE.Vector2();
  #rayPlane;
  #trailData = new Float32Array(MAX_TRAIL * 4);
  #trailTexture;

  constructor(camera, bounds) {
    this.#camera = camera;
    this.#bounds = bounds;

    // Invisible ground plane, used to find where the pointer is on the grid
    this.#rayPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(bounds, bounds),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, visible: false })
    );
    this.#rayPlane.rotation.x = -Math.PI / 2;
    this.#rayPlane.updateMatrixWorld(true);

    this.#trailTexture = new THREE.DataTexture(this.#trailData, MAX_TRAIL, 1, THREE.RGBAFormat, THREE.FloatType);
    this.#trailTexture.needsUpdate = true;

    // Shared by reference with the shaders, so changes here reach the GPU every frame
    this.uniforms = {
      uTrailTexture: { value: this.#trailTexture },
      uTrailCount: { value: 0 },
      uFadeTime: { value: this.params.fadeTime },
    };
  }

  // x and y in normalized device coordinates (-1 to 1)
  addPointerPoint(x, y) {
    this.#pointer.set(x, y);
    this.#raycaster.setFromCamera(this.#pointer, this.#camera);
    const [hit] = this.#raycaster.intersectObject(this.#rayPlane);
    if (!hit) return;

    const { x: worldX, z: worldZ } = hit.point;
    let distDelta = 0;
    if (this.#lastPoint) {
      distDelta = Math.hypot(worldX - this.#lastPoint.x, worldZ - this.#lastPoint.z);
      if (distDelta < this.params.trailSpacing) return;
    }

    this.#addPoint({ x: worldX, z: worldZ, age: 0, distDelta });
    this.#lastPoint = { x: worldX, z: worldZ };

    this.#idleTime = 0;
    this.#idleTimer = 0;
    this.#isIdle = false;
  }

  update(delta) {
    // At fadeTime * 4 a ripple is down to ~2 % and no longer visible
    const expiry = this.params.fadeTime * 4;
    for (let i = this.#trail.length - 1; i >= 0; i--) {
      this.#trail[i].age += delta;
      if (this.#trail[i].age > expiry) this.#trail.splice(i, 1);
    }

    this.#idleTime += delta;
    if (this.#idleTime >= IDLE_DELAY && !this.#isIdle) {
      this.#isIdle = true;
      this.#idleTimer = 0;
    }
    if (this.#isIdle) {
      this.#idleTimer += delta;
      if (this.#idleTimer >= IDLE_INTERVAL) {
        this.#addRandomPoint();
        this.#idleTimer = 0;
      }
    }

    const count = Math.min(this.#trail.length, MAX_TRAIL);
    if (count > 0 || this.uniforms.uTrailCount.value > 0) {
      for (let i = 0; i < count; i++) {
        const { x, z, age, distDelta } = this.#trail[i];
        this.#trailData.set([x, z, age, distDelta], i * 4);
      }
      this.#trailTexture.needsUpdate = true;
      this.uniforms.uTrailCount.value = count;
    }
  }

  dispose() {
    this.#trailTexture.dispose();
    this.#rayPlane.geometry.dispose();
    this.#rayPlane.material.dispose();
  }

  #addRandomPoint() {
    this.#addPoint({
      x: (Math.random() * 0.5 - 0.25) * this.#bounds,
      z: (Math.random() * 0.5 - 0.25) * this.#bounds,
      age: 0,
      distDelta: IDLE_STRENGTH + Math.random() * 0.2,
    });
  }

  #addPoint(point) {
    if (this.#trail.length >= MAX_TRAIL) this.#trail.shift();
    this.#trail.push(point);
  }
}
