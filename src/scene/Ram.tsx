import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ANCHORS } from './anchors';
import { damp, smoothstep } from '../lib/rng';
import { PALETTE } from '../lib/themes';
import { runtime } from '../store/runtime';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { siteContent } from '../content/siteContent';
import { createMarkingTexture, createPaperLabel } from './textures';
import { SceneHint, stationProximity, useFontsReady } from './helpers';
import { ui } from '../content/uiStrings';


const CHIPS_PER_STICK = 8;
const STICK_LEN = 9.6;
const STICK_H = 2.2;
const CHIP_W = 1.0;
const CHIP_H = 1.25;

/**
 * One stick per skill category. Seated in its slot when the camera is
 * elsewhere; at the RAM station the sticks are pulled out and stacked so
 * every chip marking is readable. Filtering pushes the other sticks back
 * into their slots — the "dimming" is physical.
 */
function Stick({ index, count }: { index: number; count: number }) {
  const fonts = useFontsReady();
  const category = siteContent.skills[index];
  const filter = useStore((s) => s.skillFilter);
  const hoveredSkill = useStore((s) => s.hoveredSkill);
  const setHoveredSkill = useStore((s) => s.setHoveredSkill);
  const setCursor = useStore((s) => s.setCursor);

  const group = useRef<THREE.Group>(null);
  const eject = useRef(0);
  const lift = useRef(0);

  const chipMaps = useMemo(
    () =>
      Array.from({ length: CHIPS_PER_STICK }, (_, i) => {
        const sk = category.skills[i];
        return createMarkingTexture({
          w: 256,
          h: 320,
          size: 0.11,
          lines: sk
            ? [sk.name.toUpperCase().slice(0, 12), `LVL ${'■'.repeat(sk.level)}${'□'.repeat(5 - sk.level)}`, `K4A8G${index}${i}5 · 2${3 + i}48`]
            : ['NC', 'unpopulated'],
        });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, index, fonts],
  );
  const sticker = useMemo(
    () =>
      createPaperLabel({
        w: 512,
        h: 128,
        lines: [
          { text: `${category.label.toUpperCase()} · ${category.skills.length} parts`, size: 0.26, weight: 600 },
          { text: `DIMM ${index}  ·  8GB 1Rx8  ·  QC ok`, size: 0.17 },
        ],
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, index, fonts],
  );
  useEffect(() => () => chipMaps.forEach((t) => t.dispose()), [chipMaps]);
  useEffect(() => () => sticker.dispose(), [sticker]);

  const seated = useMemo(() => new THREE.Vector3(ANCHORS.ram.x, 1.25, ANCHORS.ram.z + (index - (count - 1) / 2) * 1.05), [index, count]);
  const ejected = useMemo(() => new THREE.Vector3(ANCHORS.ram.x, 1.9 + (count - 1 - index) * 2.55, -8.6), [index, count]);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const isHoveredStick = hoveredSkill?.category === category.id;

  useFrame((state, dt) => {
    const filteredOut = filter !== null && filter !== category.id;
    const target = filteredOut ? 0 : smoothstep(0.35 + index * 0.05, 0.8 + index * 0.04, stationProximity(2));
    eject.current += (target - eject.current) * damp(3.2, dt);
    lift.current += ((isHoveredStick ? 1 : 0) - lift.current) * damp(10, dt);
    const e = eject.current;
    if (group.current) {
      tmp.lerpVectors(seated, ejected, e);
      // arc up out of the slot rather than sliding through the board
      tmp.y += Math.sin(e * Math.PI) * 1.4 + lift.current * 0.14;
      tmp.z += lift.current * 0.1;
      group.current.position.copy(tmp);
      group.current.rotation.x = -0.1 * e + Math.sin(state.clock.elapsedTime * 0.7 + index) * 0.004 * e;
    }
  });

  return (
    <group ref={group}>
      <mesh raycast={() => null}>
        <boxGeometry args={[STICK_LEN, STICK_H, 0.12]} />
        <meshStandardMaterial color={PALETTE.pcb} roughness={0.6} />
      </mesh>
      {/* gold contact fingers */}
      <mesh position={[0, -STICK_H / 2 + 0.12, 0.062]} raycast={() => null}>
        <planeGeometry args={[STICK_LEN - 0.4, 0.22]} />
        <meshStandardMaterial color={PALETTE.gold} metalness={1} roughness={0.3} />
      </mesh>
      {/* paper sticker, slightly crooked */}
      <mesh position={[-STICK_LEN / 2 + 1.75, STICK_H / 2 - 0.26, 0.064]} rotation={[0, 0, 0.012 * (index % 2 ? 1 : -1)]} raycast={() => null}>
        <planeGeometry args={[3.2, 0.8]} />
        <meshStandardMaterial map={sticker} roughness={0.9} />
      </mesh>
      {chipMaps.map((map, i) => {
        const skill = category.skills[i];
        const x = (i - (CHIPS_PER_STICK - 1) / 2) * (CHIP_W + 0.12);
        const isHovered = !!skill && isHoveredStick && hoveredSkill?.name === skill.name;
        return (
          <group key={i} position={[x, -0.18, 0.1]}>
            <mesh
              onPointerOver={(e) => {
                if (!skill) return;
                e.stopPropagation();
                setHoveredSkill({ category: category.id, name: skill.name, level: skill.level });
                setCursor('hover');
                runtime.ledFlash = 1;
                playSound('hover');
                useStore.getState().markHint('ram');
              }}
              onPointerOut={() => {
                if (!skill) return;
                const s = useStore.getState();
                if (s.hoveredSkill?.name === skill.name) setHoveredSkill(null);
                setCursor('default');
              }}
              onClick={(e) => {
                if (!skill) return;
                e.stopPropagation();
                runtime.ledFlash = 1;
                setHoveredSkill({ category: category.id, name: skill.name, level: skill.level });
                playSound('click');
              }}
            >
              <boxGeometry args={[CHIP_W, CHIP_H, 0.08]} />
              <meshStandardMaterial attach="material-0" color={PALETTE.plastic} roughness={0.55} />
              <meshStandardMaterial attach="material-1" color={PALETTE.plastic} roughness={0.55} />
              <meshStandardMaterial attach="material-2" color={PALETTE.plastic} roughness={0.55} />
              <meshStandardMaterial attach="material-3" color={PALETTE.plastic} roughness={0.55} />
              <meshStandardMaterial attach="material-4" map={map} roughness={0.5} />
              <meshStandardMaterial attach="material-5" color={PALETTE.plastic} roughness={0.55} />
            </mesh>
            {isHovered && skill && (
              <Html position={[0, CHIP_H / 2 + 0.3, 0.1]} center zIndexRange={[30, 20]} style={{ pointerEvents: 'none' }}>
                <div className="tag-card skill-tip">
                  <span className="skill-tip__name">{skill.name}</span>
                  <span className="skill-tip__lvl">LEVEL {skill.level} / 5</span>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

export function Ram() {
  const count = siteContent.skills.length;
  return (
    <group>
      {siteContent.skills.map((c, i) => (
        <mesh key={c.id} position={[ANCHORS.ram.x, 0.2, ANCHORS.ram.z + (i - (count - 1) / 2) * 1.05]} raycast={() => null}>
          <boxGeometry args={[STICK_LEN + 0.8, 0.4, 0.42]} />
          <meshStandardMaterial color={i % 2 ? '#1b1a19' : '#2a2724'} roughness={0.6} />
        </mesh>
      ))}
      {siteContent.skills.map((c, i) => (
        <Stick key={c.id} index={i} count={count} />
      ))}
      <SceneHint id="ram" section={2} position={[ANCHORS.ram.x + 3.6, 0.8, -6.4]} text={ui.hints.ram} />
    </group>
  );
}
