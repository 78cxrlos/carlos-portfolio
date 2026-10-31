import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { siteContent } from '../content/siteContent';
import { ui } from '../content/uiStrings';
import { useStore } from '../store/useStore';
import { runtime } from '../store/runtime';
import { lockPageScroll } from '../hooks/useModal';
import { playSound } from '../hooks/useSound';

/** Playful start-up log. Each line pairs the computer word with what it means. */
const LOG = [
  'Power ......................... on',
  'Processor (CPU) ............... OK, 8 cores',
  'Memory (RAM) .................. OK, counted it twice',
  'Drives: 6 found ............... one for each project',
  'Network ....................... connected',
  `Loading ${siteContent.person.name}'s portfolio ... ready`,
];
/** Whole animation never takes longer than this. */
const MAX_MS = 3200;

/** Drop the camera from above into the board (runtime.intro 0 → 1). */
export function playIntroDrop(instant = false) {
  gsap.killTweensOf(runtime, 'intro');
  if (instant) {
    runtime.intro = 1;
    return;
  }
  runtime.intro = 0;
  gsap.to(runtime, { intro: 1, duration: 2.4, ease: 'power2.inOut' });
}

/**
 * Short start-up animation shown once per visit after the 3D version loads.
 * Starts on its own, lasts about 3 seconds, and can be skipped at any time
 * (big Skip button or Esc). Skipped entirely with reduced motion.
 */
export function BootSequence() {
  const setBooted = useStore((s) => s.setBooted);
  const unlock = useStore((s) => s.unlock);
  const reduced = useStore((s) => s.reducedMotion);
  const [shown, setShown] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const skipBtn = useRef<HTMLButtonElement>(null);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    const end = () => {
      setBooted(true);
      unlock('booted', true); // no pop-up: the tour is about to start
      playIntroDrop(reduced);
      requestAnimationFrame(() => (document.getElementById('hero-title') as HTMLElement | null)?.focus?.({ preventScroll: true }));
      const s = useStore.getState();
      if (!s.tourSeen) window.setTimeout(() => s.setTour(true), reduced ? 100 : 1600);
    };
    if (reduced || !root.current) return end();
    playSound('success');
    gsap.to(root.current, { opacity: 0, duration: 0.4, ease: 'power2.in', onComplete: end });
  }, [setBooted, unlock, reduced]);

  useEffect(() => {
    if (reduced) return finish();
    const unlockScroll = lockPageScroll();
    skipBtn.current?.focus({ preventScroll: true });
    playSound('boot');
    const step = (MAX_MS - 500) / LOG.length;
    const timers = LOG.map((_, i) => window.setTimeout(() => setShown(i + 1), step * (i + 1)));
    timers.push(window.setTimeout(finish, MAX_MS));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish();
    window.addEventListener('keydown', onKey);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('keydown', onKey);
      unlockScroll();
    };
  }, [reduced, finish]);

  if (reduced) return null;
  const progress = Math.round((shown / LOG.length) * 100);
  return (
    <div ref={root} className="fixed inset-0 z-[95] flex flex-col justify-center bg-offblack px-5 text-bone sm:px-[8vw]" role="dialog" aria-modal="true" aria-labelledby="boot-title">
      <button ref={skipBtn} type="button" onClick={finish} className="absolute right-4 top-4 min-h-[48px] border-2 border-bone px-5 font-mono text-[17px] text-bone hover:bg-bone hover:text-offblack" aria-label={ui.boot.skipLabel}>
        {ui.boot.skip} →
      </button>
      <div className="w-full max-w-2xl">
        <h1 id="boot-title" className="font-serif text-[34px] leading-tight">
          {ui.boot.title}…
        </h1>
        <p className="mt-2 text-[18px] leading-[1.6] text-bone/85">{ui.boot.explain}</p>
        <div className="mt-6 font-mono text-[15px] leading-relaxed text-bone/90" aria-hidden>
          {LOG.slice(0, shown).map((l) => (
            <div key={l} className="whitespace-pre-wrap">
              {l}
            </div>
          ))}
        </div>
        <div className="mt-6 h-2 w-full border border-bone/60" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={ui.boot.title}>
          <div className="h-full bg-bone transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
