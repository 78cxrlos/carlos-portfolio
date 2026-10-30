import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ANCHORS } from './anchors';
import { damp } from '../lib/rng';
import { PALETTE } from '../lib/themes';
import { useStore } from '../store/useStore';
import { runtime } from '../store/runtime';
import { playSound } from '../hooks/useSound';
import { siteContent, type ExperienceEntry } from '../content/siteContent';
import { buildTraceGeometry, useTraceUniforms } from './Traces';
import { createTraceMaterial } from './shaders';
import { createMetalTextures, createPaperLabel } from './textures';
import { SceneHint, useFontsReady } from './helpers';

const LANES = 12;
const BUS_W = 3.2;
const LOOP_START = -25;
const LOOP_LEN = 30;
const SPEED = 1.4; // units / second — an unhurried linear stage
const RAIL_Y = 0.32;

/** Static copper lanes (under the mask) + the signal overlay on top of them. */
function Lanes() {
  const len = ANCHORS.busEnd.x - ANCHORS.busStart.x;
  const cx = ANCHORS.busStart.x + len / 2;
  const zOf = (i: number) => ANCHORS.busStart.z + (i - (LANES - 1) / 2) * (BUS_W / LANES);
  const geometry = useMemo(() => {
    const paths = Array.from({ length: LANES }, (_, i) => ({ pts: [[ANCHORS.busStart.x, zOf(i)] as [number, number], [ANCHORS.busEnd.x, zOf(i)] as [number, number]], width: 0.12 }));
    return buildTraceGeometry(paths, 0.022, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const material = useMemo(() => createTraceMaterial(), []);
  useTraceUniforms(material, 0.9);
  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);
  return (
    <group>
      {Array.from({ length: LANES }, (_, i) => (
        <mesh key={i} position={[cx, 0.012, zOf(i)]} raycast={() => null}>
          <boxGeometry args={[len, 0.012, 0.12]} />
          <meshStandardMaterial color="#2C6B48" roughness={0.5} />
        </mesh>
      ))}
      <mesh geometry={geometry} material={material} raycast={() => null} renderOrder={2} />
    </group>
  );
}

/** A machined carriage riding the rail, carrying one experience entry. */
function Carriage({ entry, index, total, alu }: { entry: ExperienceEntry; index: number; total: number; alu: { map: THREE.Texture; roughnessMap: THREE.Texture } }) {
  const fonts = useFontsReady();
  const hovered = useStore((s) => s.hoveredPacket === index);
  const setHovered = useStore((s) => s.setHoveredPacket);
  const setCursor = useStore((s) => s.setCursor);
  const reduced = useStore((s) => s.reducedMotion);
  const group = useRef<THREE.Group>(null);
  const phase = useRef(index / total);
  const vel = useRef(1);
  const lift = useRef(0);

  const label = useMemo(
    () =>
      createPaperLabel({
        w: 512,
        h: 288,
        stripe: entry.kind === 'work' ? PALETTE.offBlack : PALETTE.copper,
        lines: [
          { text: entry.kind === 'work' ? 'WORK' : 'SCHOOL', size: 0.1, weight: 600, color: '#5E584E' },
          { text: entry.org.replace('[Placeholder] ', ''), size: 0.16, font: 'serif' },
          { text: entry.period, size: 0.1 },
        ],
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entry, fonts],
  );
  useEffect(() => () => label.dispose(), [label]);

  useFrame((_, dt) => {
    // eases to a stop when hovered, eases back into motion when released
    vel.current += ((hovered || reduced ? 0 : 1) - vel.current) * damp(5, dt);
    phase.current = (phase.current + (dt * SPEED * vel.current) / LOOP_LEN) % 1;
    lift.current += ((hovered ? 1 : 0) - lift.current) * damp(10, dt);
    const g = group.current;
    if (!g) return;
    const f = phase.current;
    // carriages pass under covers at the ends of the rail
    const edge = Math.min(1, f * 14, (1 - f) * 14);
    g.position.set(LOOP_START + f * LOOP_LEN, RAIL_Y + 0.3 + lift.current * 0.22 - (1 - edge) * 0.8, ANCHORS.busStart.z);
    g.visible = edge > 0.02;
  });

  return (
    <group ref={group}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(index);
          setCursor('hover');
          runtime.ledFlash = 1;
          playSound('hover');
          useStore.getState().markHint('packet');
        }}
        onPointerOut={() => {
          if (useStore.getState().hoveredPacket === index) setHovered(null);
          setCursor('default');
        }}
        onClick={(e) => {
          e.stopPropagation();
          setHovered(hovered ? null : index);
          playSound('click');
        }}
      >
        <boxGeometry args={[2.6, 0.55, 1.5]} />
        <meshStandardMaterial attach="material-0" map={alu.map} roughnessMap={alu.roughnessMap} metalness={1} roughness={1} />
        <meshStandardMaterial attach="material-1" map={alu.map} roughnessMap={alu.roughnessMap} metalness={1} roughness={1} />
        <meshStandardMaterial attach="material-2" map={label} roughness={0.85} />
        <meshStandardMaterial attach="material-3" color="#555652" metalness={1} roughness={0.5} />
        <meshStandardMaterial attach="material-4" map={alu.map} roughnessMap={alu.roughnessMap} metalness={1} roughness={1} />
        <meshStandardMaterial attach="material-5" map={alu.map} roughnessMap={alu.roughnessMap} metalness={1} roughness={1} />
      </mesh>
      {/* cap screws */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.05, 0.28, 0.55]} raycast={() => null}>
          <cylinderGeometry args={[0.09, 0.09, 0.03, 10]} />
          <meshStandardMaterial color="#2a2a2a" metalness={1} roughness={0.4} />
        </mesh>
      ))}
      {hovered && (
        <Html position={[0, 1.0, 0]} center zIndexRange={[30, 20]} style={{ pointerEvents: 'none' }}>
          <div className="tag-card packet-card">
            <div className="packet-card__meta">
              {entry.kind === 'work' ? 'Work' : 'Education'} · {entry.period}
            </div>
            <div className="packet-card__title">{entry.title}</div>
            <div className="packet-card__org">
              {entry.org}
              {entry.location ? ` · ${entry.location}` : ''}
            </div>
            <p>{entry.summary}</p>
            <ul>
              {entry.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        </Html>
      )}
    </group>
  );
}

