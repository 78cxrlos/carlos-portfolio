import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import { ANCHORS } from './anchors';
import { damp } from '../lib/rng';
import { PALETTE } from '../lib/themes';
import { addRipple, runtime } from '../store/runtime';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { siteContent, type SocialLink } from '../content/siteContent';
import { SceneHint } from './helpers';
import { ui } from '../content/uiStrings';

import { openSocial } from '../lib/navigation';
import { createMetalTextures } from './textures';

const FACE_X = ANCHORS.port.x + 2; // x of the I/O shield's front face
const PORT_Y = 1.5;
const SPACING = 2.4;

const SIZES: Record<SocialLink['kind'], [number, number]> = {
  rj45: [1.3, 1.1],
  usbc: [1.0, 0.42],
  usba: [1.25, 0.55],
  hdmi: [1.45, 0.55],
};

const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -PORT_Y);
const hit = new THREE.Vector3();

/** A cable plug: drag it into its port, or just click it. */
function Plug({ social, index, total }: { social: SocialLink; index: number; total: number }) {
  const plugged = useStore((s) => s.pluggedIn.includes(social.id));
  const sectionActive = useStore((s) => s.section === 5);
  const setCursor = useStore((s) => s.setCursor);
  const group = useRef<THREE.Group>(null);
  const line = useRef<THREE.Mesh & { setPoints: (a: THREE.Vector3, b: THREE.Vector3, m?: THREE.Vector3) => void }>(null);
  const linkLed = useRef<THREE.MeshBasicMaterial>(null);
  const actLed = useRef<THREE.MeshBasicMaterial>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const z = ANCHORS.port.z + (index - (total - 1) / 2) * SPACING;
  const [w, h] = SIZES[social.kind];
  const headLen = 1.2;
  // resting on the bench in front of the board, not quite in a neat row
  const rest = useMemo(() => new THREE.Vector3(FACE_X + 3 + (index % 2) * 0.5, PORT_Y - 0.9, z + (index - 1.5) * 0.3), [z, index]);
  const socket = useMemo(() => new THREE.Vector3(FACE_X + headLen / 2 - 0.15, PORT_Y, z), [z]);
  const anchor = useMemo(() => new THREE.Vector3(FACE_X + 9, -0.9, z * 1.05), [z]);
  const pos = useRef(rest.clone());
  const tmpA = useMemo(() => new THREE.Vector3(), []);
  const tmpM = useMemo(() => new THREE.Vector3(), []);
  const green = useMemo(() => new THREE.Color('#7CFF6A'), []);
  const amber = useMemo(() => new THREE.Color('#FFB341'), []);
  const off = useMemo(() => new THREE.Color('#33322c'), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (!drag.current) pos.current.lerp(plugged ? socket : rest, damp(plugged ? 12 : 5, dt));
    group.current?.position.copy(pos.current);
    if (group.current) group.current.rotation.y = drag.current ? Math.sin(t * 3) * 0.02 : 0;
    if (line.current) {
      tmpA.copy(pos.current).setX(pos.current.x + headLen / 2 + 0.3);
      tmpM.lerpVectors(tmpA, anchor, 0.5).setY(Math.min(tmpA.y, anchor.y) - 0.35);
      line.current.setPoints(tmpA, anchor, tmpM);
    }
    // jack LEDs: link (steady green) + activity (amber flicker) only when connected
    const p = 1 - runtime.powerDown;
    if (linkLed.current) {
      if (plugged) linkLed.current.color.copy(green).multiplyScalar(2 * p);
      else linkLed.current.color.copy(off);
    }
    if (actLed.current) {
      if (plugged && Math.random() > 0.55) actLed.current.color.copy(amber).multiplyScalar(1.8 * p);
      else actLed.current.color.copy(off);
    }
  });

  const plugIn = () => {
    playSound('plug');
    addRipple(ANCHORS.port.x, z);
    runtime.ledFlash = 1;
    openSocial(social);
  };

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    runtime.dragging = true;
    setCursor('grabbing');
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const d = drag.current;
    if (!d) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) d.moved = true;
    if (d.moved && e.ray.intersectPlane(plane, hit)) {
      pos.current.set(THREE.MathUtils.clamp(hit.x, FACE_X + 0.3, FACE_X + 8), PORT_Y, THREE.MathUtils.clamp(hit.z, ANCHORS.port.z - 6, ANCHORS.port.z + 6));
    }
  };
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    const d = drag.current;
    if (!d) return;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    drag.current = null;
    runtime.dragging = false;
    setCursor('grab');
    useStore.getState().markHint('plug');
    if (!d.moved) {
      if (plugged) {
        playSound('click');
        useStore.setState((s) => ({ pluggedIn: s.pluggedIn.filter((p) => p !== social.id) }));
      } else plugIn();
      return;
    }
    const dist = Math.hypot(pos.current.x - socket.x, pos.current.z - socket.z);
    if (dist < 2.2 && !plugged) plugIn();
  };

  return (
    <group>
      {/* the jack in the shield */}
      <group position={[FACE_X + 0.01, PORT_Y, z]} rotation={[0, Math.PI / 2, 0]}>
        <mesh raycast={() => null}>
          <planeGeometry args={[w + 0.24, h + 0.24]} />
          <meshStandardMaterial color="#202020" metalness={0.8} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.004]} raycast={() => null}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color="#060606" />
        </mesh>
        {social.kind === 'rj45' && (
          <>
            <mesh position={[-w / 2 + 0.12, -h / 2 - 0.05, 0.006]} raycast={() => null}>
              <planeGeometry args={[0.16, 0.1]} />
              <meshBasicMaterial ref={linkLed} toneMapped={false} />
            </mesh>
            <mesh position={[w / 2 - 0.12, -h / 2 - 0.05, 0.006]} raycast={() => null}>
              <planeGeometry args={[0.16, 0.1]} />
              <meshBasicMaterial ref={actLed} toneMapped={false} />
            </mesh>
          </>
        )}
      </group>
      {/* plug: black overmould + metal shell */}
      <group ref={group}>
        <mesh
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerOver={(e) => {
            e.stopPropagation();
            setCursor('grab');
            playSound('hover');
          }}
          onPointerOut={() => !drag.current && setCursor('default')}
        >
          <boxGeometry args={[headLen, h * 1.15, w * 1.05]} />
          <meshStandardMaterial color="#1d1c1b" roughness={0.55} />
        </mesh>
        <mesh position={[-headLen / 2 - 0.18, 0, 0]} raycast={() => null}>
          <boxGeometry args={[0.36, h * 0.82, w * 0.86]} />
          <meshStandardMaterial color={social.kind === 'rj45' ? '#cfd0c8' : '#B8B9B4'} metalness={social.kind === 'rj45' ? 0 : 1} roughness={social.kind === 'rj45' ? 0.2 : 0.3} transparent={social.kind === 'rj45'} opacity={social.kind === 'rj45' ? 0.75 : 1} />
        </mesh>
        <mesh position={[headLen / 2 + 0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} raycast={() => null}>
          <cylinderGeometry args={[0.2, 0.28, 0.35, 12]} />
          <meshStandardMaterial color="#1d1c1b" roughness={0.6} />
        </mesh>
        {sectionActive && (
          <Html position={[0, h + 0.4, 0]} center zIndexRange={[30, 20]} style={{ pointerEvents: 'none' }}>
            <div className={`tag-card plug-label ${plugged ? 'is-on' : ''}`}>
              {social.label}
              {plugged ? ' · linked' : ''}
            </div>
          </Html>
        )}
      </group>
      <QuadraticBezierLine ref={line as never} start={rest} end={anchor} color="#1a1918" lineWidth={7} />
    </group>
  );
}

