import { useEffect, useRef, type RefObject } from 'react';

let locks = 0;
/** While any panel is open the page behind it does not scroll; only the panel does. */
export function lockPageScroll() {
  locks++;
  document.documentElement.classList.add('modal-open');
  return () => {
    locks = Math.max(0, locks - 1);
    if (!locks) document.documentElement.classList.remove('modal-open');
  };
}

/** Open dialogs, innermost last: only the top one reacts to keys. */
const stack: object[] = [];
export const anyModalOpen = () => stack.length > 0;

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([type="hidden"]):not([tabindex="-1"]), textarea, select, [tabindex]:not([tabindex="-1"])';

/**
 * Shared behaviour for every panel/dialog: Esc closes, Tab stays inside,
 * focus moves in on open and goes back where it was on close, and page
 * scrolling is locked so wheel/touch scrolling applies to the panel only.
 */
export function useModal(open: boolean, box: RefObject<HTMLElement>, onClose: () => void, initialFocus?: RefObject<HTMLElement>) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const restore = document.activeElement as HTMLElement | null;
    const unlock = lockPageScroll();
    const me = {};
    stack.push(me);
    requestAnimationFrame(() => (initialFocus?.current ?? box.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== me) return;
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        closeRef.current();
      } else if (e.key === 'Tab' && box.current) {
        const f = Array.from(box.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
        else if (!box.current.contains(document.activeElement)) (e.preventDefault(), first.focus());
      }
    };
    // capture: runs before the global shortcut handler
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      stack.splice(stack.indexOf(me), 1);
      unlock();
      restore?.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
