import { useEffect, useMemo } from 'react';
import { ANCHORS } from './anchors';
import { PALETTE } from '../lib/themes';
import { runtime } from '../store/runtime';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { Fan } from './Fan';
import { createMetalTextures, createPaperLabel } from './textures';
import { hideSceneTip, showSceneTip, useFontsReady, useHoverCursor } from './helpers';
import { ui } from '../content/uiStrings';

/**
 * Graphics card on standoffs above its PCIe slot. Brushed aluminium shroud,
 * three fans, a printed spec sticker. Clicking the shroud spins the fans up.
 */
export function Gpu() {
  const hover = useHoverCursor();
  const fonts = useFontsReady();
  const alu = useMemo(() => createMetalTextures({ seed: 14, base: '#9E9D98' }), []);
  const sticker = useMemo(
    () =>
      createPaperLabel({
        w: 512,
        h: 192,
        lines: [
          { text: 'GFX-2  ·  8 GB', size: 0.24, weight: 600 },
          { text: 'S/N GX2-0091-4471 · 12V 2x8P', size: 0.13 },
        ],
        barcode: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fonts],
  );
  useEffect(() => () => [alu.map, alu.roughnessMap].forEach((t) => t.dispose()), [alu]);
  useEffect(() => () => sticker.dispose(), [sticker]);

  const W = 12;
  const D = 4.6;
  return (
    <group position={ANCHORS.gpu}>
      <mesh position={[0, 0.2, 0]} raycast={() => null}>
        <boxGeometry args={[W - 1, 0.4, 0.5]} />
        <meshStandardMaterial color="#1c1b1a" roughness={0.6} />
      </mesh>
      <group position={[0, 1.3, 0]} rotation={[0, 0.006, 0]}>
        <mesh raycast={() => null}>
          <boxGeometry args={[W, 0.14, D]} />
          <meshStandardMaterial color={PALETTE.pcb} roughness={0.6} />
        </mesh>
        <mesh
          position={[0, 0.45, 0]}
          onPointerOver={(e) => (hover.onPointerOver(e), showSceneTip(e, ui.hints.fanTip))}
          onPointerMove={(e) => showSceneTip(e, ui.hints.fanTip)}
          onPointerOut={() => (hover.onPointerOut(), hideSceneTip())}
          onClick={(e) => {
            e.stopPropagation();
            runtime.fanBoost = Math.min(3, runtime.fanBoost + 1.6);
            runtime.ledFlash = 1;
            playSound('click');
            useStore.getState().unlock('fan');
          }}
        >
          <boxGeometry args={[W - 0.2, 0.75, D - 0.2]} />
          <meshStandardMaterial map={alu.map} roughnessMap={alu.roughnessMap} metalness={1} roughness={1} />
        </mesh>
        {/* black backplate edge */}
        <mesh position={[0, -0.12, 0]} raycast={() => null}>
          <boxGeometry args={[W - 0.1, 0.06, D - 0.1]} />
          <meshStandardMaterial color="#1a1918" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* spec sticker on the shroud's end */}
        <mesh position={[W / 2 - 1.6, 0.83, D / 2 - 0.72]} rotation={[-Math.PI / 2, 0, -0.02]} raycast={() => null}>
          <planeGeometry args={[2.4, 0.9]} />
          <meshStandardMaterial map={sticker} roughness={0.9} />
        </mesh>
        {/* PCIe bracket */}
        <mesh position={[-W / 2 - 0.08, 0.4, 0]} raycast={() => null}>
          <boxGeometry args={[0.12, 1.6, D]} />
          <meshStandardMaterial color={PALETTE.steel} metalness={1} roughness={0.4} />
        </mesh>
        {/* 8-pin power connectors */}
        {[3.2, 4.4].map((x) => (
          <mesh key={x} position={[x, 0.95, -D / 2 + 0.5]} raycast={() => null}>
            <boxGeometry args={[1.0, 0.35, 0.6]} />
            <meshStandardMaterial color="#141312" roughness={0.6} />
          </mesh>
        ))}
        {[-3.7, 0, 3.7].map((x) => (
          <Fan key={x} position={[x, 0.55, 0]} radius={1.55} heatFactor={2} />
        ))}
      </group>
      {[
        [-5.5, -2],
        [5.5, -2],
        [-5.5, 2],
        [5.5, 2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.62, z]} raycast={() => null}>
          <cylinderGeometry args={[0.15, 0.15, 1.24, 6]} />
          <meshStandardMaterial color="#A88A4C" metalness={1} roughness={0.38} />
        </mesh>
      ))}
    </group>
  );
}
