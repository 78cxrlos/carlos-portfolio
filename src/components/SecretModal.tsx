import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { DUR, EASE } from '../lib/motion';
import { useStore } from '../store/useStore';

/** A note left under the chip. */
export function SecretModal() {
  const msg = useStore((s) => s.secretMessage);
  const set = useStore((s) => s.setSecretMessage);
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!msg) return;
    btn.current?.focus();
    if (box.current) gsap.fromTo(box.current, { opacity: 0, y: 20, rotate: -2 }, { opacity: 1, y: 0, rotate: -0.6, duration: DUR.slow, ease: EASE.settle });
  }, [msg]);
  if (!msg) return null;
  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-offblack/55 p-4" onMouseDown={(e) => e.target === e.currentTarget && set(null)}>
      <div ref={box} role="alertdialog" aria-modal="true" aria-labelledby="secret-title" className="sheet w-full max-w-md p-6">
        <p className="caption">Found under U14 · not in the BOM</p>
        <h2 id="secret-title" className="mt-1 font-serif text-[34px] leading-none tracking-tightest">
          An unmarked part.
        </h2>
        <p className="mt-4 font-serif text-[18px] leading-snug">{msg}</p>
        <button ref={btn} type="button" className="btn mt-6" onClick={() => set(null)}>
          Put it back
        </button>
      </div>
    </div>
  );
}
