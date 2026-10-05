/*
 * Interactive 3D wave grid background, adapted from "3D Wave Grid" by franky-adl.
 * https://github.com/franky-adl/3d-wave-grid (MIT, see LICENSE)
 */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import MouseTrail from "./MouseTrail";
import WaveGrid, { GRID_BOUNDS } from "./WaveGrid";
import { VignetteRGBShiftShader } from "./VignetteRGBShiftShader";

const CAMERA_DISTANCE = 12;
// How far the camera tilts towards the mouse (radians)
const TILT_X = Math.PI * 0.03; // mouse Y
const TILT_Z = Math.PI * 0.05; // mouse X
const MOUSE_EASE = 0.04;
const MAX_PIXEL_RATIO = 1.5; // it's a background, so trade a little sharpness for speed
const MAX_DELTA = 0.1; // seconds; avoids a jump after the tab was hidden

export default class WaveScene {
  #container;
  #renderer;
  #composer;
  #scene = new THREE.Scene();
  #camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  #trail;
  #grid;

  #mouse = new THREE.Vector2();
  #easedMouse = new THREE.Vector2();
  #lastTime = null;

  constructor(container) {
    this.#container = container;

    this.#renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.#renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.#renderer.toneMappingExposure = 1.3;
    this.#renderer.shadowMap.enabled = true;
    this.#renderer.shadowMap.type = THREE.PCFShadowMap;

    this.#camera.up.set(0, 0, -1);
    this.#placeCamera(0, 0);
    this.#scene.add(this.#camera);

    this.#trail = new MouseTrail(this.#camera, GRID_BOUNDS);
    this.#grid = new WaveGrid(this.#scene, this.#trail.uniforms);

    this.#composer = new EffectComposer(this.#renderer);
    this.#composer.addPass(new RenderPass(this.#scene, this.#camera));
    this.#composer.addPass(new ShaderPass(VignetteRGBShiftShader));
    this.#composer.addPass(new OutputPass());

    this.#onResize();
    container.appendChild(this.#renderer.domElement);
    window.addEventListener("resize", this.#onResize);
    window.addEventListener("pointermove", this.#onPointerMove);
    this.#renderer.setAnimationLoop(this.#render);
  }

  dispose() {
    this.#renderer.setAnimationLoop(null);
    window.removeEventListener("resize", this.#onResize);
    window.removeEventListener("pointermove", this.#onPointerMove);

    this.#grid.dispose();
    this.#trail.dispose();
    this.#composer.passes.forEach((pass) => pass.dispose());
    this.#composer.dispose();
    this.#renderer.dispose();
    this.#renderer.domElement.remove();
  }

  // Orbits the camera above the grid, looking straight down at the centre
  #placeCamera(mouseX, mouseY) {
    const alpha = mouseY * TILT_X;
    const beta = mouseX * TILT_Z;
    this.#camera.position.set(
      -CAMERA_DISTANCE * Math.cos(alpha) * Math.sin(beta),
      CAMERA_DISTANCE * Math.cos(alpha) * Math.cos(beta),
      CAMERA_DISTANCE * Math.sin(alpha)
    );
    this.#camera.lookAt(0, 0, 0);
  }

  #render = (time) => {
    const seconds = time / 1000;
    const delta = this.#lastTime === null ? 0 : Math.min(seconds - this.#lastTime, MAX_DELTA);
    this.#lastTime = seconds;

    this.#easedMouse.lerp(this.#mouse, MOUSE_EASE);
    this.#placeCamera(this.#easedMouse.x, this.#easedMouse.y);
    this.#trail.update(delta);
    this.#composer.render();
  };

  // The canvas sits behind the page, so listen on the window instead of the canvas
  #onPointerMove = (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.#mouse.set(x, y);
    this.#trail.addPointerPoint(x, y);
  };

  #onResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);

    this.#camera.aspect = width / height;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setPixelRatio(pixelRatio);
    this.#renderer.setSize(width, height);
    this.#composer.setPixelRatio(pixelRatio);
    this.#composer.setSize(width, height);
  };
}
