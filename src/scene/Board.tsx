import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32 } from '../lib/rng';
import { BOARD_SIZE } from '../lib/sections';
import { PALETTE } from '../lib/themes';
import { ANCHORS } from './anchors';
import { addRipple, runtime } from '../store/runtime';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { siteContent } from '../content/siteContent';
import { createBoardTextures, createMarkingTexture, createMetalTextures } from './textures';
import { useFontsReady, useHoverCursor } from './helpers';
import { getTraces, TEST_POINTS } from './Traces';

export const BOARD_THICKNESS = 0.16;
export const BENCH_Y = -0.95;

const KEEP_OUT: [number, number, number, number][] = [
  [-22.5, -14, -9.5, -2],
  [-8.5, -15.5, 4.5, -8.5],
  [4.5, -10.5, 19.5, -3.5],
  [4.5, -2.5, 19.5, 3.6],
  [-31, 9.5, 17.5, 14.5],
  [22.5, 7.5, 33, 20],
  [-29.5, 15.5, -23.5, 20],
  [17, 13, 31, 21.5], // sticky note / tape area
];
const blocked = (x: number, z: number, pad = 0.6) =>
  KEEP_OUT.some(([x0, z0, x1, z1]) => x > x0 - pad && x < x1 + pad && z > z0 - pad && z < z1 + pad) ||
  TEST_POINTS.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < 1.2) ||
  Math.abs(x) > BOARD_SIZE.w / 2 - 1.8 ||
  Math.abs(z) > BOARD_SIZE.d / 2 - 1.8;

interface Placed {
  m: THREE.Matrix4;
  c?: THREE.Color;
}

/**
 * Seeded placement of passives. Real boards aren't perfect: most parts sit
 * on a 0°/90° grid, but some are a few degrees off or nudged off-grid.
 */
