import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32 } from '../lib/rng';
import { BOARD_SIZE } from '../lib/sections';
import { runtime, MAX_RIPPLES } from '../store/runtime';
import { useStore } from '../store/useStore';
import { createTraceMaterial } from './shaders';

type P = [number, number]; // x, z

/**
 * Octilinear routing like a real PCB: straight run, 45° diagonal, straight
 * run. `split` decides how much of the straight part comes before the
 * diagonal so bundles of parallel traces can share it.
 */
function route(a: P, b: P, split: number): P[] {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const ax = Math.abs(dx);
  const az = Math.abs(dz);
  const sx = Math.sign(dx);
  const sz = Math.sign(dz);
  if (ax >= az) {
    const s = (ax - az) * split;
    const p1: P = [a[0] + sx * s, a[1]];
    const p2: P = [p1[0] + sx * az, b[1]];
    return [a, p1, p2, b];
  }
  const s = (az - ax) * split;
  const p1: P = [a[0], a[1] + sz * s];
  const p2: P = [b[0], p1[1] + sz * ax];
  return [a, p1, p2, b];
}

/** A group of parallel traces between two regions. */
function bundle(a: P, b: P, n: number, spacing: number, split: number, axis: 'x' | 'z'): P[][] {
  const out: P[][] = [];
  for (let i = 0; i < n; i++) {
    const o = (i - (n - 1) / 2) * spacing;
    const aa: P = axis === 'x' ? [a[0] + o, a[1]] : [a[0], a[1] + o];
    const bb: P = axis === 'x' ? [b[0] + o, b[1]] : [b[0], b[1] + o];
    out.push(route(aa, bb, split));
  }
  return out;
}

/** Areas occupied by big components — filler traces avoid them. */
const KEEP_OUT: [number, number, number, number][] = [
  [-22, -14, -10, -2], // CPU + socket
  [-8, -15, 4, -9], // RAM
  [5, -10, 19, -4], // GPU
  [5, -2, 19, 3.2], // storage
  [-31, 10, 17, 14], // bus
  [23, 8, 33, 20], // port
  [-29, 16.5, -25, 19.5], // power
];
const inKeepOut = ([x, z]: P) => KEEP_OUT.some(([x0, z0, x1, z1]) => x > x0 - 0.4 && x < x1 + 0.4 && z > z0 - 0.4 && z < z1 + 0.4);

export function generateTraces() {
  const rnd = mulberry32(1337);
  const paths: { pts: P[]; width: number }[] = [];
  const add = (list: P[][], width = 0.12) => list.forEach((pts) => paths.push({ pts, width }));

  add(bundle([-10.6, -8.5], [-7, -11.6], 8, 0.32, 0.5, 'z')); // CPU -> RAM
  add(bundle([-16, -2.6], [-20, 10.2], 10, 0.34, 0.35, 'x')); // CPU -> bus
  add(bundle([-10.6, -5.2], [5.2, -7], 8, 0.3, 0.6, 'z')); // CPU -> PCIe
  add(bundle([16.6, 12], [23.2, 14], 8, 0.3, 0.3, 'z')); // bus -> port
  add(bundle([-27, 16.4], [-23, -6.5], 3, 0.4, 0.2, 'x'), 0.16); // power -> VRM
  add(bundle([-23.5, -8], [-21.4, -8], 6, 0.34, 0.5, 'z'), 0.16); // VRM -> CPU
  add(bundle([3, -11.5], [5.5, -8.5], 6, 0.3, 0.5, 'z')); // RAM -> PCIe
  for (let i = 0; i < 6; i++) {
    const x = 6.5 + i * 2.2;
    add(bundle([x, 2.8], [x - 3.2, 10.2], 2, 0.28, 0.3, 'x')); // drives -> bus
  }

  // Random filler traces fill empty board space.
  let tries = 0;
  while (paths.length < 140 && tries++ < 3000) {
    const a: P = [(rnd() - 0.5) * (BOARD_SIZE.w - 4), (rnd() - 0.5) * (BOARD_SIZE.d - 4)];
    const len = 3 + rnd() * 9;
    const ang = (Math.floor(rnd() * 8) * Math.PI) / 4 + (rnd() - 0.5) * 0.6;
    const b: P = [a[0] + Math.cos(ang) * len, a[1] + Math.sin(ang) * len];
    const pts = route(a, b, rnd());
    const ok = pts.every((p) => !inKeepOut(p) && Math.abs(p[0]) < BOARD_SIZE.w / 2 - 1.5 && Math.abs(p[1]) < BOARD_SIZE.d / 2 - 1.5);
    // check the midpoints too
    const mids = pts.slice(1).map((p, i): P => [(p[0] + pts[i][0]) / 2, (p[1] + pts[i][1]) / 2]);
    if (ok && mids.every((p) => !inKeepOut(p))) paths.push({ pts, width: 0.07 + rnd() * 0.05 });
  }
  return paths;
}