export function DataBus() {
  const len = ANCHORS.busEnd.x - ANCHORS.busStart.x;
  const cx = ANCHORS.busStart.x + len / 2;
  const entries = siteContent.experience;
  const alu = useMemo(() => createMetalTextures({ seed: 31, base: '#A7A6A1' }), []);
  useEffect(() => () => [alu.map, alu.roughnessMap].forEach((t) => t.dispose()), [alu]);
  return (
    <group>
      <mesh position={[cx, 0.006, ANCHORS.busStart.z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <planeGeometry args={[len + 1, BUS_W + 0.5]} />
        <meshStandardMaterial color="#0C3226" roughness={0.65} />
      </mesh>
      <Lanes />
      {/* linear rail + end covers */}
      <mesh position={[LOOP_START + LOOP_LEN / 2, RAIL_Y, ANCHORS.busStart.z]} raycast={() => null}>
        <boxGeometry args={[LOOP_LEN + 3, 0.22, 0.6]} />
        <meshStandardMaterial color={PALETTE.steel} metalness={1} roughness={0.28} />
      </mesh>
      {[LOOP_START - 0.6, LOOP_START + LOOP_LEN + 0.6].map((x) => (
        <mesh key={x} position={[x, 0.55, ANCHORS.busStart.z]} raycast={() => null}>
          <boxGeometry args={[1.6, 1.1, 1.9]} />
          <meshStandardMaterial color="#1b1a19" roughness={0.6} />
        </mesh>
      ))}
      {entries.map((e, i) => (
        <Carriage key={`${e.org}-${i}`} entry={e} index={i} total={entries.length} alu={alu} />
      ))}
      <SceneHint id="packet" section={4} position={[-10, 2.2, ANCHORS.busStart.z]} text="Hover a carriage and it stops." />
    </group>
  );
}
