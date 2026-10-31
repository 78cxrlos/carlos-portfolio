import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { ui } from '../content/uiStrings';
import { lockPageScroll } from '../hooks/useModal';

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

/**
 * Shown while the 3D version downloads and warms up. Says what is happening,
 * shows real progress, and always offers the simple version as a way out.
 */
export function Loader() {
  const ready = useStore((s) => s.sceneReady);
  const setSimpleView = useStore((s) => s.setSimpleView);
  const pct = Math.round(useBootProgress());
  const [gone, setGone] = useState(false);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (ready) {
      const t = window.setTimeout(() => setGone(true), 300);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setSlow(true), 15000);
    return () => window.clearTimeout(t);
  }, [ready]);
  useEffect(() => (gone ? undefined : lockPageScroll()), [gone]);
  if (gone) return null;
  return (
    <div className={`fixed inset-0 z-[90] grid place-items-center bg-bg px-4 transition-opacity duration-300 ${ready ? 'opacity-0' : 'opacity-100'}`} role="dialog" aria-modal="true" aria-labelledby="loading-title">
      <div className="sheet w-full max-w-[560px] p-6 sm:p-8">
        <p id="loading-title" className="font-serif text-[22px] leading-[1.5]">
          {ui.loading.title}
        </p>
        <div className="mt-5 h-4 border-2 border-ink" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={ui.loading.percent(pct)}>
          <div className="h-full bg-ink transition-[width] duration-150" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 font-mono text-[16px] tabular-nums" aria-live="polite">
          {ui.loading.percent(pct)}
        </p>
        {slow && <p className="mt-3 text-[18px] leading-[1.6]">{ui.loading.slow}</p>}
        <button type="button" className="btn btn-big mt-6 w-full" onClick={() => setSimpleView(true)}>
          {ui.loading.useSimple}
        </button>
      </div>
    </div>
  );
}