function scatter() {
  const rnd = mulberry32(2024);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const jitter = () => (rnd() > 0.85 ? (rnd() - 0.5) * 0.18 : (rnd() - 0.5) * 0.02);
  const sample = (pad: number) => {
    for (let i = 0; i < 60; i++) {
      const x = (rnd() - 0.5) * BOARD_SIZE.w;
      const z = (rnd() - 0.5) * BOARD_SIZE.d;
      if (!blocked(x, z, pad)) return [x, z] as const;
    }
    return null;
  };

  const capsA: Placed[] = [];
  const capsB: Placed[] = [];
  for (let i = 0; i < 34; i++) {
    const p = sample(0.7);
    if (!p) continue;
    const r = 0.3 + rnd() * 0.16;
    const h = 0.65 + rnd() * 0.5;
    q.setFromAxisAngle(up, rnd() * Math.PI * 2);
    m.compose(new THREE.Vector3(p[0], h / 2, p[1]), q, new THREE.Vector3(r, h, r));
    (rnd() > 0.35 ? capsA : capsB).push({ m: m.clone() });
  }
  for (let i = 0; i < 8; i++) {
    q.setFromAxisAngle(up, rnd() * 6);
    m.compose(new THREE.Vector3(-21.6 + (rnd() - 0.5) * 0.06, 0.45, -12.8 + i * 1.12), q, new THREE.Vector3(0.4, 0.9, 0.4));
    capsA.push({ m: m.clone() });
  }

  const ceramics: Placed[] = [];
  const tan = new THREE.Color(PALETTE.ceramic);
  const brown = new THREE.Color('#7C5E3C');
  for (let i = 0; i < 170; i++) {
    const p = sample(0.3);
    if (!p) continue;
    q.setFromAxisAngle(up, (rnd() > 0.5 ? 0 : Math.PI / 2) + jitter());
    m.compose(new THREE.Vector3(p[0], 0.07, p[1]), q, new THREE.Vector3(1, 1, 1));
    ceramics.push({ m: m.clone(), c: tan.clone().lerp(brown, rnd()) });
  }

  const resistors: Placed[] = [];
  for (let i = 0; i < 120; i++) {
    const p = sample(0.3);
    if (!p) continue;
    q.setFromAxisAngle(up, (rnd() > 0.5 ? 0 : Math.PI / 2) + jitter());
    m.compose(new THREE.Vector3(p[0], 0.05, p[1]), q, new THREE.Vector3(1, 1, 1));
    resistors.push({ m: m.clone() });
  }

  const chips: Placed[] = [];
  const pins: Placed[] = [];
  for (let i = 0; i < 18; i++) {
    const p = sample(1.7);
    if (!p) continue;
    const s = 0.9 + rnd() * 1.1;
    const rot = jitter() * 0.6;
    q.setFromAxisAngle(up, rot);
    m.compose(new THREE.Vector3(p[0], 0.1, p[1]), q, new THREE.Vector3(s, 1, s));
    chips.push({ m: m.clone() });
    const per = Math.max(3, Math.round(s * 4));
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    for (let side = 0; side < 4; side++) {
      for (let k = 0; k < per; k++) {
        const t = ((k + 0.5) / per - 0.5) * s * 0.85;
        const off = s / 2 + 0.08;
        const [lx, lz] = side === 0 ? [t, off] : side === 1 ? [t, -off] : side === 2 ? [off, t] : [-off, t];
        const wx = lx * cos + lz * sin;
        const wz = -lx * sin + lz * cos;
        q.setFromAxisAngle(up, rot + (side < 2 ? 0 : Math.PI / 2));
        m.compose(new THREE.Vector3(p[0] + wx, 0.03, p[1] + wz), q, new THREE.Vector3(1, 1, 1));
        pins.push({ m: m.clone() });
      }
    }
  }
  const chokes: Placed[] = [];
  for (let i = 0; i < 6; i++) {
    m.compose(new THREE.Vector3(-24.2, 0.4, -11.5 + i * 1.3), q.identity(), new THREE.Vector3(1, 1, 1));
    chokes.push({ m: m.clone() });
  }
  return { capsA, capsB, ceramics, resistors, chips, pins, chokes };
}

