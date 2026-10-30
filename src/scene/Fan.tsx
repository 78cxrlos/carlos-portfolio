import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { runtime } from '../store/runtime';
import { playSound } from '../hooks/useSound';
import { useHoverCursor } from './helpers';

const BLADES = 7;

/**
 * Black plastic fan: frame, hub sticker, curved-looking pitched blades.
 * Click to boost. Speed has inertia — it spins up in about a second and
 * coasts down over several, like a real rotor.
 */
export function Fan({
  position,
  radius = 1.5,
  heatFactor = 3,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  radius?: number;
  heatFactor?: number;
  rotation?: [number, number, number];
}) {
  const rotor = useRef<THREE.Group>(null);
  const speed = useRef(0);
  const hover = useHoverCursor();
  const blade = useMemo(() => {
    // tapered blade: a thin box sheared into a trapezoid
    const g = new THREE.BoxGeometry(radius * 0.72, 0.03, radius * 0.42, 1, 1, 1);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      if (x > 0) p.setZ(i, p.getZ(i) * 1.25 + 0.06);
      else p.setZ(i, p.getZ(i) * 0.55);
    }
    g.computeVertexNormals();
    return g;
  }, [radius]);
  const bladeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1F1E1C', roughness: 0.55 }), []);
  useEffect(() => () => (blade.dispose(), bladeMat.dispose()), [blade, bladeMat]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1);
    const target = (2.4 + runtime.fanBoost * 9 + runtime.heat * heatFactor) * (1 - runtime.powerDown);
    // inertia: quicker to spin up than to coast down
    const k = target > speed.current ? 1.4 : 0.32;
    speed.current += (target - speed.current) * (1 - Math.exp(-k * d));
    if (rotor.current) rotor.current.rotation.y -= speed.current * d;
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh
        position={[0, 0.3, 0]}
        {...hover}
        onClick={(e) => {
          e.stopPropagation();
          runtime.fanBoost = Math.min(3, runtime.fanBoost + 1.2);
          playSound('click');
        }}
      >
        <cylinderGeometry args={[radius * 1.06, radius * 1.06, 0.5, 40, 1, true]} />
        <meshStandardMaterial color="#191817" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* frame lip */}
      <mesh position={[0, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[radius * 1.0, radius * 1.14, 48]} />
        <meshStandardMaterial color="#1c1b1a" roughness={0.5} />
      </mesh>
      <group ref={rotor} position={[0, 0.32, 0]}>
        <mesh raycast={() => null}>
          <cylinderGeometry args={[radius * 0.3, radius * 0.3, 0.2, 24]} />
          <meshStandardMaterial color="#222120" roughness={0.5} />
        </mesh>
        {/* hub sticker */}
        <mesh position={[0, 0.101, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <circleGeometry args={[radius * 0.22, 24]} />
          <meshStandardMaterial color="#D9D3C5" roughness={0.8} />
        </mesh>
        {Array.from({ length: BLADES }, (_, i) => (
          <group key={i} rotation={[0, (i / BLADES) * Math.PI * 2, 0]}>
            <mesh geometry={blade} material={bladeMat} position={[radius * 0.62, 0, 0]} rotation={[0.38, 0, 0]} raycast={() => null} />
          </group>
        ))}
      </group>
    </group>
  );
}
