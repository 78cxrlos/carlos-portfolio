import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { DUR, EASE } from '../lib/motion';
import { siteContent } from '../content/siteContent';
import { ACHIEVEMENTS, useStore, type AchievementId } from '../store/useStore';
import { IconClose } from './Icons';

const SECRET: AchievementId[] = ['konami', 'chip', 'sudo'];

/** The inspection log: each check gets an ink stamp when it passes. */
export function Achievements() {
  const open = useStore((s) => s.achievementsOpen);
  const setOpen = useStore((s) => s.setAchievementsOpen);
  const unlocked = useStore((s) => s.achievements);
  const box = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    if (box.current) gsap.fromTo(box.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: DUR.base, ease: EASE.out });
  }, [open]);

  if (!open) return null;
  const ids = Object.keys(ACHIEVEMENTS) as AchievementId[];
  return (
    <div className="fixed inset-0 z-[66] bg-offblack/40" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="ach-title" className="sheet panel-scroll absolute bottom-3 left-3 right-3 max-h-[78vh] overflow-y-auto p-5 sm:right-auto sm:w-[400px]">
        <div className="mb-1 flex items-start justify-between border-b border-ink pb-2">
          <div>
            <p className="caption">Inspection log · {siteContent.bench.qcSerial}</p>
            <h2 id="ach-title" className="font-serif text-[30px] leading-none tracking-tightest">
              {unlocked.length} of {ids.length} checks
            </h2>
          </div>
          <button ref={closeBtn} type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close inspection log">
            <IconClose width={16} height={16} />
          </button>
        </div>
        <ol>
          {ids.map((id, i) => {
            const on = unlocked.includes(id);
            const a = ACHIEVEMENTS[id];
            const hidden = SECRET.includes(id) && !on;
            return (
              <li key={id} className="grid grid-cols-[28px_1fr_auto] items-center gap-2 border-b border-ink/30 py-2.5">
                <span className="font-mono text-[11px] text-muted">{String(i + 1).padStart(2, '0')}</span>
                <span className="min-w-0">
                  <span className="block font-mono text-[12px] font-semibold uppercase tracking-[0.04em]">{hidden ? 'Unlisted' : a.label}</span>
                  <span className="block font-serif text-[14px] leading-snug text-muted">{hidden ? 'Not on the checklist. Keep poking around.' : a.hint}</span>
                </span>
                {on ? (
                  <span className="stamp text-[9.5px]" style={{ transform: `rotate(${(i % 3) * 3 - 5}deg)` }}>
                    Passed
                  </span>
                ) : (
                  <span className="h-6 w-14 border border-dashed border-ink/40" aria-label="not yet" />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
