import { useStore } from '../store/useStore';

/** Power-off: the lamp dims (handled in the scene) and the screen fades to the bench. */
export function PowerDownOverlay() {
  const powering = useStore((s) => s.powering);
  if (!powering) return null;
  return (
    <div className="pointer-events-auto fixed inset-0 z-[96] bg-offblack [animation:pd-fade_1.3s_cubic-bezier(.5,0,.75,0)_both]" aria-live="assertive">
      <p className="absolute bottom-8 left-8 font-mono text-[12px] text-bone/70">System halted. It is now safe to close this tab.</p>
      <style>{`@keyframes pd-fade { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}
