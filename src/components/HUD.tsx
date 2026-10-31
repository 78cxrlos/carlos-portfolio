import { useEffect, useRef, useState } from 'react';
import { ui } from '../content/uiStrings';
import { SECTIONS } from '../lib/sections';
import { scrollToSection } from '../hooks/useScrollProgress';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { IconArrowLeft, IconArrowRight, IconArrowUp } from './Icons';

const N = SECTIONS.length;

/**
 * Clickable progress dots. Each one shows its name on hover, on keyboard
 * focus, and for a moment after a tap (touch has no hover).
 */
function Dots({ section }: { section: number }) {
  const [tip, setTip] = useState<number | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const flash = (i: number) => {
    setTip(i);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTip(null), 1600);
  };
  return (
    <ol className="flex items-center justify-center" aria-label={ui.progress.dotsLabel}>
      {SECTIONS.map((s, i) => {
        const active = i === section;
        return (
          <li key={s.id} className="relative">
            <button
              type="button"
              onClick={() => (playSound('click'), scrollToSection(i))}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setTip(i)}
              onPointerLeave={(e) => e.pointerType === 'mouse' && setTip(null)}
              onPointerDown={(e) => e.pointerType !== 'mouse' && flash(i)}
              onFocus={() => setTip(i)}
              onBlur={() => setTip(null)}
              aria-label={`${ui.progress.goTo(s.label)} (${ui.progress.of(i + 1, N)})`}
              aria-current={active ? 'step' : undefined}
              className="grid h-11 w-11 place-items-center"
            >
              <span aria-hidden className={`block border-2 border-ink transition-[width,height] ${active ? 'h-4 w-4 bg-accent' : i < section ? 'h-3 w-3 bg-ink' : 'h-3 w-3 bg-surface'}`} />
            </button>
            {tip === i && (
              <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap border-2 border-ink bg-surface px-2 py-0.5 font-mono text-[15px] text-ink">
                {s.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Fixed at the bottom of the 3D view: Back, where you are ("Section 2 of 7"),
 * clickable dots, Next. Pressing Next alone walks through the whole site.
 */
export function HUD() {
  const section = useStore((s) => s.section);
  const booted = useStore((s) => s.booted);
  const prev = SECTIONS[section - 1];
  const next = SECTIONS[section + 1];
  const go = (i: number) => (playSound('click'), scrollToSection(i));
  if (!booted) return null;
  return (
    <nav aria-label={ui.progress.dotsLabel} className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-surface text-ink">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 py-1.5 sm:px-4 max-md:grid-cols-[auto_1fr_auto]">
        <div className="flex items-center gap-2">
          {prev ? (
            <button type="button" className="btn !px-3" onClick={() => go(section - 1)} aria-label={ui.progress.backTo(prev.label)}>
              <IconArrowLeft width={16} height={16} /> <span>{ui.progress.back}</span>
            </button>
          ) : (
            <span className="h-12 w-[88px]" aria-hidden />
          )}
          <button type="button" className={`btn-quiet hidden lg:inline-flex ${section === 0 ? 'invisible' : ''}`} onClick={() => go(0)}>
            <IconArrowUp width={16} height={16} /> {ui.progress.top}
          </button>
        </div>

        <div className="flex min-w-0 flex-col items-center">
          <p className="text-center font-mono text-[15px] leading-tight" aria-live="polite">
            <span className="text-muted">{ui.progress.of(section + 1, N)}:</span> <span className="whitespace-nowrap font-semibold">{SECTIONS[section].label}</span>
          </p>
          <div className="max-md:hidden">
            <Dots section={section} />
          </div>
        </div>

        <div className="flex justify-end">
          {next ? (
            <button type="button" data-tour="next" className="btn btn-solid !px-3 sm:!px-4" onClick={() => go(section + 1)} aria-label={`${ui.progress.next}: ${next.label}`}>
              <span className="sm:hidden">{ui.progress.next}</span>
              <span className="hidden sm:inline">{ui.progress.nextTo(next.label)}</span>
              <IconArrowRight width={16} height={16} />
            </button>
          ) : (
            <button type="button" data-tour="next" className="btn btn-solid" onClick={() => go(0)}>
              <IconArrowUp width={16} height={16} /> {ui.progress.top}
            </button>
          )}
        </div>
      </div>
      {/* phones: dots on their own row, so every one is a full-size target */}
      <div className="border-t border-ink/30 md:hidden">
        <Dots section={section} />
      </div>
    </nav>
  );
}
