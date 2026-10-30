import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, type CursorState } from '../store/useStore';
import { runtime } from '../store/runtime';
import { SECTION_COUNT } from '../lib/sections';
import { playSound } from '../hooks/useSound';

/** 1 when the camera sits on station `i`, fading to 0 one station away. */
export function stationProximity(i: number, t = runtime.camT) {
  return Math.max(0, 1 - Math.abs(t * (SECTION_COUNT - 1) - i));
}

/** Pointer handlers that switch the custom cursor + play a hover tick. */
export function useHoverCursor(state: CursorState = 'hover') {
  const setCursor = useStore((s) => s.setCursor);
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setCursor(state);
      playSound('hover');
    },
    onPointerOut: () => setCursor('default'),
  };
}

/**
 * Re-render once the fonts used inside canvas textures are loaded, so chip
 * markings and handwriting don't get baked in a fallback face. Fonts that
 * aren't used in the DOM yet (Caveat) are requested explicitly.
 */
let fontsPromise: Promise<unknown> | null = null;
export function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!document.fonts) return setReady(true);
    let alive = true;
    fontsPromise ??= Promise.all([
      document.fonts.load('500 40px "IBM Plex Mono"'),
      document.fonts.load('600 40px "IBM Plex Mono"'),
      document.fonts.load('600 40px Caveat'),
      document.fonts.load('500 40px Newsreader'),
    ]).catch(() => undefined);
    // never wait forever (offline: fall back to system fonts)
    const t = window.setTimeout(() => alive && setReady(true), 2500);
    fontsPromise.then(() => alive && setReady(true));
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, []);
  return ready;
}

/** Dispose a list of disposables on unmount (geometries, materials, textures). */
export function useDisposable<T extends { dispose: () => void }>(items: T[]) {
  useEffect(() => () => items.forEach((i) => i.dispose()), [items]);
}

const _v = new THREE.Vector3();

/**
 * LAZY SECTION — performance trick. Detailed hardware is only mounted once the
 * camera first comes within `radius`, and is hidden (not rendered, not
 * raycast) whenever it's farther than `radius`. Distance is checked every
 * few frames, not every frame.
 */
export function LazySection({ center, radius, children }: { center: THREE.Vector3; radius: number; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const group = useRef<THREE.Group>(null);
  const frame = useRef(0);
  useFrame(({ camera }) => {
    if (frame.current++ % 8 !== 0) return;
    const d = camera.getWorldPosition(_v).distanceTo(center);
    const near = d < radius;
    if (near && !mounted) setMounted(true);
    if (group.current) group.current.visible = near;
  });
  return <group ref={group}>{mounted && children}</group>;
}

/**
 * First-time contextual hint anchored to a 3D object. Shown while its section
 * is active until the visitor interacts (markHint) or 9 seconds pass.
 */
export function SceneHint({ id, section, position, text }: { id: string; section: number; position: [number, number, number]; text: string }) {
  const active = useStore((s) => s.section === section && s.booted && !s.hintsSeen.includes(id) && s.activeProject === null);
  const markHint = useStore((s) => s.markHint);
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => markHint(id), 9000);
    return () => window.clearTimeout(t);
  }, [active, id, markHint]);
  if (!active) return null;
  return (
    <Html position={position} center zIndexRange={[30, 20]} style={{ pointerEvents: 'none' }}>
      <div className="scene-hint">
        <b>Try —</b> {text}
      </div>
    </Html>
  );
}
