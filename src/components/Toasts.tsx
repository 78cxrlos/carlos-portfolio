import { ui } from '../content/uiStrings';
import { useStore } from '../store/useStore';
import { IconClose } from './Icons';

/** Short messages, printed on a paper label. Each one can be closed. */
export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed right-3 top-[76px] z-[99] flex w-[min(380px,calc(100vw-24px))] flex-col items-end gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="sheet pointer-events-auto flex w-full items-start gap-2 py-2 pl-4 pr-1 [animation:lift-in_.26s_cubic-bezier(.2,.7,.2,1)_both]">
          <div className="min-w-0 flex-1 py-1">
            {t.tone === 'achievement' && <span className="stamp mb-1 text-[14px]">{ui.extras.toast}</span>}
            <p className={`font-serif text-[18px] font-semibold leading-snug ${t.tone === 'warn' ? 'text-accent-text' : ''}`}>{t.title}</p>
            {t.body && <p className="mt-0.5 break-words text-[16px] leading-snug">{t.body}</p>}
          </div>
          <button type="button" onClick={() => dismiss(t.id)} className="icon-btn shrink-0" aria-label={ui.toast.dismiss}>
            <IconClose width={16} height={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
