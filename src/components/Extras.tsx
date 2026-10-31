import { ui } from '../content/uiStrings';
import { ACHIEVEMENTS, useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { IconTerminal, IconTrophy } from './Icons';

const TOTAL = Object.keys(ACHIEVEMENTS).length;

/** The two optional extras, always with words: "Terminal" and "Things to try 3/15". */
export function ExtrasButtons({ className = 'flex flex-wrap gap-2', btn = 'btn' }: { className?: string; btn?: string }) {
  const done = useStore((s) => s.achievements.length);
  const setTerminal = useStore((s) => s.setTerminal);
  const setAchievementsOpen = useStore((s) => s.setAchievementsOpen);
  return (
    <div className={className}>
      <button type="button" className={btn} onClick={() => (playSound('click'), setAchievementsOpen(true))} aria-label={ui.extras.buttonLabel(done, TOTAL)}>
        <IconTrophy width={16} height={16} /> {ui.extras.button}
        <span className="tabular-nums">{ui.extras.buttonCount(done, TOTAL)}</span>
      </button>
      <button type="button" className={btn} onClick={() => (playSound('click'), setTerminal(true))} aria-label={ui.extras.terminalLabel}>
        <IconTerminal width={16} height={16} /> {ui.extras.terminal}
      </button>
    </div>
  );
}

/**
 * Small dock in a free corner of the screen. 3D view: bottom right, above the
 * bar (desktop widths, where the text panel is on the left). Simple View:
 * bottom left, only where there is a wide empty margin. Elsewhere the same
 * buttons are in the Menu and in the "Just for fun" boxes.
 */
export function ExtrasDock() {
  const simple = useStore((s) => s.simpleView || !s.webglOk);
  const booted = useStore((s) => s.booted);
  const terminalOpen = useStore((s) => s.terminalOpen);
  if (terminalOpen || (!simple && !booted)) return null;
  return (
    <aside aria-label={ui.extras.funTitle} className={simple ? 'fixed bottom-4 left-4 z-30 hidden min-[1320px]:block' : 'fixed bottom-[100px] right-4 z-30 hidden min-[900px]:block'}>
      <ExtrasButtons className="flex flex-col items-stretch gap-2" btn="btn !justify-start" />
    </aside>
  );
}

/** "Just for fun" box at the end of the page (works at every screen size). */
export function ExtrasBox() {
  return (
    <div className="border-2 border-ink/60 p-4">
      <h3 className="font-serif text-[22px]">{ui.extras.funTitle}</h3>
      <p className="mt-1 text-[17px] leading-[1.5]">{ui.extras.funBody}</p>
      <ExtrasButtons className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap" />
    </div>
  );
}
