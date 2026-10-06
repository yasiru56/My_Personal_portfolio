import * as THREE from "three/webgpu";
import {
  attribute,
  clamp,
  float,
  mrt,
  positionLocal,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";

const MAX_DUST = 100;
const DUST_LIFE = 4;

export default class DustParticles {
  #spawnPos = new Float32Array(MAX_DUST * 3);
  // Birth, life, seed and scale packed together to stay under WebGPU's attribute limit
  #birthLifeSeedScale = new Float32Array(MAX_DUST * 4);
  #currentDustIndex = 0;
  #dustMesh = null;
  #uTime = null;

  initialize({ perlinTexture, dustParticleTexture, uTime }) {
    this.#uTime = uTime;

    const dustGeometry = new THREE.PlaneGeometry(0.02, 0.02);
    dustGeometry.setAttribute("aSpawnPos", new THREE.InstancedBufferAttribute(this.#spawnPos, 3));
    dustGeometry.setAttribute("aBirthLifeSeedScale", new THREE.InstancedBufferAttribute(this.#birthLifeSeedScale, 4));

    const material = this.#createDustMaterial(perlinTexture, dustParticleTexture);
    this.#dustMesh = new THREE.InstancedMesh(dustGeometry, material, MAX_DUST);
    // Instances are positioned in the shader, so the default bounds are meaningless
    this.#dustMesh.frustumCulled = false;
    return this.#dustMesh;
  }

  spawnDust(spawnPos) {
    if (this.#currentDustIndex === MAX_DUST) this.#currentDustIndex = 0;
    const id = this.#currentDustIndex++;

    this.#spawnPos.set([spawnPos.x, spawnPos.y, spawnPos.z], id * 3);
    this.#birthLifeSeedScale.set(
      [this.#uTime.value, DUST_LIFE, Math.random(), Math.random() * 0.5 + 0.5],
      id * 4
    );

    const { attributes } = this.#dustMesh.geometry;
    attributes.aSpawnPos.needsUpdate = true;
    attributes.aBirthLifeSeedScale.needsUpdate = true;
  }

  #createDustMaterial(perlinTexture, dustTexture) {
    const material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const aSpawnPos = attribute("aSpawnPos", "vec3");
    const aBirthLifeSeedScale = attribute("aBirthLifeSeedScale", "vec4");
    const aBirth = aBirthLifeSeedScale.x;
    const aLife = aBirthLifeSeedScale.y;
    const aSeed = aBirthLifeSeedScale.z;
    const aScale = aBirthLifeSeedScale.w;

    const uDustColor = uniform(new THREE.Color("#7FA6E0"));
    const uWindDirection = uniform(new THREE.Vector3(-1, 0, 0).normalize());
    const uWindStrength = uniform(0.3);
    const uRiseSpeed = uniform(0.1); // constant lift
    const uNoiseScale = uniform(30.0); // noise frequency
    const uNoiseSpeed = uniform(0.015); // noise scroll speed
    const uWobbleAmp = uniform(0.6); // vertical wobble amplitude

    // Age of the dust in seconds
    const dustAge = this.#uTime.sub(aBirth);
    const lifeInterpolation = clamp(dustAge.div(aLife), 0, 1);

    const randomSeed = vec2(aSeed.mul(123.4), aSeed.mul(567.8));
    const noiseUv = aSpawnPos.xz
      .mul(uNoiseScale)
      .add(randomSeed)
      .add(uWindDirection.xz.mul(dustAge.mul(uNoiseSpeed)));

    // Noise in [0, 1], remapped to turbulence in [-1, 1]
    const noiseSample = texture(perlinTexture, noiseUv).x;
    const noiseSampleBis = texture(perlinTexture, noiseUv.add(vec2(13.37, 7.77))).x;
    const turbulenceX = noiseSample.sub(0.5).mul(2);
    const turbulenceY = noiseSampleBis.sub(0.5).mul(2);

    const swirl = vec3(clamp(turbulenceX.mul(lifeInterpolation), 0, 1.0), turbulenceY.mul(lifeInterpolation), 0.0).mul(
      uWobbleAmp
    );
    const windImpulse = uWindDirection.mul(uWindStrength).mul(dustAge);
    const riseFactor = clamp(noiseSample, 0.3, 1.0);
    const rise = vec3(0.0, dustAge.mul(uRiseSpeed).mul(riseFactor), 0.0);
    const driftMovement = windImpulse.add(rise).add(swirl);

    // Pop in at birth, fade out before death
    const scaleFactor = smoothstep(float(0), float(0.05), lifeInterpolation);
    const fadingOut = float(1.0).sub(smoothstep(float(0.8), float(1.0), lifeInterpolation));

    const dustSample = texture(dustTexture, uv());
    material.colorNode = vec4(uDustColor, dustSample.a);
    material.positionNode = aSpawnPos.add(driftMovement).add(positionLocal.mul(aScale.mul(scaleFactor)));
    material.opacityNode = fadingOut;
    material.mrtNode = mrt({
      bloomIntensity: float(0.5).mul(fadingOut),
    });

    return material;
  }
}