function Instanced({ items, geometry, material }: { items: Placed[]; geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] }) {
  return (
    <instancedMesh
      args={[geometry, material as THREE.Material, items.length]}
      raycast={() => null}
      castShadow
      receiveShadow
      ref={(im) => {
        if (!im) return;
        items.forEach((it, i) => {
          im.setMatrixAt(i, it.m);
          if (it.c) im.setColorAt(i, it.c);
        });
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.computeBoundingSphere();
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Status LEDs — the only things on the board that emit light.         */
/* Each has its own colour and blink pattern, and each one *means*     */
/* something.                                                          */
/* ------------------------------------------------------------------ */

type Pattern = 'steady' | 'heartbeat' | 'activity' | 'slow' | 'fault' | 'link' | 'flash';
const LEDS: { ref: string; pos: [number, number]; color: string; pattern: Pattern; gain: number }[] = [
  { ref: 'D1', pos: [-25.4, 17.9], color: '#7CFF6A', pattern: 'steady', gain: 2.2 }, // power
  { ref: 'D2', pos: [-21.6, -2.4], color: '#9BFF7A', pattern: 'heartbeat', gain: 2.0 }, // CPU heartbeat
  { ref: 'D3', pos: [5.4, 3.3], color: '#FF5A1F', pattern: 'activity', gain: 2.6 }, // drive activity (the accent LED)
  { ref: 'D4', pos: [-29.2, 12.4], color: '#FFB341', pattern: 'slow', gain: 1.8 }, // bus clock
  { ref: 'D5', pos: [-26.2, -15.6], color: '#FF3A26', pattern: 'fault', gain: 2.4 }, // thermal fault
  { ref: 'D6', pos: [23.6, 18.6], color: '#7CFF6A', pattern: 'link', gain: 2.0 }, // network link
  { ref: 'D7', pos: [4.6, -14.2], color: '#B6FF8E', pattern: 'flash', gain: 1.6 }, // memory access
];

function StatusLeds() {
  const lens = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const godMode = useStore((s) => s.godMode);
  const off = useMemo(() => new THREE.Color('#3b3a33'), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  const colors = useMemo(() => LEDS.map((l) => new THREE.Color(l.color)), []);
  const activity = useRef(0);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    runtime.ledFlash = Math.max(0, runtime.ledFlash - dt * 6); // quick, real-looking blink
    // drive activity: random short reads, more when something happens
    activity.current = Math.max(0, activity.current - dt * 14);
    if (Math.random() < dt * (0.6 + runtime.ledFlash * 30)) activity.current = 1;
    const linked = useStore.getState().pluggedIn.length > 0;
    LEDS.forEach((l, i) => {
      const mat = lens.current[i];
      if (!mat) return;
      let v = 0;
      switch (l.pattern) {
        case 'steady':
          v = 1;
          break;
        case 'heartbeat': {
          const b = (t * (1 + runtime.heat * 1.5)) % 1.2;
          v = b < 0.08 || (b > 0.22 && b < 0.3) ? 1 : 0;
          break;
        }
        case 'activity':
          v = activity.current > 0.5 ? 1 : 0;
          break;
        case 'slow':
          v = Math.sin(t * Math.PI) > 0 ? 1 : 0;
          break;
        case 'fault':
          v = runtime.heat > 0.9 ? (Math.sin(t * 18) > 0 ? 1 : 0.2) : 0;
          break;
        case 'link':
          v = linked ? (Math.random() < 0.08 ? 0 : 1) : 0;
          break;
        case 'flash':
          v = runtime.ledFlash > 0.4 ? 1 : 0;
          break;
      }
      if (godMode) v = Math.sin(t * 6 - i * 0.9) > 0.3 ? 1 : 0;
      v *= 1 - runtime.powerDown;
      if (v > 0.01) mat.color.copy(tmp.copy(colors[i]).multiplyScalar(l.gain * v));
      else mat.color.copy(off);
    });
  });

  return (
    <group>
      {LEDS.map((l, i) => (
        <group key={l.ref} position={[l.pos[0], 0, l.pos[1]]}>
          {/* 0805 package: white body, coloured lens on top */}
          <mesh position={[0, 0.06, 0]} raycast={() => null}>
            <boxGeometry args={[0.34, 0.12, 0.2]} />
            <meshStandardMaterial color="#d8d3c4" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.125, 0]} raycast={() => null}>
            <boxGeometry args={[0.22, 0.02, 0.14]} />
            <meshBasicMaterial ref={(m) => (lens.current[i] = m)} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** SW1: a tactile switch you can actually press. */
function PowerButton() {
  const cap = useRef<THREE.Mesh>(null);
  const press = useRef(0);
  const hover = useHoverCursor();
  useFrame((_, dt) => {
    press.current = Math.max(0, press.current - dt * 5);
    if (cap.current) cap.current.position.y = 0.55 - Math.sin(Math.min(1, press.current) * Math.PI) * 0.12;
  });
  return (
    <group position={ANCHORS.power}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.6, 0.4, 1.6]} />
        <meshStandardMaterial color="#161514" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.41, 0]} raycast={() => null}>
        <boxGeometry args={[1.62, 0.03, 1.62]} />
        <meshStandardMaterial color={PALETTE.steel} metalness={1} roughness={0.35} />
      </mesh>
      <mesh
        ref={cap}
        position={[0, 0.55, 0]}
        {...hover}
        onClick={(e) => {
          e.stopPropagation();
          press.current = 1;
          runtime.ledFlash = 1;
          addRipple(ANCHORS.power.x, ANCHORS.power.z);
          playSound('click');
          useStore.getState().toast({ title: 'SW1', body: 'Already on. The real switch is at the end of the page.' });
        }}
      >
        <cylinderGeometry args={[0.42, 0.44, 0.3, 28]} />
        <meshStandardMaterial color="#232220" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Easter egg: one chip with no markings, slightly crooked, in the far corner. */
function HiddenChip() {
  const hover = useHoverCursor();
  return (
    <group position={[30.4, 0, -19.1]} rotation={[0, 0.14, 0]}>
      <mesh
        position={[0, 0.08, 0]}
        {...hover}
        onClick={(e) => {
          e.stopPropagation();
          const s = useStore.getState();
          s.setSecretMessage(siteContent.easterEggs.hiddenChip);
          s.unlock('chip');
          runtime.ledFlash = 1;
          playSound('success');
        }}
      >
        <boxGeometry args={[0.8, 0.16, 0.8]} />
        <meshStandardMaterial color="#141312" roughness={0.42} />
      </mesh>
    </group>
  );
}

/** Brass standoffs at the mounting holes, holding the board off the bench. */
function Standoffs() {
  const holes: [number, number][] = [
    [-31, -20.5],
    [31, -20.5],
    [-31, 20.5],
    [31, 20.5],
    [0, -20.5],
    [0, 20.5],
  ];
  const h = -BENCH_Y - BOARD_THICKNESS;
  return (
    <group>
      {holes.map(([x, z]) => (
        <group key={`${x},${z}`} position={[x, 0, z]}>
          <mesh position={[0, -BOARD_THICKNESS - h / 2, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.42, 0.42, h, 6]} />
            <meshStandardMaterial color="#A88A4C" metalness={1} roughness={0.38} />
          </mesh>
          <mesh position={[0, 0.06, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.55, 0.55, 0.12, 20]} />
            <meshStandardMaterial color={PALETTE.steel} metalness={1} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.125, 0]} raycast={() => null}>
            <boxGeometry args={[0.7, 0.02, 0.1]} />
            <meshStandardMaterial color="#45464a" metalness={1} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Board() {
  const fonts = useFontsReady();
  const data = useMemo(() => scatter(), []);
  const maps = useMemo(
    () =>
      createBoardTextures({
        boardW: BOARD_SIZE.w,
        boardD: BOARD_SIZE.d,
        traces: getTraces(),
        logo: siteContent.bench.logo,
        testPoints: TEST_POINTS,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fonts],
  );
  useEffect(() => () => Object.values(maps).forEach((t) => t.dispose()), [maps]);

  const res = useMemo(() => {
    const alu = createMetalTextures({ seed: 9 });
    const chipMark = createMarkingTexture({ lines: ['74HC595', 'TI 2347', 'E4'], size: 0.16 });
    const plastic = new THREE.MeshStandardMaterial({ color: PALETTE.plastic, roughness: 0.55 });
    const capTop = new THREE.MeshStandardMaterial({ color: '#B9BAB6', metalness: 1, roughness: 0.42 });
    return {
      alu,
      chipMark,
      capGeo: new THREE.CylinderGeometry(1, 1, 1, 22),
      sleeveA: [new THREE.MeshStandardMaterial({ color: '#1E1D1B', roughness: 0.45 }), capTop, capTop],
      sleeveB: [new THREE.MeshStandardMaterial({ color: '#263027', roughness: 0.45 }), capTop, capTop],
      ceramicGeo: new THREE.BoxGeometry(0.34, 0.14, 0.18),
      ceramicMat: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7 }),
      resGeo: new THREE.BoxGeometry(0.42, 0.1, 0.22),
      resMat: new THREE.MeshStandardMaterial({ color: '#151413', roughness: 0.6 }),
      chipGeo: new THREE.BoxGeometry(1, 0.2, 1),
      chipMats: [plastic, plastic, new THREE.MeshStandardMaterial({ map: chipMark, roughness: 0.5, emissive: new THREE.Color('#000') }), plastic, plastic, plastic],
      pinGeo: new THREE.BoxGeometry(0.06, 0.04, 0.18),
      pinMat: new THREE.MeshStandardMaterial({ color: '#C8C8C4', metalness: 1, roughness: 0.3 }),
      chokeGeo: new THREE.BoxGeometry(0.95, 0.8, 0.95),
      chokeMat: new THREE.MeshStandardMaterial({ color: PALETTE.ferrite, roughness: 0.75 }),
      sinkGeo: new THREE.BoxGeometry(0.12, 1.4, 7.5),
      sinkMat: new THREE.MeshStandardMaterial({ map: alu.map, roughnessMap: alu.roughnessMap, metalness: 1, roughness: 1 }),
      plastic,
    };
  }, []);
  useEffect(
    () => () => {
      res.alu.map.dispose();
      res.alu.roughnessMap.dispose();
      res.chipMark.dispose();
      [res.capGeo, res.ceramicGeo, res.resGeo, res.chipGeo, res.pinGeo, res.chokeGeo, res.sinkGeo].forEach((g) => g.dispose());
      [...res.sleeveA, ...res.sleeveB, res.ceramicMat, res.resMat, ...res.chipMats, res.pinMat, res.chokeMat, res.sinkMat].forEach((m) => m.dispose());
    },
    [res],
  );

  const sinkFins = useMemo(() => {
    const m = new THREE.Matrix4();
    return Array.from({ length: 12 }, (_, i) => ({ m: m.clone().makeTranslation(-26.2 + i * 0.3, 0.7, -8.2) }));
  }, []);

  const onBoardDown = (e: ThreeEvent<PointerEvent>) => {
    addRipple(e.point.x, e.point.z);
    runtime.ledFlash = 1;
    playSound('click');
  };

  return (
    <group>
      {/* FR4 edge + solder-mask top */}
      <mesh position={[0, -BOARD_THICKNESS / 2, 0]} raycast={() => null}>
        <boxGeometry args={[BOARD_SIZE.w, BOARD_THICKNESS, BOARD_SIZE.d]} />
        <meshStandardMaterial color="#5B5A3E" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} onPointerDown={onBoardDown}>
        <planeGeometry args={[BOARD_SIZE.w, BOARD_SIZE.d]} />
        <meshStandardMaterial
          map={maps.map}
          roughnessMap={maps.roughnessMap}
          metalnessMap={maps.metalnessMap}
          normalMap={maps.normalMap}
          normalScale={new THREE.Vector2(0.6, 0.6)}
          roughness={1}
          metalness={1}
        />
      </mesh>
      <Standoffs />
      <Instanced items={data.capsA} geometry={res.capGeo} material={res.sleeveA} />
      <Instanced items={data.capsB} geometry={res.capGeo} material={res.sleeveB} />
      <Instanced items={data.ceramics} geometry={res.ceramicGeo} material={res.ceramicMat} />
      <Instanced items={data.resistors} geometry={res.resGeo} material={res.resMat} />
      <Instanced items={data.chips} geometry={res.chipGeo} material={res.chipMats} />
      <Instanced items={data.pins} geometry={res.pinGeo} material={res.pinMat} />
      <Instanced items={data.chokes} geometry={res.chokeGeo} material={res.chokeMat} />
      <Instanced items={sinkFins} geometry={res.sinkGeo} material={res.sinkMat} />
      {/* Y1 crystal */}
      <mesh position={[20.9, 0.2, -12.6]} rotation={[0, 0.03, 0]} raycast={() => null}>
        <boxGeometry args={[1.3, 0.4, 0.5]} />
        <meshStandardMaterial color="#C5C6C2" metalness={1} roughness={0.25} />
      </mesh>
      <StatusLeds />
      <PowerButton />
      <HiddenChip />
    </group>
  );
}
