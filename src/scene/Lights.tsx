import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { runtime } from '../store/runtime';
import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';

/**
 * Desk-lamp lighting:
 *  - KEY   one warm spot light high up-left, like an arm lamp, with soft
 *          PCF shadows. It's the only shadow caster.
 *  - FILL  a cool, weak directional from the opposite side (window light).
 *  - AMB   a dim ambient so shadows never go fully black.
 *  - ENV   a neutral studio environment built from Lightformers (offline)
 *          only for reflections on metal — rendered once.
 * Theme changes only adjust intensities; the light never turns a colour.
 */
export function Lights() {
  const theme = useTheme();
  const quality = useStore((s) => s.quality);
  const lamp = useRef<THREE.SpotLight>(null);
  const target = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (lamp.current && target.current) lamp.current.target = target.current;
  }, []);

  useFrame(() => {
    if (lamp.current) lamp.current.intensity = theme.lamp * (1 - runtime.powerDown * 0.85);
  });

  const shadows = quality > 0;
  return (
    <>
      <ambientLight intensity={theme.ambient} color="#F2EADB" />
      <directionalLight position={[34, 22, -26]} intensity={theme.fill} color="#C9D6E6" />
      <object3D ref={target} position={[-2, 0, 0]} />
      <spotLight
        ref={lamp}
        position={[-30, 44, 26]}
        color={theme.lampColor}
        intensity={theme.lamp}
        angle={0.72}
        penumbra={0.85}
        decay={1.6}
        distance={0}
        castShadow={shadows}
        shadow-mapSize-width={quality === 2 ? 2048 : 1024}
        shadow-mapSize-height={quality === 2 ? 2048 : 1024}
        shadow-bias={-0.00025}
        shadow-normalBias={0.03}
        shadow-radius={6}
        shadow-camera-near={10}
        shadow-camera-far={140}
      />
      <Environment resolution={128} frames={1}>
        <color attach="background" args={['#0e0d0c']} />
        <Lightformer form="rect" intensity={2.4} color="#FFE6C8" position={[-8, 10, 6]} scale={[14, 6, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#D3DEEA" position={[10, 6, -8]} rotation={[0, -Math.PI / 2, 0]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#F4EEE4" position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[20, 20, 1]} />
      </Environment>
    </>
  );
}
