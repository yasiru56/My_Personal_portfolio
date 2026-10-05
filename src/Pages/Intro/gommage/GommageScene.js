/*
 * "Gommage" dissolve effect, adapted from the Codrops demo
 * "Clair Obscur: Expedition 33 WebGPU Gommage Effect" by Thibault Introvigne.
 * https://github.com/WallabyMonochrome/WebGPU-clair-obscur-gommage-codrops (MIT, see LICENSE)
 */
import * as THREE from "three/webgpu";
import { float, mrt, output, pass, uniform } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import GommageOrchestrator from "./gommageOrchestrator";

// The FOV is fixed horizontally so the text keeps the same width on any screen,
// narrower on portrait screens so the name stays readable on phones
const HORIZONTAL_FOV = THREE.MathUtils.degToRad(45);
const PORTRAIT_HORIZONTAL_FOV = THREE.MathUtils.degToRad(36);
const CLEAR_COLOR = 0x111111;

export default class GommageScene {
  #container = null;
  #renderer = null;
  #isRendererReady = false;
  #camera = new THREE.PerspectiveCamera(45, 1, 0.1, 25);
  #scene = new THREE.Scene();
  #postProcessing = null;
  #orchestrator = new GommageOrchestrator();
  // Particle clock. TSL's built-in `time` starts at the first frame, so particles
  // stamp their birth with this uniform instead to stay in sync with the shader.
  #uTime = uniform(0);

  #isLoading = false;
  #isDisposed = false;

  async init(container, text) {
    this.#isLoading = true;
    try {
      await this.#setup(container, text);
    } catch (error) {
      this.#isDisposed = true;
      throw error;
    } finally {
      this.#isLoading = false;
      // dispose() may have been called while we were still loading
      if (this.#isDisposed) this.#release();
    }
    if (this.#isDisposed) return;

    this.#container.appendChild(this.#renderer.domElement);
    window.addEventListener("resize", this.#onResize);
    this.#renderer.setAnimationLoop(this.#render);
  }

  dissolve(duration) {
    return this.#orchestrator.dissolve(duration);
  }

  dispose() {
    if (this.#isDisposed) return;
    this.#isDisposed = true;
    if (!this.#isLoading) this.#release();
  }

  async #setup(container, text) {
    this.#container = container;

    this.#renderer = new THREE.WebGPURenderer({ antialias: true });
    await this.#renderer.init();
    this.#isRendererReady = true;

    this.#renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.#renderer.setClearColor(CLEAR_COLOR, 1);
    this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.#camera.position.set(0, 0, 5);
    this.#onResize();

    await this.#orchestrator.initialize(this.#scene, { text, uTime: this.#uTime });
    this.#setupPostProcessing();
  }

  #setupPostProcessing() {
    const scenePass = pass(this.#scene, this.#camera);
    scenePass.setMRT(
      mrt({
        output,
        bloomIntensity: float(0),
      })
    );

    // Only what each material writes into `bloomIntensity` glows
    const outputPass = scenePass.getTextureNode();
    const bloomIntensityPass = scenePass.getTextureNode("bloomIntensity");
    const bloomPass = bloom(outputPass.mul(bloomIntensityPass), 0.8);

    this.#postProcessing = new THREE.PostProcessing(this.#renderer);
    this.#postProcessing.outputNode = scenePass.add(bloomPass).renderOutput();
  }

  #render = () => {
    this.#uTime.value = performance.now() / 1000;
    this.#postProcessing.render();
  };

  #onResize = () => {
    const { clientWidth: width, clientHeight: height } = this.#container;
    this.#camera.aspect = width / height;
    const horizontalFov = this.#camera.aspect < 1 ? PORTRAIT_HORIZONTAL_FOV : HORIZONTAL_FOV;
    this.#camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(horizontalFov / 2) / this.#camera.aspect));
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(width, height);
  };

  #release() {
    window.removeEventListener("resize", this.#onResize);
    this.#orchestrator.dispose();

    this.#scene.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      object.material.dispose();
    });
    this.#postProcessing?.dispose();

    // Disposing a renderer that never initialized would make three.js retry init()
    if (this.#isRendererReady) {
      this.#renderer.dispose();
      this.#renderer.domElement.remove();
    }
    this.#renderer = null;
    this.#isRendererReady = false;
  }
}
