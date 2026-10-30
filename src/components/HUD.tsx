import { useEffect, useRef, useState } from 'react';
import { SECTIONS } from '../lib/sections';
import { scrollToSection } from '../hooks/useScrollProgress';
import { ACHIEVEMENTS, useStore } from '../store/useStore';
import { runtime } from '../store/runtime';
import { playSound } from '../hooks/useSound';

/**
 * Schematic rail: a hairline with a major tick per section (labelled with
 * its reference designator), minor ticks between, and a small pointer that
 * follows the camera continuously. Vertical on the right on desktop,
 * horizontal under the navbar on phones.
 */
function Rail() {
  const section = useStore((s) => s.section);
  const pointer = useRef<HTMLSpanElement>(null);
  const pointerH = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = `${Math.max(0, Math.min(1, runtime.camT)) * 100}%`;
      if (pointer.current) pointer.current.style.top = p;
      if (pointerH.current) pointerH.current.style.left = p;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const n = SECTIONS.length - 1;
  return (
    <nav aria-label="Sections">
      {/* desktop: vertical */}
      <div className="fixed right-6 top-1/2 z-30 hidden h-[52vh] -translate-y-1/2 sm:block">
        <div className="relative h-full w-px bg-overlay/45">
          {Array.from({ length: n * 4 + 1 }, (_, i) => (
            <span key={i} aria-hidden className="absolute right-0 h-px bg-overlay/45" style={{ top: `${(i / (n * 4)) * 100}%`, width: i % 4 === 0 ? 0 : 4 }} />
          ))}
          <span ref={pointer} aria-hidden className="absolute -right-[1px] h-0 w-0" style={{ top: 0 }}>
            <span className="absolute right-[3px] top-[-4px] border-y-[4px] border-r-[6px] border-y-transparent border-r-accent" />
          </span>
          <ol>
            {SECTIONS.map((s, i) => {
              const active = i === section;
              return (
                <li key={s.id} className="absolute right-0 -translate-y-1/2" style={{ top: `${(i / n) * 100}%` }}>
                  <button
                    type="button"
                    onClick={() => (playSound('click'), scrollToSection(i))}
                    aria-label={`Go to ${s.label} (${s.hardware})`}
                    aria-current={active ? 'step' : undefined}
                    className="group flex items-center gap-2 py-1 pl-3"
                  >
                    <span className={`font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${active ? 'text-overlay' : 'text-overlay/55 group-hover:text-overlay'}`}>
                      {s.ref}
                      <span className={`ml-1.5 ${active ? 'inline' : 'hidden group-hover:inline group-focus-visible:inline'}`}>{s.label}</span>
                    </span>
                    <span aria-hidden className={`h-px transition-all ${active ? 'w-4 bg-accent' : 'w-2.5 bg-overlay/70'}`} />
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      {/* phone: horizontal under the navbar */}
      <div className="fixed inset-x-4 top-[66px] z-30 sm:hidden">
        <div className="relative h-px w-full bg-overlay/45">
          <span ref={pointerH} aria-hidden className="absolute top-[3px] h-0 w-0" style={{ left: 0 }}>
            <span className="absolute -left-[4px] top-0 border-x-[4px] border-b-[6px] border-x-transparent border-b-accent" />
          </span>
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollToSection(i)}
              aria-label={`Go to ${s.label}`}
              aria-current={i === section ? 'step' : undefined}
              className="absolute -top-[14px] -translate-x-1/2 px-1.5 pb-2 pt-1"
              style={{ left: `${(i / n) * 100}%` }}
            >
              <span aria-hidden className={`mx-auto block h-2 w-px ${i === section ? 'bg-accent' : 'bg-overlay/70'}`} />
            </button>
          ))}
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-overlay/80">
          {SECTIONS[section].ref} · {SECTIONS[section].label}
        </p>
      </div>
    </nav>
  );
}

function ScrollHint() {
  const [show, setShow] = useState(true);
  const booted = useStore((s) => s.booted);
  useEffect(() => {
    const on = () => window.scrollY > 40 && setShow(false);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  if (!booted) return null;
  return (
    <div
      aria-hidden={!show}
      className={`pointer-events-none fixed bottom-6 right-6 z-30 hidden items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-overlay/80 transition-opacity duration-500 sm:flex ${show ? 'opacity-100' : 'opacity-0'}`}
    >
      <span className="block h-8 w-px bg-overlay/60" />
      Scroll, or use ↑ ↓
    </div>
  );
}

function AchievementsButton() {
  const count = useStore((s) => s.achievements.length);
  const setOpen = useStore((s) => s.setAchievementsOpen);
  const total = Object.keys(ACHIEVEMENTS).length;
  return (
    <button
      type="button"
      onClick={() => (setOpen(true), playSound('click'))}
      className="tag-card fixed bottom-4 left-4 z-30 hidden items-center gap-2 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.08em] transition-transform hover:-translate-y-px sm:flex"
      aria-label={`Inspection log: ${count} of ${total} checks passed`}
    >
      QC <span className="tabular-nums">{count}/{total}</span>
    </button>
  );
}

export function HUD() {
  return (
    <>
      <Rail />
      <ScrollHint />
      <AchievementsButton />
    </>
  );
}
