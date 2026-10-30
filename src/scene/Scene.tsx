import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor, AdaptiveEvents, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { ANCHORS } from './anchors';
import { useStore, type Quality } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { usePageVisible } from '../hooks/usePerformance';
import { CameraRig } from './CameraRig';
import { Lights } from './Lights';
import { Effects } from './Effects';
import { Board } from './Board';
import { Traces } from './Traces';
import { Cpu, Thermals } from './Cpu';
import { Ram } from './Ram';
import { Gpu } from './Gpu';
import { Storage } from './Storage';
import { DataBus } from './DataBus';
import { NetworkPort } from './NetworkPort';
import { Particles } from './Particles';
import { Parts } from './Parts';
import { LazySection } from './helpers';
import { Props } from './Props';
import { fireSignal } from '../store/runtime';
import type { CursorState } from '../store/useStore';

/** Marks the scene ready after the first couple of rendered frames (shaders compiled). */
function ReadySignal() {
  const setSceneReady = useStore((s) => s.setSceneReady);
  const [frames, setFrames] = useState(0);
  useFrame(() => {
    if (frames < 3) setFrames((f) => f + 1);
  });
  useEffect(() => {
    if (frames >= 3) setSceneReady(true);
  }, [frames, setSceneReady]);
  return null;
}

/** Mirrors drei's loading-manager progress into the store for the DOM boot loader. */
function ProgressBridge() {
  const { progress, active } = useProgress();
  useEffect(() => {
    useStore.setState({ assetProgress: active ? progress : 100 });
  }, [progress, active]);
  return null;
}

/** Pre-compile every material up front to avoid hitches the first time a section shows. */
function Precompile() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    gl.compile(scene, camera);
  }, [gl, scene, camera]);
  return null;
}

/** Workbench background + distance haze in the bench colour; exposure per theme. */
function Atmosphere() {
  const theme = useTheme();
  const { scene, gl } = useThree();
  useEffect(() => {
    scene.fog = new THREE.Fog(theme.bench, 55, 150);
    scene.background = new THREE.Color(theme.bench);
    gl.toneMappingExposure = theme.exposure;
  }, [scene, gl, theme]);
  return null;
}

/** Standard CSS cursors only: pointer / grab / grabbing over interactive 3D. */
const CSS_CURSOR: Record<CursorState, string> = {
  default: '',
  hover: 'pointer',
  grab: 'grab',
  grabbing: 'grabbing',
  text: 'text',
  hold: 'pointer',
};
function CursorSync() {
  const cursor = useStore((s) => s.cursor);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.domElement.style.cursor = CSS_CURSOR[cursor];
  }, [cursor, gl]);
  return null;
}

/**
 * Shadows: every opaque mesh casts and receives. Transparent overlays
 * (signal traces, tape, shimmer) and points are skipped. Re-checked every
 * couple of seconds because sections mount lazily.
 */
function ShadowTagger() {
  const scene = useThree((s) => s.scene);
  const frame = useRef(0);
  useFrame(() => {
    if (frame.current++ % 120 !== 0) return;
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData.shadowTagged) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      const opaque = mats.every((mt) => mt && !mt.transparent && !(mt as THREE.ShaderMaterial).isShaderMaterial && !(mt as THREE.MeshBasicMaterial).isMeshBasicMaterial);
      m.castShadow = opaque;
      m.receiveShadow = opaque;
      m.userData.shadowTagged = true;
    });
  });
  return null;
}

/** A signal edge runs along the copper every time the camera arrives somewhere. */
function SignalDriver() {
  const section = useStore((s) => s.section);
  const booted = useStore((s) => s.booted);
  useEffect(() => {
    if (!booted) return;
    const t = window.setTimeout(fireSignal, 700);
    return () => window.clearTimeout(t);
  }, [section, booted]);
  return null;
}

const PARTICLES: Record<Quality, number> = { 0: 80, 1: 200, 2: 420 };

export default function Scene() {
  const quality = useStore((s) => s.quality);
  const setQuality = useStore((s) => s.setQuality);
  const isMobile = useStore((s) => s.isMobile);
  const visible = usePageVisible();
  const maxQ: Quality = isMobile ? 1 : 2;
  // Cap DPR: 1.75 high / 1.4 medium / 1 low (mobile max 1.5)
  const dprMax = Math.min(isMobile ? 1.5 : 2, quality === 2 ? 1.75 : quality === 1 ? 1.4 : 1);
  const particleCount = Math.round(PARTICLES[quality] * (isMobile ? 0.5 : 1));

  return (
    <Canvas
      className="scene-canvas"
      dpr={[1, dprMax]}
      frameloop={visible ? 'always' : 'never'}
      shadows="soft"
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false }}
      camera={{ fov: 45, near: 0.1, far: 220, position: [0, 95, 6] }}
      onCreated={({ gl, scene, camera }) => {
        // Dev-only handle for debugging from the console (stripped from production builds).
        if (import.meta.env.DEV) (window as unknown as { __itm: unknown }).__itm = { gl, scene, camera };
        // AgX keeps warm highlights from going yellow-white the way ACES does
        gl.toneMapping = THREE.AgXToneMapping;
      }}
      aria-hidden
    >
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => setQuality(Math.max(0, useStore.getState().quality - 1) as Quality)}
        onIncline={() => setQuality(Math.min(maxQ, useStore.getState().quality + 1) as Quality)}
        onFallback={() => setQuality(0)}
      />
      <AdaptiveEvents />
      <ProgressBridge />
      <Atmosphere />
      <CursorSync />
      <ShadowTagger />
      <SignalDriver />
      <CameraRig />
      <Thermals />
      <Lights />
      <Suspense fallback={null}>
        <Board />
        <Props />
        <Traces />
        <Parts />
        <LazySection center={ANCHORS.cpu} radius={75}>
          <Cpu />
        </LazySection>
        <LazySection center={ANCHORS.ram} radius={75}>
          <Ram />
        </LazySection>
        <LazySection center={ANCHORS.gpu} radius={75}>
          <Gpu />
          <Storage />
        </LazySection>
        <LazySection center={new THREE.Vector3(-8, 0, 12)} radius={75}>
          <DataBus />
        </LazySection>
        <LazySection center={ANCHORS.port} radius={75}>
          <NetworkPort />
        </LazySection>
        <Particles count={particleCount} />
        <Precompile />
      </Suspense>
      <Effects quality={quality} />
      <ReadySignal />
    </Canvas>
  );
}
