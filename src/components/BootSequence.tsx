import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { siteContent } from '../content/siteContent';
import { useStore } from '../store/useStore';
import { runtime } from '../store/runtime';
import { playSound } from '../hooks/useSound';
import { useBootProgress } from './Loader';
import { IconPower } from './Icons';

const LOG = [
  'ITM BIOS 2.3  (c) the person who drew this board',
  'CPU0: 8 cores, all present ................. OK',
  'Memory: 32768 MB ........................... OK  (counted it twice)',
  'Drives: 6 found, each one a project ........ OK',
  'Checking for coffee ........................ not found, continuing anyway',
  'GPU: compiling shaders ..................... ',
  'NET: link up, 1000 Mb/s .................... OK',
  `Loading ${siteContent.person.name}'s portfolio ...`,
  'Ready. Mind the loose screws.',
];
const GPU_LINE = 5;

/** Drop the camera from high above into the board (runtime.intro 0 → 1). */
export function playIntroDrop(instant = false) {
  gsap.killTweensOf(runtime, 'intro');
  if (instant) {
    runtime.intro = 1;
    return;
  }
  runtime.intro = 0;
  gsap.to(runtime, { intro: 1, duration: 2.8, ease: 'power3.inOut' });
}

/**
 * BOOT: black screen → glowing power button → BIOS-style typed log +
 * progress bar → fade out and camera drop. Click / Enter starts it; Skip is
 * always available. Completion is remembered in sessionStorage (store).
 */
export function BootSequence() {
  const booted = useStore((s) => s.booted);
  const setBooted = useStore((s) => s.setBooted);
  const unlock = useStore((s) => s.unlock);
  const sceneReady = useStore((s) => s.sceneReady);
  const reduced = useStore((s) => s.reducedMotion);
  const [phase, setPhase] = useState<'off' | 'boot' | 'done'>('off');
  const [lines, setLines] = useState<string[]>([]);
  const [typing, setTyping] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const loadPct = useBootProgress();

  const finish = useCallback(() => {
    if (phase === 'done') return;
    setPhase('done');
    playSound('success');
    const end = () => {
      setBooted(true);
      unlock('booted');
      playIntroDrop(reduced);
      requestAnimationFrame(() => (document.getElementById('hero-title') as HTMLElement | null)?.focus?.());
    };
    if (reduced || !root.current) return end();
    gsap.to(root.current, { opacity: 0, duration: 0.5, ease: 'power2.in', onComplete: end });
  }, [phase, setBooted, unlock, reduced]);

  const start = useCallback(() => {
    if (phase !== 'off') return;
    setPhase('boot');
    playSound('boot');
  }, [phase]);

  // reset when re-shown after a reboot
  useEffect(() => {
    if (!booted) {
      setPhase('off');
      setLines([]);
      setTyping('');
      if (root.current) gsap.set(root.current, { opacity: 1 });
      requestAnimationFrame(() => btn.current?.focus());
    }
  }, [booted]);

  useEffect(() => {
    if (booted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && phase === 'off') {
        e.preventDefault();
        start();
      } else if (e.key === 'Escape' && phase === 'boot') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [booted, phase, start, finish]);

  // type the log line by line
  useEffect(() => {
    if (phase !== 'boot') return;
    const idx = lines.length;
    if (idx >= LOG.length) {
      const t = window.setTimeout(finish, reduced ? 0 : 450);
      return () => window.clearTimeout(t);
    }
    // the GPU line waits until the scene has actually compiled
    if (idx === GPU_LINE + 1 && !sceneReady) return;
    const target = LOG[idx];
    if (reduced) {
      setLines((l) => [...l, idx === GPU_LINE ? `${target}OK` : target]);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 3;
      setTyping(target.slice(0, i));
      if (i >= target.length) {
        window.clearInterval(id);
        window.setTimeout(() => {
          setTyping('');
          setLines((l) => [...l, idx === GPU_LINE ? `${target}${sceneReady ? 'OK' : '…'}` : target]);
          if (idx % 3 === 0) playSound('hover');
        }, 90);
      }
    }, 14);
    return () => window.clearInterval(id);
  }, [phase, lines.length, sceneReady, reduced, finish]);

  // patch the GPU line once shaders finish compiling
  useEffect(() => {
    if (sceneReady) setLines((l) => l.map((x, i) => (i === GPU_LINE && x.endsWith('…') ? x.replace(/…$/, 'OK') : x)));
  }, [sceneReady]);

  if (booted) return null;
  const progress = phase === 'off' ? 0 : Math.min(100, (lines.length / LOG.length) * 100 * (sceneReady ? 1 : 0.85));

  return (
    <div ref={root} className="fixed inset-0 z-[95] flex flex-col justify-center bg-offblack px-6 text-bone sm:px-[8vw]" role="dialog" aria-modal="true" aria-label="Boot sequence">
      <button type="button" onClick={finish} className="absolute right-5 top-5 font-mono text-[11px] uppercase tracking-[0.12em] text-bone/60 underline-offset-4 hover:text-bone hover:underline" aria-label="Skip boot sequence">
        Skip
      </button>
      {phase === 'off' ? (
        <div className="flex max-w-xl flex-col items-start">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-bone/55">SW1 — power</p>
          <button
            ref={btn}
            type="button"
            onClick={start}
            autoFocus
            className="group mt-5 grid h-24 w-24 place-items-center border border-bone/80 bg-[#1b1a18] shadow-[3px_3px_0_0_rgba(233,228,216,0.8)] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_rgba(233,228,216,0.8)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            aria-label="Power on — start the boot sequence"
          >
            <IconPower width={34} height={34} strokeWidth={1.4} />
          </button>
          <p className="mt-8 font-serif text-[32px] leading-tight tracking-[-0.02em] sm:text-[40px]">
            Press the button. <span className="italic text-bone/60">Or hit Enter.</span>
          </p>
          <p className="mt-3 font-mono text-[11px] text-bone/55">
            {siteContent.person.name} · board rev 2.3 · shaders {Math.round(loadPct)}%
          </p>
        </div>
      ) : (
        <div className="w-full max-w-2xl font-mono text-[12.5px] leading-relaxed text-bone/85 sm:text-[13.5px]" aria-live="polite">
          {lines.map((l, i) => (
            <div key={i} className="whitespace-pre-wrap">
              <span className="text-bone/40">{(i * 0.137 + 0.02).toFixed(3).padStart(7, ' ')}</span>  {l}
            </div>
          ))}
          {typing && (
            <div className="whitespace-pre-wrap">
              <span className="text-bone/40">{(lines.length * 0.137 + 0.02).toFixed(3).padStart(7, ' ')}</span>  {typing}
              <span className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[2px] bg-bone/80" />
            </div>
          )}
          <div className="mt-6 h-px w-full bg-bone/25" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Boot progress">
            <div className="h-px bg-bone transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-bone/50">
            <span>{Math.round(progress)}%</span>
            <span>Esc to skip</span>
          </div>
        </div>
      )}
    </div>
  );
}
