import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

/**
 * Asset/scene progress. Everything is procedural, so drei's useProgress
 * (bridged into the store by <ProgressBridge> inside the lazy 3D chunk)
 * usually jumps straight to 100; we combine it with `sceneReady` (first
 * frames rendered + shaders compiled) so the bar reflects real GPU warm-up.
 */
export function useBootProgress() {
  const assetProgress = useStore((s) => s.assetProgress);
  const ready = useStore((s) => s.sceneReady);
  const [fake, setFake] = useState(0);
  useEffect(() => {
    if (ready) return;
    const id = window.setInterval(() => setFake((f) => Math.min(90, f + (90 - f) * 0.12)), 80);
    return () => window.clearInterval(id);
  }, [ready]);
  return ready ? 100 : Math.min(Math.max(assetProgress, 1), fake);
}

/** Boot-loader styled overlay shown while the 3D scene warms up (revisits skip the boot sequence). */
export function Loader() {
  const ready = useStore((s) => s.sceneReady);
  const pct = useBootProgress();
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => setGone(true), 500);
    return () => window.clearTimeout(t);
  }, [ready]);
  if (gone) return null;
  return (
    <div className={`fixed inset-0 z-[90] flex items-end bg-offblack p-8 transition-opacity duration-500 ${ready ? 'opacity-0' : 'opacity-100'}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Loading the board">
      <div className="w-[min(320px,80vw)] font-mono text-bone">
        <p className="text-[11px] uppercase tracking-[0.14em] text-bone/60">Warming up the soldering iron</p>
        <div className="mt-3 h-px bg-bone/25">
          <div className="h-px bg-bone transition-[width] duration-150" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-[11px] tabular-nums text-bone/50">{Math.round(pct)}%</p>
      </div>
    </div>
  );
}
