import * as THREE from "three";

const GRID_SIZE = 40;
const CUBE_WIDTH = 0.8;
const CUBE_HEIGHT = 3;
const GAP = 0.01;

// World-space width of the whole grid
export const GRID_BOUNDS = GRID_SIZE * (CUBE_WIDTH + GAP);

const WAVE = {
  amplitude: 0.4,
  speed: 6.0, // world units per second
  frequency: 1.2, // radians per world unit
  width: 3.0, // half-width of a ripple ring (world units)
  jitter: 0.2,
  maxHeight: 0.4,
};

// Red theme: dark crimson cubes, brighter red on the wave crests.
// Kept fairly dark so text on top of the background stays readable.
const COLOR_BASE = "#3a0308";
const COLOR_HIGH = "#b3121c";

// Moves the top of each cube along the ripples. Shared by the colour and the
// shadow (depth) shaders so shadows follow the waves.
function addWaveToVertexShader(vertexShader) {
  return vertexShader
    .replace(
      "#include <common>",
      /* glsl */ `#include <common>
      varying float vHeight;
      attribute vec2 aOffset;
      uniform sampler2D uTrailTexture;
      uniform int uTrailCount;
      uniform float uWaveSpeed;
      uniform float uWaveFreq;
      uniform float uWaveWidth;
      uniform float uFadeTime;
      uniform float uAmplitude;
      uniform float uJitter;
      uniform float uMaxHeight;

      // Stable per-cube random offset in [-0.5, 0.5]
      vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return fract(sin(p) * 43758.5453123) - 0.5;
      }`
    )
    .replace(
      "#include <begin_vertex>",
      /* glsl */ `#include <begin_vertex>
      vHeight = 0.0;

      if (position.y > 0.0) {
        vec2 worldXZ = aOffset + hash2(aOffset) * uJitter;
        float waveHeight = 0.0;
        float totalWeight = 0.0;

        for (int i = 0; i < uTrailCount; i++) {
          // texel: (worldX, worldZ, age, distDelta)
          vec4 td = texture2D(uTrailTexture, vec2((float(i) + 0.5) / 128.0, 0.5));
          float dist = length(worldXZ - td.rg);
          float relDist = dist - uWaveSpeed * td.b;

          // Gaussian ring on the expanding wavefront, fading with time and distance
          float window = exp(-(relDist * relDist) / (uWaveWidth * uWaveWidth));
          float fade = exp(-td.b / uFadeTime);
          float atten = 1.0 / (1.0 + dist * 0.1);
          float weight = fade * window * atten * td.a;

          waveHeight += weight * cos(uWaveFreq * relDist);
          totalWeight += weight;
        }

        // Average overlapping ripples instead of stacking them
        waveHeight /= max(totalWeight, 1.0);

        float displacement = clamp(waveHeight * uAmplitude, -uMaxHeight, uMaxHeight);
        transformed.y += displacement;
        vHeight = displacement;
      }`
    );
}

export default class WaveGrid {
  #scene;
  #trailUniforms;
  #mesh;
  #lights = [];

  constructor(scene, trailUniforms) {
    this.#scene = scene;
    this.#trailUniforms = trailUniforms;

    // Half the base colour, so the gaps between cubes stay subtle
    scene.background = new THREE.Color(COLOR_BASE).multiplyScalar(0.5);

    this.#addLights();
    this.#addGrid();
  }

  dispose() {
    this.#scene.remove(this.#mesh, ...this.#lights);
    this.#mesh.geometry.dispose();
    this.#mesh.material.dispose();
    this.#mesh.customDepthMaterial.dispose();
    this.#lights.forEach((light) => light.dispose());
  }

  #addLights() {
    const ambient = new THREE.AmbientLight("#ffffff", 0.5);

    const key = new THREE.DirectionalLight("#ffffff", 4.0);
    key.position.set(-20, 10, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 6;
    key.shadow.bias = 0.0001;
    Object.assign(key.shadow.camera, { near: 0.1, far: 60, left: -22, right: 22, top: 22, bottom: -22 });

    const fill = new THREE.DirectionalLight("#ffffff", 1.0);
    fill.position.set(10, 5, -3);

    this.#lights = [ambient, key, fill];
    this.#scene.add(...this.#lights);
  }

  #waveUniforms() {
    return {
      ...this.#trailUniforms,
      uWaveSpeed: { value: WAVE.speed },
      uWaveFreq: { value: WAVE.frequency },
      uWaveWidth: { value: WAVE.width },
      uAmplitude: { value: WAVE.amplitude },
      uJitter: { value: WAVE.jitter },
      uMaxHeight: { value: WAVE.maxHeight },
    };
  }

  #addGrid() {
    const count = GRID_SIZE * GRID_SIZE;
    const geometry = new THREE.BoxGeometry(CUBE_WIDTH, CUBE_HEIGHT, CUBE_WIDTH);
    const offsets = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2);
    geometry.setAttribute("aOffset", offsets);

    const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.#waveUniforms(), {
        uColorBase: { value: new THREE.Color(COLOR_BASE) },
        uColorHigh: { value: new THREE.Color(COLOR_HIGH) },
      });
      shader.vertexShader = addWaveToVertexShader(shader.vertexShader);
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          varying float vHeight;
          uniform vec3 uColorBase;
          uniform vec3 uColorHigh;
          uniform float uMaxHeight;`
        )
        .replace(
          "#include <color_fragment>",
          /* glsl */ `#include <color_fragment>
          diffuseColor.rgb = mix(uColorBase, uColorHigh, clamp(vHeight / uMaxHeight, 0.0, 1.0));`
        );
    };

    const depthMaterial = new THREE.MeshDepthMaterial();
    depthMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.#waveUniforms());
      shader.vertexShader = addWaveToVertexShader(shader.vertexShader);
    };

    this.#mesh = new THREE.InstancedMesh(geometry, material, count);
    this.#mesh.customDepthMaterial = depthMaterial;
    this.#mesh.castShadow = true;
    this.#mesh.receiveShadow = true;

    // Lay the cubes out in a square grid centred on the origin
    const dummy = new THREE.Object3D();
    const spacing = CUBE_WIDTH + GAP;
    const offset = ((GRID_SIZE - 1) * spacing) / 2;
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const index = i * GRID_SIZE + j;
        const x = i * spacing - offset;
        const z = j * spacing - offset;
        dummy.position.set(x, 0, z);
        dummy.updateMatrix();
        this.#mesh.setMatrixAt(index, dummy.matrix);
        offsets.setXY(index, x, z);
      }
    }

    this.#scene.add(this.#mesh);
  }
}
