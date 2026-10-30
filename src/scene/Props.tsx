import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { PALETTE } from '../lib/themes';
import { useTheme } from '../hooks/useTheme';
import { siteContent } from '../content/siteContent';
import { BENCH_Y } from './Board';
import { createBenchTexture, createHandwrittenTexture, createMetalTextures, createPaperLabel, createRulerTexture } from './textures';
import { useFontsReady } from './helpers';

/**
 * Things that make it a used board on a real bench rather than a render:
 * the bench itself, masking tape with handwriting, a sticky note, a QC
 * sticker, Kapton tape over a corner, a steel ruler and a screwdriver.
 */
function Bench() {
  const theme = useTheme();
  const maps = useMemo(() => {
    const m = createBenchTexture(theme.bench);
    m.map.repeat.set(5, 5);
    m.roughnessMap.repeat.set(5, 5);
    return m;
  }, [theme.bench]);
  useEffect(() => () => [maps.map, maps.roughnessMap].forEach((t) => t.dispose()), [maps]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BENCH_Y, 0]} raycast={() => null}>
      <planeGeometry args={[320, 320]} />
      <meshStandardMaterial map={maps.map} roughnessMap={maps.roughnessMap} roughness={1} />
    </mesh>
  );
}

/** A sticky note with one lifted corner (vertices bent upward). */
function StickyNote({ texture }: { texture: THREE.Texture }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(3.8, 3.8, 12, 12);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / 1.9; // -1..1
      const y = p.getY(i) / 1.9;
      // lift the corner that isn't glued (bottom-right in note space)
      const lift = Math.max(0, x * 0.6 - y * 0.6 - 0.2);
      p.setZ(i, lift * lift * 0.5);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} position={[29, 0.02, 18.8]} rotation={[-Math.PI / 2, 0, 0.11]} raycast={() => null}>
      <meshStandardMaterial map={texture} roughness={0.92} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Screwdriver() {
  const steel = useMemo(() => createMetalTextures({ seed: 55, base: '#9C9D99', size: 256 }), []);
  useEffect(() => () => [steel.map, steel.roughnessMap].forEach((t) => t.dispose()), [steel]);
  return (
    <group position={[39, BENCH_Y + 0.46, 7]} rotation={[0, 0.55, 0]}>
      <group rotation={[0, 0, Math.PI / 2]}>
        {/* faceted grip */}
        <mesh position={[0, 2.2, 0]}>
          <cylinderGeometry args={[0.44, 0.46, 4.2, 8]} />
          <meshStandardMaterial color="#1E1D1B" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.47, 0.47, 0.3, 16]} />
          <meshStandardMaterial color={PALETTE.bone} roughness={0.7} />
        </mesh>
        <mesh position={[0, -2.6, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 5.4, 10]} />
          <meshStandardMaterial map={steel.map} roughnessMap={steel.roughnessMap} metalness={1} roughness={1} />
        </mesh>
        <mesh position={[0, -5.35, 0]}>
          <boxGeometry args={[0.22, 0.25, 0.05]} />
          <meshStandardMaterial color="#8a8b87" metalness={1} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

export function Props() {
  const fonts = useFontsReady();
  const tex = useMemo(
    () => ({
      tape: createHandwrittenTexture({ lines: [siteContent.bench.tapeLabel], paper: PALETTE.tape, w: 768, h: 128, torn: true, size: 0.6 }),
      note: createHandwrittenTexture({ lines: siteContent.bench.stickyNote, paper: PALETTE.sticky, w: 512, h: 512, size: 0.28 }),
      qc: createPaperLabel({
        w: 256,
        h: 256,
        align: 'center',
        lines: [
          { text: 'QC', size: 0.2, weight: 600 },
          { text: 'PASSED', size: 0.12, weight: 600, color: '#B33A0C' },
          { text: siteContent.bench.qcSerial, size: 0.08 },
          { text: 'INSP. 04', size: 0.08, color: '#5E584E' },
        ],
      }),
      ruler: createRulerTexture(30),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fonts],
  );
  useEffect(() => () => Object.values(tex).forEach((t) => t.dispose()), [tex]);

  return (
    <group>
      <Bench />
      {/* masking tape with a handwritten note */}
      <mesh position={[21, 0.008, 20.2]} rotation={[-Math.PI / 2, 0, 0.05]} raycast={() => null}>
        <planeGeometry args={[6.6, 1.1]} />
        <meshStandardMaterial map={tex.tape} transparent alphaTest={0.4} roughness={0.95} />
      </mesh>
      <StickyNote texture={tex.note} />
      {/* QC sticker */}
      <mesh position={[18.2, 0.008, 16.1]} rotation={[-Math.PI / 2, 0, -0.3]} raycast={() => null}>
        <circleGeometry args={[0.95, 40]} />
        <meshStandardMaterial map={tex.qc} roughness={0.85} />
      </mesh>
      {/* Kapton tape across a corner: amber, glossy, see-through */}
      <mesh position={[32, 0.012, -22.2]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} raycast={() => null}>
        <planeGeometry args={[5.4, 1.5]} />
        <meshStandardMaterial color={PALETTE.kapton} transparent opacity={0.55} roughness={0.12} metalness={0} depthWrite={false} />
      </mesh>
      {/* steel ruler along the front edge, for scale */}
      <mesh position={[-6, BENCH_Y + 0.025, 25.2]} rotation={[0, -0.015, 0]} raycast={() => null}>
        <boxGeometry args={[30.5, 0.05, 1.6]} />
        <meshStandardMaterial attach="material-0" color="#9a9994" metalness={1} roughness={0.4} />
        <meshStandardMaterial attach="material-1" color="#9a9994" metalness={1} roughness={0.4} />
        <meshStandardMaterial attach="material-2" map={tex.ruler} metalness={0.85} roughness={0.42} />
        <meshStandardMaterial attach="material-3" color="#9a9994" metalness={1} roughness={0.4} />
        <meshStandardMaterial attach="material-4" color="#9a9994" metalness={1} roughness={0.4} />
        <meshStandardMaterial attach="material-5" color="#9a9994" metalness={1} roughness={0.4} />
      </mesh>
      <Screwdriver />
    </group>
  );
}
