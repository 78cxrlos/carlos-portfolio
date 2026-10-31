import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { ANCHORS } from './anchors';
import { damp, smoothstep } from '../lib/rng';
import { PALETTE } from '../lib/themes';
import { runtime } from '../store/runtime';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { siteContent } from '../content/siteContent';
import { createShimmerMaterial } from './shaders';
import { createMarkingTexture, createMetalTextures } from './textures';
import { SceneHint, hideSceneTip, showSceneTip, stationProximity, useFontsReady } from './helpers';
import { ui } from '../content/uiStrings';

import { Fan } from './Fan';

const CORE_COLS = 4;
const HOLD_MS = 240;
const CORE_W = 1.05;
const CORE_D = 2.05;

/**
 * Heat integration for hold-to-overclock. Lives outside the CPU so the HTML
 * "hold to overclock" button works even before the CPU has been mounted.
 */
export function Thermals() {
  const warned = useRef(false);
  const last = useRef(0);
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.1);
    runtime.heat = runtime.overclocking ? Math.min(1, runtime.heat + d * 0.3) : Math.max(0, runtime.heat - d * 0.16);
    runtime.fanBoost = Math.max(0, runtime.fanBoost - d * 0.5);
    if (runtime.heat >= 1 && !warned.current) {
      warned.current = true;
      const s = useStore.getState();
      s.toast({ tone: 'warn', title: 'Thermal limit · 104 °C', body: 'The CPU is throttling. Let go and it will cool down. No hardware was harmed.' });
      s.unlock('overclock');
      playSound('warn');
    }
    if (runtime.heat < 0.5) warned.current = false;
    const t = state.clock.elapsedTime;
    if (t - last.current > 0.1) {
      last.current = t;
      const s = useStore.getState();
      if (Math.abs(s.heat - runtime.heat) > 0.004) s.setHeat(runtime.heat);
    }
  });
  return null;
}

