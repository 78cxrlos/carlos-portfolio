import { useStore } from '../store/useStore';
import { IconClose } from './Icons';

/** Toasts are small printed labels, stuck on a touch crooked. */
export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed right-3 top-[70px] z-[80] flex w-[min(320px,calc(100vw-24px))] flex-col items-end gap-2 sm:right-16" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="sheet pointer-events-auto flex w-full items-start gap-3 px-3 py-2.5 [animation:lift-in_.26s_cubic-bezier(.2,.7,.2,1)_both]"
          style={{ transform: `rotate(${((t.id * 37) % 7) / 7 - 0.5}deg)` }}
        >
          <div className="min-w-0 flex-1">
            {t.tone === 'achievement' ? (
              <span className="stamp mb-1 text-[10px]">QC · passed</span>
            ) : (
              <p className={`font-mono text-[11px] font-semibold uppercase tracking-[0.08em] ${t.tone === 'warn' ? 'text-accent-text' : ''}`}>{t.title}</p>
            )}
            {t.tone === 'achievement' && <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em]">{t.title.replace('QC passed — ', '')}</p>}
            {t.body && <p className="mt-0.5 break-words font-serif text-[14px] leading-snug">{t.body}</p>}
          </div>
          <button type="button" onClick={() => dismiss(t.id)} className="shrink-0 text-muted hover:text-ink" aria-label="Dismiss notification">
            <IconClose width={14} height={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
