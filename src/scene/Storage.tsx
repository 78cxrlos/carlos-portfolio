import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ANCHORS } from './anchors';
import { damp } from '../lib/rng';
import { PALETTE } from '../lib/themes';
import { runtime } from '../store/runtime';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { siteContent, type Project } from '../content/siteContent';
import { createPaperLabel } from './textures';
import { SceneHint, hideSceneTip, longPressSceneTip, showSceneTip, useFontsReady } from './helpers';
import { ui } from '../content/uiStrings';


const SPACING = 2.2;
const RACK_H = 0.8;
const DRIVE_W = 1.7;
const DRIVE_H = 2.5;
const REST_Y = RACK_H - 0.45 + DRIVE_H / 2;

/** One project = one drive standing in the rack, with a printed paper label. */
function Drive({ project, index, total }: { project: Project; index: number; total: number }) {
  const fonts = useFontsReady();
  const [hovered, setHovered] = useState(false);
  const active = useStore((s) => s.activeProject === index);
  const openProject = useStore((s) => s.openProject);
  const setCursor = useStore((s) => s.setCursor);
  const group = useRef<THREE.Group>(null);
  const lift = useRef(0);
  // each drive sits a hair differently in its slot
  const lean = useMemo(() => ((index * 37) % 7) / 7 - 0.5, [index]);

  const label = useMemo(
    () =>
      createPaperLabel({
        w: 384,
        h: 512,
        stripe: project.color,
        border: false,
        lines: [
          { text: project.partNo ?? `ITM-P0${index + 1}`, size: 0.05, weight: 600 },
          { text: project.title, size: 0.11, weight: 500, font: 'serif' },
          { text: `${project.year} · ${project.role}`, size: 0.045 },
          { text: project.tech.slice(0, 3).join(' / '), size: 0.04, color: '#5E584E' },
        ],
        barcode: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project, index, fonts],
  );
  useEffect(() => () => label.dispose(), [label]);

  const x = ANCHORS.storage.x + (index - (total - 1) / 2) * SPACING;

  useFrame((_, dt) => {
    const target = active ? 1.25 : hovered ? 0.7 : 0;
    // a little overshoot on the way up, settles back gently
    lift.current += (target - lift.current) * damp(hovered || active ? 9 : 6, dt);
    const g = group.current;
    if (g) {
      g.position.y = REST_Y + lift.current * 0.75;
      g.rotation.z = lean * 0.025 * (1 - Math.min(1, lift.current));
      g.rotation.x = -lift.current * 0.05;
    }
  });

  return (
    <group ref={group} position={[x, REST_Y, ANCHORS.storage.z]}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setCursor('hover');
          runtime.ledFlash = 1;
          playSound('hover');
          useStore.getState().markHint('cartridge');
          showSceneTip(e, ui.hints.driveTip(project.title));
        }}
        onPointerMove={(e) => showSceneTip(e, ui.hints.driveTip(project.title))}
        onPointerDown={(e) => longPressSceneTip(e, ui.hints.driveTip(project.title))}
        onPointerOut={() => {
          setHovered(false);
          setCursor('default');
          hideSceneTip();
        }}
        onClick={(e) => {
          e.stopPropagation();
          hideSceneTip();
          playSound('click');
          runtime.ledFlash = 1;
          openProject(index);
        }}
      >
        <boxGeometry args={[DRIVE_W, DRIVE_H, 0.12]} />
        <meshStandardMaterial attach="material-0" color={PALETTE.pcb} roughness={0.6} />
        <meshStandardMaterial attach="material-1" color={PALETTE.pcb} roughness={0.6} />
        <meshStandardMaterial attach="material-2" color={PALETTE.pcb} roughness={0.6} />
        <meshStandardMaterial attach="material-3" color={PALETTE.pcb} roughness={0.6} />
        <meshStandardMaterial attach="material-4" map={label} roughness={0.85} />
        <meshStandardMaterial attach="material-5" color={PALETTE.pcbLight} roughness={0.6} />
      </mesh>
      {/* controller chip on the back */}
      <mesh position={[0, -0.3, -0.1]} raycast={() => null}>
        <boxGeometry args={[1.0, 0.9, 0.08]} />
        <meshStandardMaterial color={PALETTE.plastic} roughness={0.5} />
      </mesh>
      {/* gold edge connector */}
      <mesh position={[0, -DRIVE_H / 2 + 0.12, 0.065]} raycast={() => null}>
        <planeGeometry args={[1.3, 0.2]} />
        <meshStandardMaterial color={PALETTE.gold} metalness={1} roughness={0.3} />
      </mesh>
      {/* mounting notch screw */}
      <mesh position={[0, DRIVE_H / 2 - 0.12, 0.08]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 12]} />
        <meshStandardMaterial color={PALETTE.steel} metalness={1} roughness={0.3} />
      </mesh>
      {index === 0 && <SceneHint id="cartridge" section={3} position={[0, DRIVE_H / 2 + 0.4, 0]} text={ui.hints.drive} />}
    </group>
  );
}

export function Storage() {
  const projects = siteContent.projects;
  const len = projects.length * SPACING + 0.6;
  return (
    <group>
      {/* the rack */}
      <mesh position={[ANCHORS.storage.x, RACK_H / 2, ANCHORS.storage.z]} raycast={() => null}>
        <boxGeometry args={[len, RACK_H, 1.2]} />
        <meshStandardMaterial color="#1b1a19" roughness={0.65} />
      </mesh>
      {projects.map((p, i) => (
        <mesh key={`slot-${p.id}`} position={[ANCHORS.storage.x + (i - (projects.length - 1) / 2) * SPACING, RACK_H + 0.002, ANCHORS.storage.z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <planeGeometry args={[DRIVE_W + 0.12, 0.26]} />
          <meshBasicMaterial color="#050505" />
        </mesh>
      ))}
      {projects.map((p, i) => (
        <Drive key={p.id} project={p} index={i} total={projects.length} />
      ))}
    </group>
  );
}
