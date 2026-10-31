import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { runtime } from '../store/runtime';
import { ui } from '../content/uiStrings';

/** True if the browser can create a WebGL context. */
export function detectWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const ok = !!gl;
    (gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

/** Tracks document visibility so the render loop can pause in hidden tabs. */
export function usePageVisible() {
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  useEffect(() => {
    const on = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return visible;
}

/**
 * Environment probing + activity tracking:
 *  - falls back to Simple View when WebGL is missing
 *  - follows prefers-reduced-motion changes
 *  - tracks the pointer (camera parallax) and idleness (ambient idle animation)
 */
export function usePerformance() {
  useEffect(() => {
    if (!detectWebGL()) {
      const s = useStore.getState();
      s.setWebglOk(false);
      useStore.setState({ welcomeOpen: false });
      s.toast({ tone: 'info', title: ui.nav.toSimpleLong, body: ui.errors.noWebgl });
    }

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMq = () => useStore.getState().setOsReducedMotion(mq.matches);
    mq.addEventListener?.('change', onMq);

    let idleTimer = 0;
    const bump = () => {
      useStore.getState().setIdle(false);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => useStore.getState().setIdle(true), 12000);
    };
    const onMove = (e: PointerEvent) => {
      runtime.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      runtime.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      bump();
    };
    const onResize = () => useStore.setState({ isMobile: window.innerWidth < 768 });
    // While dragging a 3D part on touch, stop the page from scrolling.
    const onTouchMove = (e: TouchEvent) => {
      if (runtime.dragging || runtime.overclocking) e.preventDefault();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('keydown', bump);
    window.addEventListener('scroll', bump, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    bump();
    return () => {
      mq.removeEventListener?.('change', onMq);
      window.clearTimeout(idleTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', bump);
      window.removeEventListener('scroll', bump);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);
}
