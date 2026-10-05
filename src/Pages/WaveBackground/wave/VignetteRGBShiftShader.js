// Darkens the screen edges and splits the colour channels there (chromatic aberration)
export const VignetteRGBShiftShader = {
  uniforms: {
    tDiffuse: { value: null },
    shiftAmount: { value: 0.005 }, // maximum colour split
    vignetteRadius: { value: 0.3 }, // where the effect starts (0 to 1)
    vignetteSoftness: { value: 0.3 }, // falloff of the effect
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float shiftAmount;
    uniform float vignetteRadius;
    uniform float vignetteSoftness;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      float dist = distance(vUv, center);
      float horzQuadrant = sign(vUv.x - center.x);
      float vertQuadrant = sign(vUv.y - center.y);

      // 0 in the middle of the screen, towards 1 in the corners
      float vignetteFactor = smoothstep(vignetteRadius, vignetteRadius + vignetteSoftness, dist);
      vec2 shift = shiftAmount * vignetteFactor * vec2(horzQuadrant, vertQuadrant);

      float r = texture2D(tDiffuse, vUv + shift).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - shift).b;

      float darken = 1.0 - vignetteFactor * 0.5;
      gl_FragColor = vec4(vec3(r, g, b) * darken, 1.0);
    }
  `,
};
