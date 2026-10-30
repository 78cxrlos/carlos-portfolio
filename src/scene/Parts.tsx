import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { BOARD_SIZE } from '../lib/sections';
import { addRipple, runtime } from '../store/runtime';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { SceneHint } from './helpers';

type Kind = 'screw' | 'chip' | 'cap';
const PARTS: { kind: Kind; pos: [number, number] }[] = [
  { kind: 'screw', pos: [-3, 5] },
  { kind: 'chip', pos: [2.5, 6.5] },
  { kind: 'screw', pos: [5.5, 3.5] },
  { kind: 'cap', pos: [-6.5, 7] },
  { kind: 'chip', pos: [-9, -0.5] },
  { kind: 'screw', pos: [19.5, 5.5] },
];
const HALF_H: Record<Kind, number> = { screw: 0.12, chip: 0.1, cap: 0.45 };
const GRAVITY = 32;
const DRAG_Y = 2.6;

const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DRAG_Y);
const hit = new THREE.Vector3();

/**
 * A loose part with a tiny hand-rolled physics sim: gravity, ground bounce
 * with restitution, rolling friction and board-edge walls. While dragged it
 * follows the pointer on a horizontal plane; on release it inherits the
 * pointer's recent velocity, so a quick flick tosses it.
 */
function Part({ kind, start }: { kind: Kind; start: [number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const setCursor = useStore((s) => s.setCursor);
  const st = useMemo(
    () => ({
      pos: new THREE.Vector3(start[0], HALF_H[kind], start[1]),
      vel: new THREE.Vector3(),
      spin: new THREE.Vector3(),
      target: new THREE.Vector3(),
      dragging: false,
      lastBounce: 0,
    }),
    [kind, start],
  );
  const prev = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const d = Math.min(dt, 1 / 30);
    const g = ref.current;
    if (!g) return;
    if (st.dragging) {
      prev.copy(st.pos);
      st.pos.lerp(st.target, 1 - Math.exp(-25 * d));
      st.vel.subVectors(st.pos, prev).divideScalar(Math.max(d, 1e-4));
      g.rotation.x += d * 2;
      g.rotation.z += d * 1.4;
    } else {
      st.vel.y -= GRAVITY * d;
      st.pos.addScaledVector(st.vel, d);
      const floor = HALF_H[kind];
      if (st.pos.y < floor) {
        st.pos.y = floor;
        if (Math.abs(st.vel.y) > 2) {
          // bounce: a small click + a ripple from the impact point
          const now = state.clock.elapsedTime;
          if (now - st.lastBounce > 0.25 && Math.abs(st.vel.y) > 5) {
            addRipple(st.pos.x, st.pos.z);
            playSound('hover');
          }
          st.lastBounce = now;
        }
        st.vel.y = -st.vel.y * 0.38;
        if (Math.abs(st.vel.y) < 0.6) st.vel.y = 0;
        st.vel.x *= 1 - d * 4;
        st.vel.z *= 1 - d * 4;
      }
      const hw = BOARD_SIZE.w / 2 - 1;
      const hd = BOARD_SIZE.d / 2 - 1;
      if (Math.abs(st.pos.x) > hw) (st.pos.x = Math.sign(st.pos.x) * hw), (st.vel.x *= -0.5);
      if (Math.abs(st.pos.z) > hd) (st.pos.z = Math.sign(st.pos.z) * hd), (st.vel.z *= -0.5);
      // tumble while moving, settle flat when resting
      const speed = Math.hypot(st.vel.x, st.vel.z);
      if (st.pos.y > floor + 0.01 || speed > 0.3) {
        g.rotation.x += st.vel.z * d * 0.8;
        g.rotation.z -= st.vel.x * d * 0.8;
      } else {
        g.rotation.x += (Math.round(g.rotation.x / Math.PI) * Math.PI - g.rotation.x) * d * 8;
        g.rotation.z += (Math.round(g.rotation.z / Math.PI) * Math.PI - g.rotation.z) * d * 8;
      }
    }
    g.position.copy(st.pos);
  });

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    st.dragging = true;
    runtime.dragging = true;
    st.target.copy(st.pos).setY(DRAG_Y);
    setCursor('grabbing');
    useStore.getState().markHint('parts');
    playSound('click');
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!st.dragging) return;
    if (e.ray.intersectPlane(dragPlane, hit)) st.target.set(hit.x, DRAG_Y, hit.z);
  };
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    if (!st.dragging) return;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    st.dragging = false;
    runtime.dragging = false;
    st.vel.multiplyScalar(0.9);
    st.vel.y = Math.max(st.vel.y, 2);
    if (st.vel.length() > 9) useStore.getState().unlock('tosser');
    setCursor('grab');
  };

  const handlers = {
    onPointerDown: onDown,
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setCursor('grab');
    },
    onPointerOut: () => !st.dragging && setCursor('default'),
  };

  return (
    <group ref={ref}>
      {kind === 'screw' && (
        <group {...handlers}>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.16, 20]} />
            <meshStandardMaterial color="#c7ccd4" metalness={1} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0.13, 0]} raycast={() => null}>
            <boxGeometry args={[0.5, 0.04, 0.08]} />
            <meshStandardMaterial color="#555b66" metalness={1} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.13, 0]} rotation={[0, Math.PI / 2, 0]} raycast={() => null}>
            <boxGeometry args={[0.5, 0.04, 0.08]} />
            <meshStandardMaterial color="#555b66" metalness={1} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.12, 0.1, 0.55, 10]} />
            <meshStandardMaterial color="#aab0ba" metalness={1} roughness={0.3} />
          </mesh>
        </group>
      )}
      {kind === 'chip' && (
        <mesh {...handlers}>
          <boxGeometry args={[0.95, 0.2, 0.95]} />
          <meshStandardMaterial color="#0d0e12" metalness={0.5} roughness={0.35} />
        </mesh>
      )}
      {kind === 'cap' && (
        <mesh {...handlers}>
          <cylinderGeometry args={[0.35, 0.35, 0.9, 18]} />
          <meshStandardMaterial color="#B39A72" roughness={0.7} />
        </mesh>
      )}
    </group>
  );
}

export function Parts() {
  return (
    <group>
      {PARTS.map((p, i) => (
        <Part key={i} kind={p.kind} start={p.pos} />
      ))}
      <SceneHint id="parts" section={0} position={[-3, 1.6, 5]} text="Loose screws. Pick one up and throw it." />
    </group>
  );
}