/** Die shot: eight cores, shared cache, I/O ring — printed onto dark silicon. */
function createDieTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#23262b';
  ctx.fillRect(0, 0, S, S);
  // I/O ring
  ctx.fillStyle = '#2d3036';
  ctx.fillRect(14, 14, S - 28, S - 28);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = '#5b5446';
    ctx.fillRect(20 + i * 11.8, 18, 6, 10);
    ctx.fillRect(20 + i * 11.8, S - 28, 6, 10);
  }
  // cores (4 x 2) with their L2 strip
  const cw = (S - 80) / 4;
  const chH = (S - 120) / 2;
  for (let r = 0; r < 2; r++)
    for (let col = 0; col < 4; col++) {
      const x = 40 + col * cw;
      const y = 40 + r * (chH + 40);
      ctx.fillStyle = '#343941';
      ctx.fillRect(x + 4, y, cw - 8, chH);
      for (let k = 0; k < 18; k++) {
        ctx.fillStyle = `rgba(150,160,170,${0.05 + ((k * 37) % 10) / 120})`;
        ctx.fillRect(x + 10, y + 8 + k * (chH / 19), cw - 20, chH / 40);
      }
      ctx.fillStyle = '#3c3a34';
      ctx.fillRect(x + 8, y + chH - 30, cw - 16, 22);
    }
  // shared cache band
  ctx.fillStyle = '#2f3339';
  ctx.fillRect(40, 40 + chH + 6, S - 80, 28);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = 'rgba(170,175,180,0.12)';
    ctx.fillRect(44 + i * 7.2, 40 + chH + 10, 4, 20);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function Cpu() {
  const fonts = useFontsReady();
  const facts = siteContent.about.facts.slice(0, 8);
  const selectedFact = useStore((s) => s.selectedFact);
  const setCursor = useStore((s) => s.setCursor);

  const shimmer = useMemo(() => createShimmerMaterial(), []);
  const die = useMemo(() => createDieTexture(), []);
  const lapped = useMemo(() => createMetalTextures({ circular: true, seed: 21, base: '#B4B3AE' }), []);
  const lidMark = useMemo(
    () =>
      createMarkingTexture({
        w: 512,
        h: 512,
        bg: '#B4B3AE',
        fg: 'rgba(40,40,40,0.55)',
        pin1: false,
        size: 0.075,
        lines: ['ITM-1  SIGNAL CORE', siteContent.person.name.toUpperCase(), '8C/16T  3.4 GHz', 'L3 32M  65 W', 'PLEASE DO NOT HOLD'],
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fonts],
  );
  const dieMat = useMemo(() => new THREE.MeshStandardMaterial({ map: die, metalness: 0.55, roughness: 0.22, emissive: new THREE.Color('#ff3c12'), emissiveIntensity: 0 }), [die]);
  const hitMat = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), []);
  const edge = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(CORE_W, CORE_D)), []);
  useEffect(() => () => [shimmer, dieMat, hitMat].forEach((m) => m.dispose()), [shimmer, dieMat, hitMat]);
  useEffect(() => () => [die, lapped.map, lapped.roughnessMap].forEach((t) => t.dispose()), [die, lapped]);
  useEffect(() => () => lidMark.dispose(), [lidMark]);
  useEffect(() => () => edge.dispose(), [edge]);

  const lidPivot = useRef<THREE.Group>(null);
  const heatLight = useRef<THREE.PointLight>(null);
  const outlines = useRef<(THREE.LineSegments | null)[]>([]);
  const open = useRef(0);
  const hovered = useRef<number | null>(null);
  const press = useRef<{ t: number; core: number | null } | null>(null);
  const bone = useMemo(() => new THREE.Color(PALETTE.bone), []);
  const accent = useMemo(() => new THREE.Color(PALETTE.accent), []);

  useFrame((state, dt) => {
    // Heat spreader lifts on its hinge as the camera arrives — weighted, with a small overshoot.
    const target = smoothstep(0.3, 0.85, stationProximity(1));
    open.current += (target - open.current) * damp(3, dt);
    if (lidPivot.current) {
      lidPivot.current.rotation.x = -open.current * 1.95;
      lidPivot.current.position.y = 0.72 + open.current * 0.25;
    }
    if (press.current && !runtime.overclocking && performance.now() - press.current.t > HOLD_MS) {
      runtime.overclocking = true;
      setCursor('hold');
    }
    const h2 = runtime.heat * runtime.heat;
    dieMat.emissiveIntensity = h2 * 0.9 * (1 - runtime.powerDown);
    if (heatLight.current) heatLight.current.intensity = h2 * 24;
    shimmer.uniforms.uTime.value = state.clock.elapsedTime;
    shimmer.uniforms.uHeat.value = runtime.heat;
    outlines.current.forEach((l, i) => {
      if (!l) return;
      const m = l.material as THREE.LineBasicMaterial;
      const sel = selectedFact === i;
      const hov = hovered.current === i;
      l.visible = sel || hov;
      m.color.copy(sel ? accent : bone);
    });
  });

  const release = () => {
    const p = press.current;
    press.current = null;
    if (!runtime.overclocking && p && p.core !== null) {
      const s = useStore.getState();
      s.selectFact(s.selectedFact === p.core ? null : p.core);
      s.markHint('cpu-core');
      runtime.ledFlash = 1;
      playSound('click');
    }
    runtime.overclocking = false;
    setCursor(hovered.current !== null ? 'hover' : 'default');
  };

  const onDown = (core: number | null) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    press.current = { t: performance.now(), core };
    window.addEventListener('pointerup', release, { once: true });
    window.addEventListener('pointercancel', release, { once: true });
  };
  const holdHandlers = {
    onPointerDown: onDown(null),
    onPointerOver: () => setCursor('hold'),
    onPointerOut: () => setCursor('default'),
  };

  return (
    <group position={ANCHORS.cpu}>
      {/* socket: black glass-filled plastic */}
      <mesh position={[0, 0.17, 0]} {...holdHandlers}>
        <boxGeometry args={[9.4, 0.34, 9.4]} />
        <meshStandardMaterial color="#1a1918" roughness={0.6} />
      </mesh>
      {/* retention frame: stamped steel */}
      {[
        [0, 4.5, 9.6, 0.4],
        [0, -4.5, 9.6, 0.4],
        [4.5, 0, 0.4, 9.6],
        [-4.5, 0, 0.4, 9.6],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.42, z]} raycast={() => null}>
          <boxGeometry args={[w, 0.16, d]} />
          <meshStandardMaterial color={PALETTE.steel} metalness={1} roughness={0.42} />
        </mesh>
      ))}
      <mesh position={[5.1, 0.5, 1]} rotation={[0, 0.04, 0]} raycast={() => null}>
        <boxGeometry args={[0.18, 0.18, 7.5]} />
        <meshStandardMaterial color="#AFB0AD" metalness={1} roughness={0.3} />
      </mesh>
      {/* substrate */}
      <mesh position={[0, 0.42, 0]} {...holdHandlers}>
        <boxGeometry args={[7.2, 0.16, 7.2]} />
        <meshStandardMaterial color="#2C4A2E" roughness={0.6} />
      </mesh>
      {/* die */}
      <mesh position={[0, 0.555, 0]} raycast={() => null}>
        <boxGeometry args={[5.1, 0.11, 5.1]} />
        <meshStandardMaterial attach="material-0" color="#2a2c30" metalness={0.5} roughness={0.3} />
        <meshStandardMaterial attach="material-1" color="#2a2c30" metalness={0.5} roughness={0.3} />
        <primitive object={dieMat} attach="material-2" />
        <meshStandardMaterial attach="material-3" color="#2a2c30" metalness={0.5} roughness={0.3} />
        <meshStandardMaterial attach="material-4" color="#2a2c30" metalness={0.5} roughness={0.3} />
        <meshStandardMaterial attach="material-5" color="#2a2c30" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* cores: invisible hit areas over the printed core blocks + a thin outline on hover / select */}
      {facts.map((f, i) => {
        const c = i % CORE_COLS;
        const r = Math.floor(i / CORE_COLS);
        return (
          <group key={f.label} position={[(c - 1.5) * 1.2, 0.615, (r - 0.5) * 2.25]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh
              material={hitMat}
              onPointerDown={onDown(i)}
              onPointerOver={(e) => {
                e.stopPropagation();
                hovered.current = i;
                setCursor('hover');
                playSound('hover');
                showSceneTip(e, `${f.label.split(' · ').pop()}. ${ui.hints.cpu}`);
              }}
              onPointerMove={(e) => showSceneTip(e, `${f.label.split(' · ').pop()}. ${ui.hints.cpu}`)}
              onPointerOut={() => {
                hovered.current = null;
                setCursor('default');
                hideSceneTip();
              }}
            >
              <planeGeometry args={[CORE_W, CORE_D]} />
            </mesh>
            <lineSegments ref={(l) => (outlines.current[i] = l)} geometry={edge} position={[0, 0, 0.004]} visible={false} raycast={() => null}>
              <lineBasicMaterial />
            </lineSegments>
          </group>
        );
      })}
      {/* integrated heat spreader, hinged at the back edge */}
      <group ref={lidPivot} position={[0, 0.72, -3.3]}>
        <mesh position={[0, 0.2, 3.3]} {...holdHandlers}>
          <boxGeometry args={[6.6, 0.4, 6.6]} />
          <meshStandardMaterial attach="material-0" color="#A9A8A3" metalness={1} roughness={0.35} />
          <meshStandardMaterial attach="material-1" color="#A9A8A3" metalness={1} roughness={0.35} />
          <meshStandardMaterial attach="material-2" map={lidMark} roughnessMap={lapped.roughnessMap} metalness={1} roughness={1} />
          <meshStandardMaterial attach="material-3" color="#7f7e79" metalness={1} roughness={0.5} />
          <meshStandardMaterial attach="material-4" color="#A9A8A3" metalness={1} roughness={0.35} />
          <meshStandardMaterial attach="material-5" color="#A9A8A3" metalness={1} roughness={0.35} />
        </mesh>
      </group>
      <pointLight ref={heatLight} position={[0, 1.4, 0]} color="#ff5a24" intensity={0} distance={10} decay={2} />
      <Billboard position={[0, 3.4, 0]}>
        <mesh material={shimmer} raycast={() => null}>
          <planeGeometry args={[6, 5]} />
        </mesh>
      </Billboard>
      <Fan position={[6.3, 0, -3.6]} radius={1.25} heatFactor={14} />
      <SceneHint id="cpu-core" section={1} position={[0, 2.2, 2.8]} text={ui.hints.cpu} />
    </group>
  );
}
