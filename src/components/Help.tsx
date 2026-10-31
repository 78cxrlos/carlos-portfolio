import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ui } from '../content/uiStrings';
import { useStore } from '../store/useStore';
import { useModal } from '../hooks/useModal';
import { playSound } from '../hooks/useSound';
import { Dialog } from './Dialog';
import { ViewSwitch } from './Navbar';
import { DrawHand, DrawKeyboard, DrawMouse } from './Icons';

function HowTo({ icon, title, items }: { icon: ReactNode; title: string; items: readonly string[] }) {
  return (
    <section className="border-2 border-ink p-4">
      <div className="flex items-center gap-3">
        <span className="text-ink">{icon}</span>
        <h3 className="font-serif text-[22px] leading-tight">{title}</h3>
      </div>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[18px] leading-[1.5]">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </section>
  );
}

/** Plain-language help: mouse, touch and keyboard, plus the way out to Simple. */
export function HelpPanel() {
  const open = useStore((s) => s.helpOpen);
  const setHelp = useStore((s) => s.setHelp);
  const setTour = useStore((s) => s.setTour);
  const simpleView = useStore((s) => s.simpleView);
  return (
    <Dialog open={open} onClose={() => setHelp(false)} title={ui.help.title} width="max-w-[880px]">
      <p className="text-[19px] leading-[1.6]">{ui.help.intro}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <HowTo icon={<DrawMouse />} title={ui.help.mouseTitle} items={ui.help.mouse} />
        <HowTo icon={<DrawHand />} title={ui.help.touchTitle} items={ui.help.touch} />
        <HowTo icon={<DrawKeyboard />} title={ui.help.keysTitle} items={ui.help.keys} />
      </div>
      <p className="mt-5 text-[18px] font-semibold leading-[1.6]">{ui.help.stuck}</p>
      {!simpleView && (
        <div className="mt-5 border-t border-ink pt-4">
          <h3 className="font-serif text-[22px]">{ui.help.simpleTitle}</h3>
          <p className="mt-1 text-[18px] leading-[1.6]">{ui.help.simpleBody}</p>
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn btn-solid" onClick={() => (playSound('click'), setTour(true))}>
          {ui.help.startTour}
        </button>
        <ViewSwitch long />
      </div>
    </Dialog>
  );
}

/** First element matching `[data-tour=…]` that is actually on screen. */
function findTarget(names: string[]): HTMLElement | null {
  for (const n of names) {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${n}"]`))) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && el.offsetParent !== null) return el;
    }
  }
  return null;
}

/** Which on-screen control each tour step points at (first visible one wins). */
const TARGETS_3D = [['next'], ['hero-panel'], ['projects-link', 'menu'], ['view-switch', 'menu']];
const TARGETS_SIMPLE = [['menu'], ['sv-buttons'], ['sv-projects'], ['view-switch', 'menu']];

/**
 * Four friendly tips. Each one outlines the real control it talks about.
 * Skippable at any time; replayable from the menu and from Help.
 */
export function Tour() {
  const open = useStore((s) => s.tourOpen);
  const setTour = useStore((s) => s.setTour);
  const simpleView = useStore((s) => s.simpleView);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const steps = simpleView ? ui.tour.stepsSimple : ui.tour.steps3d;
  const targets = simpleView ? TARGETS_SIMPLE : TARGETS_3D;
  const close = () => setTour(false);
  useModal(open, box, close, nextBtn);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => setRect(findTarget(targets[step])?.getBoundingClientRect() ?? null);
    measure();
    window.addEventListener('resize', measure);
    const t = window.setInterval(measure, 500); // targets can move (panels animate in)
    return () => {
      window.removeEventListener('resize', measure);
      window.clearInterval(t);
    };
  }, [open, step, targets]);

  if (!open) return null;
  const last = step === steps.length - 1;
  const s = steps[step];
  // keep the card away from the highlighted control
  const targetLow = rect ? rect.top > window.innerHeight / 2 : true;
  return (
    <div className="fixed inset-0 z-[85]" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      {rect && (
        <div
          aria-hidden
          className="pointer-events-none fixed border-4 border-accent shadow-[0_0_0_9999px_rgb(18_17_16/0.55)]"
          style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }}
        />
      )}
      {!rect && <div aria-hidden className="pointer-events-none fixed inset-0 bg-offblack/55" />}
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className={`sheet fixed inset-x-3 mx-auto max-w-[520px] p-5 sm:p-6 ${targetLow ? 'top-[84px]' : 'bottom-4'}`}
      >
        <p className="caption">{ui.tour.stepOf(step + 1, steps.length)}</p>
        <h2 id="tour-title" className="mt-1 font-serif text-[28px] leading-tight">
          {s.title}
        </h2>
        <p id="tour-body" className="mt-2 text-[19px] leading-[1.6]">
          {s.body}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="btn-quiet" onClick={close}>
            {ui.tour.skip}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" className="btn" onClick={() => setStep(step - 1)}>
                {ui.progress.back}
              </button>
            )}
            <button ref={nextBtn} type="button" className="btn btn-solid" onClick={() => (playSound('click'), last ? close() : setStep(step + 1))}>
              {last ? ui.tour.done : ui.tour.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