export function NetworkPort() {
  const socials = siteContent.contact.socials;
  const depth = Math.max(8, socials.length * SPACING + 1.6);
  const steel = useMemo(() => createMetalTextures({ seed: 44, base: '#B3B4AF' }), []);
  useEffect(() => () => [steel.map, steel.roughnessMap].forEach((t) => t.dispose()), [steel]);
  return (
    <group>
      <mesh position={[ANCHORS.port.x, PORT_Y, ANCHORS.port.z]} raycast={() => null}>
        <boxGeometry args={[4, 3, depth]} />
        <meshStandardMaterial map={steel.map} roughnessMap={steel.roughnessMap} metalness={0.75} roughness={1} />
      </mesh>
      <mesh position={[ANCHORS.port.x - 2.4, 0.4, ANCHORS.port.z]} raycast={() => null}>
        <boxGeometry args={[1.2, 0.8, depth - 1]} />
        <meshStandardMaterial color={PALETTE.plastic} roughness={0.55} />
      </mesh>
      {socials.map((s, i) => (
        <Plug key={s.id} social={s} index={i} total={socials.length} />
      ))}
      <SceneHint id="plug" section={5} position={[FACE_X + 3.4, PORT_Y + 0.6, ANCHORS.port.z]} text={ui.hints.plug} />
    </group>
  );
}
