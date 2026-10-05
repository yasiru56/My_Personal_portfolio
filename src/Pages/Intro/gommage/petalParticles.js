import * as THREE from "three/webgpu";
import {
  abs,
  attribute,
  clamp,
  cos,
  dot,
  float,
  instanceIndex,
  mat3,
  mix,
  mrt,
  normalize,
  normalLocal,
  positionLocal,
  pow,
  sin,
  smoothstep,
  texture,
  TWO_PI,
  uniform,
  uv,
  vec2,
  vec3,
} from "three/tsl";

const MAX_PETAL = 400;
const PETAL_LIFE = 6;
const PETAL_SCALE = 0.1;

function rotX(a) {
  const c = cos(a);
  const s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, s.mul(-1.0), 0.0, s, c);
}

function rotY(a) {
  const c = cos(a);
  const s = sin(a);
  return mat3(c, 0.0, s, 0.0, 1.0, 0.0, s.mul(-1.0), 0.0, c);
}

function rotZ(a) {
  const c = cos(a);
  const s = sin(a);
  return mat3(c, s.mul(-1.0), 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
}

export default class PetalParticles {
  #spawnPos = new Float32Array(MAX_PETAL * 3);
  // Birth, life, seed and scale packed together to stay under WebGPU's attribute limit
  #birthLifeSeedScale = new Float32Array(MAX_PETAL * 4);
  #currentPetalIndex = 0;
  #petalMesh = null;
  #uTime = null;

  initialize({ perlinTexture, petalGeometry, uTime }) {
    this.#uTime = uTime;

    const petalGeo = petalGeometry.clone();
    petalGeo.scale(PETAL_SCALE, PETAL_SCALE, PETAL_SCALE);
    petalGeo.setAttribute("aSpawnPos", new THREE.InstancedBufferAttribute(this.#spawnPos, 3));
    petalGeo.setAttribute("aBirthLifeSeedScale", new THREE.InstancedBufferAttribute(this.#birthLifeSeedScale, 4));

    const material = this.#createPetalMaterial(perlinTexture);
    this.#petalMesh = new THREE.InstancedMesh(petalGeo, material, MAX_PETAL);
    // Instances are positioned in the shader, so the default bounds are meaningless
    this.#petalMesh.frustumCulled = false;
    return this.#petalMesh;
  }

  spawnPetal(spawnPos) {
    if (this.#currentPetalIndex === MAX_PETAL) this.#currentPetalIndex = 0;
    const id = this.#currentPetalIndex++;

    this.#spawnPos.set([spawnPos.x, spawnPos.y, spawnPos.z], id * 3);
    this.#birthLifeSeedScale.set(
      [this.#uTime.value, PETAL_LIFE, Math.random(), Math.random() * 0.5 + 0.5],
      id * 4
    );

    const { attributes } = this.#petalMesh.geometry;
    attributes.aSpawnPos.needsUpdate = true;
    attributes.aBirthLifeSeedScale.needsUpdate = true;
  }

  #createPetalMaterial(perlinTexture) {
    const material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      side: THREE.DoubleSide,
    });

    const aSpawnPos = attribute("aSpawnPos", "vec3");
    const aBirthLifeSeedScale = attribute("aBirthLifeSeedScale", "vec4");
    const aBirth = aBirthLifeSeedScale.x;
    const aLife = aBirthLifeSeedScale.y;
    const aSeed = aBirthLifeSeedScale.z;
    const aScale = aBirthLifeSeedScale.w;

    const uWindDirection = uniform(new THREE.Vector3(-1, 0, 0).normalize());
    const uWindStrength = uniform(0.3);
    const uRiseSpeed = uniform(0.1); // constant lift
    const uNoiseScale = uniform(30.0); // noise frequency
    const uNoiseSpeed = uniform(0.015); // noise scroll speed
    const uWobbleAmp = uniform(0.6); // vertical wobble amplitude

    const uBendAmount = uniform(2.5);
    const uBendSpeed = uniform(1.0);
    const uSpinSpeed = uniform(2.0);
    const uSpinAmp = uniform(0.45); // overall rotation amount
    const uRedColor = uniform(new THREE.Color("#9B0000"));
    const uWhiteColor = uniform(new THREE.Color("#EEEEEE"));
    const uLightPosition = uniform(new THREE.Vector3(0, 0, 5));

    // Age of the petal in seconds
    const petalAge = this.#uTime.sub(aBirth);
    const lifeInterpolation = clamp(petalAge.div(aLife), 0, 1);

    const randomSeed = vec2(aSeed.mul(123.4), aSeed.mul(567.8));
    const noiseUv = aSpawnPos.xz
      .mul(uNoiseScale)
      .add(randomSeed)
      .add(uWindDirection.xz.mul(petalAge.mul(uNoiseSpeed)));

    // Noise in [0, 1], remapped to turbulence in [-1, 1]
    const noiseSample = texture(perlinTexture, noiseUv).x;
    const noiseSampleBis = texture(perlinTexture, noiseUv.add(vec2(13.37, 7.77))).x;
    const turbulenceX = noiseSample.sub(0.5).mul(2);
    const turbulenceY = noiseSampleBis.sub(0.5).mul(2);
    const turbulenceZ = noiseSample.sub(0.5).mul(2);

    const swirl = vec3(clamp(turbulenceX.mul(lifeInterpolation), 0, 1.0), turbulenceY.mul(lifeInterpolation), 0.0).mul(
      uWobbleAmp
    );

    // Bend the tip of the petal back and forth
    const bendWeight = pow(uv().y, float(3.0));
    const bend = bendWeight.mul(uBendAmount).mul(sin(petalAge.mul(uBendSpeed.mul(noiseSample))));
    const B = rotX(bend);

    const windImpulse = uWindDirection.mul(uWindStrength).mul(petalAge);
    const riseFactor = clamp(noiseSample, 0.3, 1.0);
    const rise = vec3(0.0, petalAge.mul(uRiseSpeed).mul(riseFactor), 0.0);
    const driftMovement = windImpulse.add(rise).add(swirl);

    // Random starting orientation, then a turbulence-driven tumble
    const baseX = aSeed.mul(1.13).mod(1.0).mul(TWO_PI);
    const baseY = aSeed.mul(2.17).mod(1.0).mul(TWO_PI);
    const baseZ = aSeed.mul(3.31).mod(1.0).mul(TWO_PI);

    const spin = petalAge.mul(uSpinSpeed).mul(uSpinAmp);
    const rx = baseX.add(spin.mul(0.9).mul(turbulenceX.add(1.5)));
    const ry = baseY.add(spin.mul(1.2).mul(turbulenceY.add(1.5)));
    const rz = baseZ.add(spin.mul(0.7).mul(turbulenceZ.add(1.5)));
    const R = rotY(ry).mul(rotX(rx)).mul(rotZ(rz));

    // Pop in at birth, fade out before death
    const scaleFactor = smoothstep(float(0), float(0.05), lifeInterpolation);
    const fadingOut = float(1.0).sub(smoothstep(float(0.8), float(1.0), lifeInterpolation));

    const positionLocalUpdated = R.mul(B.mul(positionLocal));
    const normalUpdated = normalize(R.mul(B.mul(normalLocal)));
    const worldPosition = aSpawnPos.add(driftMovement).add(positionLocalUpdated.mul(aScale.mul(scaleFactor)));

    // Every third petal is white, the rest are red
    const petalColor = mix(uRedColor, uWhiteColor, instanceIndex.mod(3).equal(0));

    // Simple two-sided lighting so petals flicker as they tumble
    const lightDirection = normalize(uLightPosition.sub(worldPosition));
    const facing = clamp(abs(dot(normalUpdated, lightDirection)), 0.4, 1);

    material.colorNode = petalColor.mul(facing);
    material.positionNode = worldPosition;
    material.opacityNode = fadingOut;
    material.mrtNode = mrt({
      bloomIntensity: float(0.7).mul(fadingOut),
    });

    return material;
  }
}
