import { useEffect, useRef } from 'react';
import { siteContent } from '../content/siteContent';
import { ui } from '../content/uiStrings';
import { useStore } from '../store/useStore';
import { lockPageScroll } from '../hooks/useModal';
import { playSound } from '../hooks/useSound';
import { IconArrowRight } from './Icons';

/**
 * First visit: who this is, one plain sentence, and a clear choice between
 * the 3D version and the simple page. The choice is remembered.
 */
export function Welcome() {
  const open = useStore((s) => s.welcomeOpen);
  const reason = useStore((s) => s.simpleReason);
  const chooseView = useStore((s) => s.chooseView);
  const heading = useRef<HTMLHeadingElement>(null);
  const p = siteContent.person;

  useEffect(() => {
    if (!open) return;
    heading.current?.focus();
    return lockPageScroll();
  }, [open]);

  if (!open) return null;
  const recommendSimple = !!reason;
  const choose = (v: 'simple' | '3d') => {
    playSound('click');
    window.scrollTo(0, 0);
    chooseView(v);
  };

  const simple = (
    <button type="button" className={`btn btn-big w-full flex-col !items-start !gap-1 text-left ${recommendSimple ? 'btn-solid' : ''}`} onClick={() => choose('simple')}>
      <span className="flex w-full items-center justify-between gap-3 text-[19px] font-semibold">
        {ui.welcome.simple} <IconArrowRight width={18} height={18} />
      </span>
      <span className="font-serif text-[16px] font-normal leading-snug opacity-90">{ui.welcome.simpleNote}</span>
      {recommendSimple && <span className="mt-1 border border-current px-1.5 text-[14px]">{ui.welcome.recommended}</span>}
    </button>
  );
  const interactive = (
    <button type="button" className={`btn btn-big w-full flex-col !items-start !gap-1 text-left ${recommendSimple ? '' : 'btn-solid'}`} onClick={() => choose('3d')}>
      <span className="flex w-full items-center justify-between gap-3 text-[19px] font-semibold">
        {ui.welcome.interactive} <IconArrowRight width={18} height={18} />
      </span>
      <span className="font-serif text-[16px] font-normal leading-snug opacity-90">{ui.welcome.interactiveNote}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[98] overflow-y-auto bg-bg px-4 py-8 sm:grid sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <main className="sheet mx-auto w-full max-w-[640px] p-6 sm:p-10">
        <p className="caption">{ui.welcome.eyebrow}</p>
        <h1 id="welcome-title" ref={heading} tabIndex={-1} className="mt-2 font-serif text-[clamp(44px,9vw,72px)] leading-[0.95] tracking-tightest outline-none">
          {p.name}
        </h1>
        <p className="mt-4 font-serif text-[22px] leading-[1.5]">{p.plainIntro}</p>
        <div className="mt-8 flex flex-col gap-3">
          {recommendSimple ? (
            <>
              {simple}
              {interactive}
            </>
          ) : (
            <>
              {interactive}
              {simple}
            </>
          )}
        </div>
        <p className="mt-5 text-[18px] leading-[1.6]">{ui.welcome.notSure}</p>
      </main>
    </div>
  );
}
