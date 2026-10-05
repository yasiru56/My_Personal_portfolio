import * as THREE from "three/webgpu";
// Imported from source so the library shares our single copy of three.js
import MSDFTextGeometry from "three-msdf-text-utils/src/MSDFTextGeometry";
import MSDFTextNodeMaterial from "three-msdf-text-utils/src/MSDFTextNodeMaterial";
import { attribute, clamp, float, mix, mrt, smoothstep, step, texture, uniform } from "three/tsl";

// Height of one line of text in world units
const TARGET_LINE_HEIGHT = 0.5;
// Longer texts are scaled down to fit this width (world units)
const MAX_TEXT_WIDTH = 2.6;

export default class MSDFText {
  #worldPositionBounds = new THREE.Box3();

  initialize({ text, fontData, fontAtlasTexture, perlinTexture, uProgress }) {
    const textGeometry = new MSDFTextGeometry({
      text,
      font: fontData,
      width: 1000,
      align: "center",
    });

    const textMaterial = this.#createTextMaterial(fontAtlasTexture, perlinTexture, uProgress);
    // Removes edge artifacts around the glyphs
    textMaterial.alphaTest = 0.1;

    const mesh = new THREE.Mesh(textGeometry, textMaterial);

    // layout.width is the wrap width, so measure the glyphs for the real text width
    textGeometry.computeBoundingBox();
    const { min, max } = textGeometry.boundingBox;
    const textScale = Math.min(TARGET_LINE_HEIGHT / fontData.common.lineHeight, MAX_TEXT_WIDTH / (max.x - min.x));
    mesh.scale.setScalar(textScale);
    mesh.position.set(-(textGeometry.layout.width / 2) * textScale, 0, 0);
    mesh.rotation.x = Math.PI;

    // World bounds are used to spawn particles from inside the text
    mesh.updateWorldMatrix(true, false);
    this.#worldPositionBounds.setFromObject(mesh);

    return mesh;
  }

  getRandomPositionInMesh() {
    const { min, max } = this.#worldPositionBounds;
    return new THREE.Vector3(
      THREE.MathUtils.randFloat(min.x, max.x),
      THREE.MathUtils.randFloat(min.y, max.y),
      Math.random() * 0.5
    );
  }

  #createTextMaterial(fontAtlasTexture, perlinTexture, uProgress) {
    const textMaterial = new MSDFTextNodeMaterial({
      map: fontAtlasTexture,
      transparent: true,
    });

    const glyphUv = attribute("glyphUv", "vec2");
    const center = attribute("center", "vec2");

    const uNoiseRemapMin = uniform(0.48);
    const uNoiseRemapMax = uniform(0.9);
    const uCenterScale = uniform(0.05);
    const uGlyphScale = uniform(0.75);
    const uDissolvedColor = uniform(new THREE.Color("#5E5E5E"));
    const uDesatComplete = uniform(0.45);
    const uBaseColor = uniform(new THREE.Color("#ECCFA3"));

    // Noise is sampled per glyph so each letter erodes differently
    const customUv = center.mul(uCenterScale).add(glyphUv.mul(uGlyphScale));
    const perlinNoise = texture(perlinTexture, customUv).x;
    const perlinRemap = clamp(perlinNoise.sub(uNoiseRemapMin).div(uNoiseRemapMax.sub(uNoiseRemapMin)), 0, 1);
    const dissolve = step(uProgress, perlinRemap);
    const desaturationProgress = smoothstep(float(0.0), uDesatComplete, uProgress);

    textMaterial.colorNode = mix(uBaseColor, uDissolvedColor, desaturationProgress);
    textMaterial.opacityNode = textMaterial.opacityNode.mul(dissolve);
    textMaterial.mrtNode = mrt({
      bloomIntensity: float(0.4).mul(dissolve),
    });

    return textMaterial;
  }
}
