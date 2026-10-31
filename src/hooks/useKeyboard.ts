import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { scrollToSection } from './useScrollProgress';
import { siteContent } from '../content/siteContent';
import { playSound } from './useSound';
import { runtime } from '../store/runtime';
import { anyModalOpen } from './useModal';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export function isTypingTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/** Trigger the Konami easter egg (also callable from the terminal). */
export function activateGodMode() {
  const s = useStore.getState();
  s.setGodMode(!s.godMode);
  if (!s.godMode) {
    s.unlock('konami');
    s.toast({ tone: 'success', title: 'Cheat code', body: siteContent.easterEggs.konami });
    runtime.ledFlash = 1;
    runtime.fanBoost = 3;
    playSound('success');
  } else {
    s.toast({ title: 'Cheat code off', body: 'Back to stock clocks.' });
  }
}

/**
 * Global keyboard shortcuts:
 *  Ctrl/Cmd+K  command palette      `  terminal
 *  ↑/↓ ←/→ PgUp/PgDn  previous/next section
 *  ?  help   Esc  close the top-most overlay   Konami code  easter egg
 * Panels that use useModal handle their own Esc/Tab first (capture phase).
 */
export function useKeyboard() {
  useEffect(() => {
    let konamiIdx = 0;

    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState();
      const typing = isTypingTarget(e.target);

      // Konami tracking (ignore while typing).
      if (!typing) {
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        konamiIdx = key === KONAMI[konamiIdx] ? konamiIdx + 1 : key === KONAMI[0] ? 1 : 0;
        if (konamiIdx === KONAMI.length) {
          konamiIdx = 0;
          activateGodMode();
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        s.setPalette(!s.paletteOpen);
        playSound('click');
        return;
      }
      if (e.key === '`' && !(typing && !s.terminalOpen)) {
        e.preventDefault();
        s.setTerminal(!s.terminalOpen);
        playSound('click');
        return;
      }
      if (e.key === 'Escape') {
        if (s.paletteOpen) return s.setPalette(false);
        if (s.terminalOpen) return s.setTerminal(false);
        if (s.secretMessage) return s.setSecretMessage(null);
        if (s.activeProject !== null) return; // ProjectPanel animates its own close
        if (s.achievementsOpen) return s.setAchievementsOpen(false);
        return;
      }

      const overlayOpen = s.paletteOpen || s.terminalOpen || s.activeProject !== null || !!s.secretMessage || s.welcomeOpen || anyModalOpen();
      if (typing || overlayOpen || e.altKey || e.metaKey || e.ctrlKey) return;
      if (e.key === '?') {
        e.preventDefault();
        s.setHelp(true);
        return;
      }
      if (!s.booted || s.simpleView || !s.webglOk) return;
      // Focus inside a text panel: let the arrow keys scroll the panel as usual.
      if ((e.target as HTMLElement | null)?.closest?.('.panel-scroll')) return;
      if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        scrollToSection(s.section + 1);
      } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        scrollToSection(s.section - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToSection(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollToSection(99);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
