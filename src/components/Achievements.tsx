import { useState } from 'react';
import { ui } from '../content/uiStrings';
import { navigateTo } from '../lib/navigation';
import { ACHIEVEMENTS, useStore, type AchievementId } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { Dialog } from './Dialog';
import { IconArrowRight } from './Icons';

function Item({ id, done }: { id: AchievementId; done: boolean }) {
  const a = ACHIEVEMENTS[id];
  const [showAnswer, setShowAnswer] = useState(false);
  const simple = useStore((s) => s.simpleView || !s.webglOk);
  const setOpen = useStore((s) => s.setAchievementsOpen);
  const hiddenSecret = a.secret && !done;
  const canGo = !done && a.section && !(simple && a.needs3d);

  return (
    <li className="border-b border-ink/30 py-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-[20px] font-semibold leading-tight">
          {a.secret && <span className="mr-2 border border-ink px-1.5 align-middle font-mono text-[14px] font-normal">{ui.extras.secret}</span>}
          {a.label}
        </h3>
        {done ? (
          <span className="stamp shrink-0 text-[14px]">{ui.extras.done}</span>
        ) : (
          <span className="shrink-0 border border-dashed border-ink/60 px-2 py-0.5 font-mono text-[14px] text-muted">{ui.extras.notYet}</span>
        )}
      </div>

      {hiddenSecret ? (
        <>
          <p className="mt-1 text-[17px] leading-[1.5]">
            <span className="font-semibold">{ui.extras.clue}: </span>
            {a.clue}
          </p>
          {showAnswer && (
            <p className="mt-2 border-l-4 border-accent pl-3 text-[17px] leading-[1.5]" role="status">
              {a.answer}
            </p>
          )}
          <button type="button" className="btn-quiet mt-1 block" aria-expanded={showAnswer} onClick={() => (playSound('click'), setShowAnswer((v) => !v))}>
            {showAnswer ? ui.extras.hideHint : ui.extras.biggerHint}
          </button>
        </>
      ) : (
        <p className="mt-1 text-[17px] leading-[1.5]">{a.task ?? a.answer}</p>
      )}

      {!done && a.needs3d && simple && <p className="mt-1 font-mono text-[14px] text-muted">{ui.extras.only3d}</p>}
      {canGo && (
        <button
          type="button"
          className="btn mt-2 !min-h-[44px] !px-3"
          onClick={() => {
            playSound('click');
            setOpen(false);
            window.setTimeout(() => navigateTo(a.section!), 10);
          }}
        >
          {ui.extras.goThere} <IconArrowRight width={14} height={14} />
        </button>
      )}
    </li>
  );
}

/** "Things to try": a checklist of fun extras, with clues for the secret ones. */
export function Achievements() {
  const open = useStore((s) => s.achievementsOpen);
  const setOpen = useStore((s) => s.setAchievementsOpen);
  const unlocked = useStore((s) => s.achievements);
  const ids = Object.keys(ACHIEVEMENTS) as AchievementId[];
  const pct = Math.round((unlocked.length / ids.length) * 100);
  return (
    <Dialog open={open} onClose={() => setOpen(false)} caption={ui.extras.caption} title={ui.extras.title} width="max-w-[600px]">
      <p className="font-mono text-[16px]">{ui.extras.progress(unlocked.length, ids.length)}</p>
      <div className="mt-2 h-3 border-2 border-ink" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={ui.extras.progress(unlocked.length, ids.length)}>
        <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
      </div>
      <ol className="mt-3">
        {ids.map((id) => (
          <Item key={id} id={id} done={unlocked.includes(id)} />
        ))}
      </ol>
    </Dialog>
  );
}
