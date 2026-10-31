import { useEffect, useId, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ui } from '../content/uiStrings';
import { DUR, EASE } from '../lib/motion';
import { useModal } from '../hooks/useModal';
import { useStore } from '../store/useStore';
import { IconClose } from './Icons';

/**
 * Every panel works the same way: a big labelled "Close" button, tapping
 * outside closes, Esc closes, and only the panel scrolls.
 */
export function Dialog({
  open,
  onClose,
  title,
  caption,
  children,
  width = 'max-w-[640px]',
  role = 'dialog',
  z = 'z-[72]',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  caption?: ReactNode;
  children: ReactNode;
  width?: string;
  role?: 'dialog' | 'alertdialog';
  z?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reduced = useStore((s) => s.reducedMotion);
  useModal(open, box, onClose);

  useEffect(() => {
    if (open && box.current && !reduced) gsap.fromTo(box.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: DUR.base, ease: EASE.out });
  }, [open, reduced]);

  if (!open) return null;
  return (
    <div className={`fixed inset-0 ${z} flex items-end justify-center bg-offblack/60 sm:items-center sm:p-6`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} role={role} aria-modal="true" aria-labelledby={titleId} className={`sheet flex max-h-[92vh] w-full flex-col ${width}`}>
        <div className="flex items-start justify-between gap-4 border-b border-ink px-5 py-3 sm:px-7">
          <div className="min-w-0 pt-1">
            {caption && <p className="caption">{caption}</p>}
            <h2 id={titleId} className="font-serif text-[30px] leading-tight tracking-[-0.02em]">
              {title}
            </h2>
          </div>
          <button type="button" className="btn shrink-0" onClick={onClose}>
            <IconClose width={16} height={16} /> {ui.dialog.close}
          </button>
        </div>
        <div className="panel-scroll overflow-y-auto overscroll-contain px-5 pb-7 pt-5 sm:px-7">{children}</div>
      </div>
    </div>
  );
}

/** "Are you sure?" before anything that can't be undone. */
export function ConfirmDialog() {
  const req = useStore((s) => s.confirm);
  const ask = useStore((s) => s.askConfirm);
  const close = () => ask(null);
  return (
    <Dialog open={!!req} onClose={close} title={req?.title ?? ''} role="alertdialog" width="max-w-[480px]" z="z-[97]">
      <p className="text-[18px] leading-[1.6]">{req?.body}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn btn-solid" onClick={close}>
          {req?.cancelLabel}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            const go = req?.onConfirm;
            close();
            go?.();
          }}
        >
          {req?.confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
