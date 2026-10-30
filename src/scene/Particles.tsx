import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32 } from '../lib/rng';

/**
 * Dust in the lamp light: a few hundred tiny, slow, warm-grey motes. Not
 * additive and not glowing — they're only visible because the lamp lights
 * them. All motion happens in the vertex shader.
 */
const vert = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * (0.05 + aSeed * 0.06);
    p.x += sin(t + aSeed * 40.0) * 1.6;
    p.z += cos(t * 0.8 + aSeed * 23.0) * 1.6;
    p.y = mod(p.y + uTime * (0.02 + aSeed * 0.03), 16.0) + 0.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (1.0 + aSeed * 2.2) * uPixelRatio * (16.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
    vAlpha = smoothstep(0.4, 2.5, p.y) * smoothstep(16.0, 10.0, p.y) * (0.25 + aSeed * 0.35);
  }
`;
const frag = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.15, d) * vAlpha;
    gl_FragColor = vec4(vec3(0.86, 0.8, 0.7), a);
  }
`;

export function Particles({ count }: { count: number }) {
  const geometry = useMemo(() => {
    const rnd = mulberry32(5);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // concentrated under the lamp (upper-left of the board)
      pos[i * 3] = (rnd() - 0.6) * 70;
      pos[i * 3 + 1] = rnd() * 16;
      pos[i * 3 + 2] = (rnd() - 0.5) * 50;
      seed[i] = rnd();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 8, 0), 60);
    return g;
  }, [count]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio.value = state.viewport.dpr;
  });
  return <points geometry={geometry} material={material} raycast={() => null} />;
}
