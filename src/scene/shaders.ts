import * as THREE from 'three';
import { MAX_RIPPLES } from '../store/runtime';

/**
 * SIGNAL SHADER
 * -------------
 * The copper itself is baked into the board textures (static, under the
 * mask). This material is a transparent overlay drawn on the same paths,
 * and it is invisible almost all of the time. It shows:
 *
 *  1. A signal edge travelling along every trace (in the direction of
 *     increasing `aDist`) after `uSignalStart` — fired when the camera
 *     arrives at a section or the board is clicked. Front position is
 *     `age * speed`; brightness is a narrow gaussian around it that fades
 *     with age.
 *  2. Click ripples: rings expanding in world XZ from the click point
 *     (uRipples[i] = x, z, startTime, active), so the pulse appears to run
 *     *through the copper* from where you touched the board.
 *
 * Colour is a pale warm copper, kept under ~1.0 so it doesn't bloom much:
 * the signal is a cue, not decoration.
 */
const traceVertex = /* glsl */ `
  attribute float aDist;
  attribute float aSide;
  attribute float aSeed;
  varying float vDist;
  varying float vSide;
  varying float vSeed;
  varying vec3 vWorld;
  void main() {
    vDist = aDist;
    vSide = aSide;
    vSeed = aSeed;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const traceFragment = /* glsl */ `
  uniform float uTime;
  uniform float uSignalStart;
  uniform float uSignalGain;
  uniform vec3 uColor;
  uniform vec4 uRipples[${MAX_RIPPLES}];
  uniform float uPower;
  varying float vDist;
  varying float vSide;
  varying float vSeed;
  varying vec3 vWorld;

  void main() {
    float core = 1.0 - vSide * vSide;
    float age = uTime - uSignalStart;
    float signal = 0.0;
    if (age > 0.0 && age < 4.0) {
      float front = age * (16.0 + vSeed * 6.0) - vSeed * 3.0;
      float d = vDist - front;
      // sharp leading edge, short tail
      signal = exp(-d * d * 0.9) * step(d, 0.4) + exp(-max(-d, 0.0) * 0.6) * step(d, 0.0) * 0.18;
      signal *= exp(-age * 0.9) * uSignalGain;
    }
    float ring = 0.0;
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 r = uRipples[i];
      if (r.w < 0.5) continue;
      float a = uTime - r.z;
      if (a < 0.0 || a > 2.5) continue;
      float dd = distance(vWorld.xz, r.xy) - a * 14.0;
      ring += exp(-dd * dd * 0.6) * exp(-a * 1.6);
    }
    float e = (signal + ring * 0.9) * core * uPower;
    gl_FragColor = vec4(uColor * e, e);
  }
`;

export function createTraceMaterial() {
  const ripples = Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, -100, 0));
  return new THREE.ShaderMaterial({
    vertexShader: traceVertex,
    fragmentShader: traceFragment,
    uniforms: {
      uTime: { value: 0 },
      uSignalStart: { value: -100 },
      uSignalGain: { value: 1 },
      uColor: { value: new THREE.Color('#F4B17A') },
      uRipples: { value: ripples },
      uPower: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}

const uvVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Heat shimmer above the CPU — only visible while it's actually hot. */
const shimmerFragment = /* glsl */ `
  uniform float uTime;
  uniform float uHeat;
  varying vec2 vUv;
  void main() {
    float y = vUv.y;
    float wave = sin(vUv.x * 16.0 + uTime * 2.4 + sin(y * 8.0 - uTime * 1.6) * 2.0);
    float bands = smoothstep(0.7, 1.0, wave);
    float fade = smoothstep(0.0, 0.3, y) * smoothstep(1.0, 0.4, y) * smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
    float a = bands * fade * uHeat * uHeat * 0.12;
    gl_FragColor = vec4(vec3(1.0, 0.92, 0.85), a);
  }
`;

export function createShimmerMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: uvVertex,
    fragmentShader: shimmerFragment,
    uniforms: { uTime: { value: 0 }, uHeat: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}
