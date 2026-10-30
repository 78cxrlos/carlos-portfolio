import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { siteContent } from '../content/siteContent';
import { SECTIONS } from '../lib/sections';
import { THEMES } from '../lib/themes';
import { DUR, EASE } from '../lib/motion';
import { navigateTo, openResume } from '../lib/navigation';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { IconClose, IconMenu, IconMute, IconSound, IconTerminal } from './Icons';

const LINKS = SECTIONS.filter((s) => !['hero', 'shutdown'].includes(s.id));

/** A solid labelled strip, like the edge of a datasheet. */
export function Navbar() {
  const theme = useStore((s) => s.theme);
  const cycleTheme = useStore((s) => s.cycleTheme);
  const sound = useStore((s) => s.sound);
  const setSound = useStore((s) => s.setSound);
  const simpleView = useStore((s) => s.simpleView);
  const webglOk = useStore((s) => s.webglOk);
  const setSimpleView = useStore((s) => s.setSimpleView);
  const setTerminal = useStore((s) => s.setTerminal);
  const setPalette = useStore((s) => s.setPalette);
  const section = useStore((s) => s.section);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    if (menuOpen && menuRef.current) gsap.fromTo(menuRef.current, { y: -6, opacity: 0 }, { y: 0, opacity: 1, duration: DUR.fast, ease: EASE.out });
  }, [menuOpen]);

  const go = (id: string) => {
    playSound('click');
    setMenuOpen(false);
    navigateTo(id);
  };
  const activeId = simpleView ? null : SECTIONS[section]?.id;
  const next = theme === 'bench' ? 'night' : 'bench';

  const toggles = (
    <>
      <button
        type="button"
        onClick={() => (cycleTheme(), playSound('click'))}
        className="flex h-9 items-center gap-2 whitespace-nowrap border border-ink/30 px-2.5 font-mono text-[11px] uppercase tracking-[0.08em] hover:border-ink"
        aria-label={`Theme: ${THEMES[theme].label}. Switch to ${THEMES[next].label}`}
      >
        <span aria-hidden className="relative h-3 w-6 border border-ink">
          <span className={`absolute top-0 h-full w-1/2 bg-ink transition-transform duration-200 ${theme === 'night' ? 'translate-x-full' : ''}`} />
        </span>
        <span className="hidden 2xl:inline">{THEMES[theme].label}</span>
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-pressed={sound}
        onClick={() => {
          setSound(!sound);
          window.setTimeout(() => playSound('click'), 30);
        }}
        aria-label={sound ? 'Turn sound off' : 'Turn sound on'}
        title={sound ? 'Sound on' : 'Sound off'}
      >
        {sound ? <IconSound /> : <IconMute />}
      </button>
      <button type="button" className="icon-btn" onClick={() => (setTerminal(true), playSound('click'))} aria-label="Open terminal (backtick key)" title="Terminal ( ` )">
        <IconTerminal />
      </button>
      {webglOk && (
        <button
          type="button"
          className="flex h-9 items-center border border-ink/30 px-2.5 font-mono text-[11px] uppercase tracking-[0.08em] hover:border-ink"
          aria-pressed={simpleView}
          onClick={() => {
            setSimpleView(!simpleView);
            playSound('click');
            window.scrollTo(0, 0);
          }}
          aria-label={simpleView ? 'Switch to the 3D board' : 'Switch to the plain page'}
        >
          {simpleView ? '3D' : 'Plain'}
        </button>
      )}
    </>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <nav aria-label="Main" className="flex h-14 items-stretch border-b border-ink bg-surface text-ink">
        <button type="button" onClick={() => go('hero')} className="flex items-center gap-3 border-r border-ink px-4" aria-label={`${siteContent.person.name} — top of page`}>
          <span className="grid h-7 w-7 place-items-center bg-ink font-mono text-[11px] font-semibold text-surface">{siteContent.person.initials}</span>
          <span className="hidden text-left leading-none sm:block">
            <span className="block font-serif text-[17px] tracking-[-0.01em]">{siteContent.person.name}</span>
            <span className="caption mt-0.5 block whitespace-nowrap !text-[9.5px]">Rev 2.3 · sheet {section + 1} of {SECTIONS.length}</span>
          </span>
        </button>

        <ul className="hidden items-stretch lg:flex">
          {LINKS.map((l) => (
            <li key={l.id} className="flex">
              <button
                type="button"
                onClick={() => go(l.id)}
                aria-current={activeId === l.id ? 'true' : undefined}
                className={`relative flex items-center gap-2 border-r border-ink/15 px-4 font-mono text-[11.5px] uppercase tracking-[0.06em] hover:bg-ink/5 ${activeId === l.id ? '' : 'text-ink/75'}`}
              >
                <span className="text-muted">{l.ref}</span>
                {l.label}
                {activeId === l.id && <span aria-hidden className="absolute inset-x-3 bottom-0 h-[3px] bg-accent" />}
              </button>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1.5 px-3">
          <button
            type="button"
            onClick={() => (setPalette(true), playSound('click'))}
            className="hidden h-9 items-center gap-2 whitespace-nowrap border border-ink/30 px-2.5 font-mono text-[11px] text-muted hover:border-ink hover:text-ink md:inline-flex"
            aria-label="Open command palette"
          >
            Jump to… <kbd className="text-ink">{isMac ? '⌘' : 'Ctrl'} K</kbd>
          </button>
          <div className="hidden items-center gap-1.5 sm:flex">{toggles}</div>
          <button type="button" className="btn btn-solid ml-1 hidden !min-h-[34px] sm:inline-flex" onClick={() => (openResume(), playSound('click'))}>
            Résumé
          </button>
          <button type="button" className="icon-btn sm:hidden" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label="Menu">
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" ref={menuRef} className="sheet mx-2 mt-2 p-4 sm:hidden">
          <ul className="divide-y divide-ink/15 border-y border-ink/15">
            {LINKS.map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => go(l.id)} className="flex w-full items-baseline gap-3 py-3 text-left">
                  <span className="caption w-10">{l.ref}</span>
                  <span className="font-serif text-xl">{l.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">{toggles}</div>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-solid flex-1" onClick={() => openResume()}>
              Résumé
            </button>
            <button type="button" className="btn flex-1" onClick={() => (setMenuOpen(false), setPalette(true))}>
              Jump to…
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
