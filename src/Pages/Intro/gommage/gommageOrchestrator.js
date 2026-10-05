import * as THREE from "three/webgpu";
import { uniform } from "three/tsl";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import gsap from "gsap";
import MSDFText from "./msdfText";
import DustParticles from "./dustParticles";
import PetalParticles from "./petalParticles";
import fontData from "../assets/Cinzel.json";
import fontAtlasUrl from "../assets/Cinzel.png";
import perlinUrl from "../assets/perlin.webp";
import dustParticleUrl from "../assets/dustParticle.png";
import petalModelUrl from "../assets/petal.glb";

// Seconds between particle spawns while the text dissolves
const DUST_INTERVAL = 0.125;
const PETAL_INTERVAL = 0.05;

export default class GommageOrchestrator {
  #uProgress = uniform(0.0);
  #text = new MSDFText();
  #dust = new DustParticles();
  #petals = new PetalParticles();

  #textures = [];
  #petalGeometry = null;
  #tweens = [];

  async initialize(scene, { text, uTime }) {
    const [{ fontAtlasTexture, perlinTexture, dustParticleTexture }, petalGeometry] = await Promise.all([
      this.#loadTextures(),
      this.#loadPetalGeometry(),
    ]);

    scene.add(
      this.#text.initialize({ text, fontData, fontAtlasTexture, perlinTexture, uProgress: this.#uProgress }),
      this.#dust.initialize({ perlinTexture, dustParticleTexture, uTime }),
      this.#petals.initialize({ perlinTexture, petalGeometry, uTime })
    );
  }

  // Resolves once the text has fully dissolved (particles keep drifting afterwards)
  dissolve(duration) {
    this.#killTweens();
    this.#uProgress.value = 0;

    return new Promise((resolve) => {
      const spawnEvery = (interval, spawn) =>
        gsap.to({}, { duration: interval, repeat: -1, onRepeat: () => spawn(this.#text.getRandomPositionInMesh()) });

      this.#tweens = [
        spawnEvery(DUST_INTERVAL, (position) => this.#dust.spawnDust(position)),
        spawnEvery(PETAL_INTERVAL, (position) => this.#petals.spawnPetal(position)),
        gsap.to(this.#uProgress, {
          value: 1,
          duration,
          ease: "none",
          onComplete: () => {
            this.#killTweens();
            resolve();
          },
        }),
      ];
    });
  }

  dispose() {
    this.#killTweens();
    this.#textures.forEach((texture) => texture.dispose());
    this.#petalGeometry?.dispose();
  }

  #killTweens() {
    this.#tweens.forEach((tween) => tween.kill());
    this.#tweens = [];
  }

  async #loadPetalGeometry() {
    const gltf = await new GLTFLoader().loadAsync(petalModelUrl);
    this.#petalGeometry = gltf.scene.getObjectByName("PetalV2").geometry;
    return this.#petalGeometry;
  }

  async #loadTextures() {
    const loader = new THREE.TextureLoader();
    const [fontAtlasTexture, perlinTexture, dustParticleTexture] = await Promise.all(
      [fontAtlasUrl, perlinUrl, dustParticleUrl].map((url) => loader.loadAsync(url))
    );
    this.#textures = [fontAtlasTexture, perlinTexture, dustParticleTexture];

    // Data textures: no color conversion, no mipmaps
    this.#textures.forEach((texture) => {
      texture.colorSpace = THREE.NoColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
    });
    perlinTexture.wrapS = perlinTexture.wrapT = THREE.RepeatWrapping;
    fontAtlasTexture.wrapS = fontAtlasTexture.wrapT = THREE.ClampToEdgeWrapping;

    return { fontAtlasTexture, perlinTexture, dustParticleTexture };
  }
}