/** Turn polylines into one ribbon mesh with per-vertex distance / side / seed attributes. */
export function buildTraceGeometry(paths: { pts: P[]; width: number }[], y: number, seedBase = 0) {
  const pos: number[] = [];
  const dist: number[] = [];
  const side: number[] = [];
  const seed: number[] = [];
  const idx: number[] = [];
  const rnd = mulberry32(99 + seedBase);
  let v = 0;
  for (const { pts, width } of paths) {
    const s = rnd();
    let acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i];
      const [x1, z1] = pts[i + 1];
      const dx = x1 - x0;
      const dz = z1 - z0;
      const len = Math.hypot(dx, dz);
      if (len < 1e-4) continue;
      const ux = dx / len;
      const uz = dz / len;
      const nx = -uz * (width / 2);
      const nz = ux * (width / 2);
      // extend each segment by half the width so corners overlap cleanly
      const ex = ux * width * 0.5;
      const ez = uz * width * 0.5;
      const ax = x0 - ex;
      const az = z0 - ez;
      const bx = x1 + ex;
      const bz = z1 + ez;
      pos.push(ax + nx, y, az + nz, ax - nx, y, az - nz, bx + nx, y, bz + nz, bx - nx, y, bz - nz);
      dist.push(acc, acc, acc + len, acc + len);
      side.push(1, -1, 1, -1);
      seed.push(s, s, s, s);
      idx.push(v, v + 2, v + 1, v + 1, v + 2, v + 3);
      v += 4;
      acc += len;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aDist', new THREE.Float32BufferAttribute(dist, 1));
  g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1));
  g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/** Test points TP1–TP9 (gold pads printed into the board texture). */
export const TEST_POINTS: P[] = [
  [-20.5, 1.2],
  [-8.5, 7.6],
  [3.6, 5.6],
  [20.2, 4.2],
  [21.5, -12],
  [-27.5, -17.5],
  [-3, -17.5],
  [-29.5, 3.5],
  [29.6, -3],
];

/** Keeps a signal material's uniforms in sync with runtime every frame. */
export function useTraceUniforms(material: THREE.ShaderMaterial, gain = 1) {
  const godMode = useStore((s) => s.godMode);
  useFrame((state) => {
    const u = material.uniforms;
    const t = state.clock.elapsedTime;
    // cheat mode: the board pulses on its own every couple of seconds
    if (godMode && t - runtime.signalStart > 1.8) runtime.signalStart = t;
    u.uTime.value = t;
    u.uSignalStart.value = runtime.signalStart;
    u.uSignalGain.value = gain * (1 + runtime.heat * 0.6);
    u.uPower.value = 1 - runtime.powerDown;
    const arr = u.uRipples.value as THREE.Vector4[];
    for (let i = 0; i < MAX_RIPPLES; i++) {
      const r = runtime.ripples[i];
      if (r) arr[i].set(r.x, r.z, r.start, 1);
      else arr[i].w = 0;
    }
  });
}

let cachedTraces: ReturnType<typeof generateTraces> | null = null;
/** Same routing for the baked copper texture and the signal overlay. */
export function getTraces() {
  return (cachedTraces ??= generateTraces());
}

export function Traces() {
  const { geometry, viaGeometry, viaMatrices } = useMemo(() => {
    const paths = getTraces();
    const geometry = buildTraceGeometry(paths, 0.012);
    // Gold vias at each trace end (instanced).
    const ends: P[] = [];
    paths.forEach(({ pts }) => ends.push(pts[0], pts[pts.length - 1]));
    const m = new THREE.Matrix4();
    const viaMatrices = ends.map(([x, z]) => m.clone().makeTranslation(x, 0.008, z));
    return { geometry, viaGeometry: new THREE.CylinderGeometry(0.11, 0.11, 0.016, 12), viaMatrices };
  }, []);
  const material = useMemo(() => createTraceMaterial(), []);
  const viaMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#C9A24B', metalness: 1, roughness: 0.32 }), []);
  useTraceUniforms(material);

  useEffect(
    () => () => {
      geometry.dispose();
      viaGeometry.dispose();
      material.dispose();
      viaMaterial.dispose();
    },
    [geometry, viaGeometry, material, viaMaterial],
  );

  return (
    <group>
      <mesh geometry={geometry} material={material} raycast={() => null} renderOrder={2} />
      <instancedMesh
        args={[viaGeometry, viaMaterial, viaMatrices.length]}
        raycast={() => null}
        ref={(im) => {
          if (!im) return;
          viaMatrices.forEach((mm, i) => im.setMatrixAt(i, mm));
          im.instanceMatrix.needsUpdate = true;
          im.computeBoundingSphere();
        }}
      />
    </group>
  );
}
