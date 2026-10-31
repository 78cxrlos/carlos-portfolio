import { useRef, useState, type ReactNode } from 'react';
import { siteContent } from '../content/siteContent';
import { ui } from '../content/uiStrings';
import { SECTIONS } from '../lib/sections';
import { goHome, navigateTo, resumeHref } from '../lib/navigation';
import { ACHIEVEMENTS, useStore } from '../store/useStore';
import { useModal } from '../hooks/useModal';
import { playSound } from '../hooks/useSound';
import { AccessibilityControls, ThemeSoundControls } from './Settings';
import { IconAccessibility, IconClose, IconDownload, IconHelp, IconMenu } from './Icons';

/** The six main destinations: plain label first, hardware word as a small caption. */
const LINKS = SECTIONS.filter((s) => s.id !== 'shutdown');

/** Switch between the simple page and the 3D version (remembers the choice). */
export function ViewSwitch({ long = false, className = 'btn' }: { long?: boolean; className?: string }) {
  const simpleView = useStore((s) => s.simpleView);
  const webglOk = useStore((s) => s.webglOk);
  const setSimpleView = useStore((s) => s.setSimpleView);
  if (!webglOk) return null;
  const toSimple = !simpleView;
  return (
    <button
      type="button"
      data-tour="view-switch"
      className={className}
      onClick={() => {
        setSimpleView(toSimple);
        playSound('click');
        window.scrollTo(0, 0);
      }}
      aria-label={toSimple ? ui.nav.toSimpleLong : ui.nav.to3dLong}
    >
      {long ? (
        toSimple ? ui.nav.toSimpleLong : ui.nav.to3dLong
      ) : (
        <>
          <span className="sm:hidden">{toSimple ? ui.nav.toSimpleShort : ui.nav.to3dShort}</span>
          <span className="hidden sm:inline">{toSimple ? ui.nav.toSimple : ui.nav.to3d}</span>
        </>
      )}
    </button>
  );
}

/** "Download my CV" as a real link, so it works with any browser setting. */
export function CvLink({ className = 'btn btn-solid' }: { className?: string }) {
  return (
    <a className={className} href={resumeHref()} target="_blank" rel="noopener noreferrer" download onClick={() => playSound('click')}>
      <IconDownload width={16} height={16} /> {ui.nav.cv}
    </a>
  );
}

function MenuHeading({ children }: { children: ReactNode }) {
  return <h3 className="caption mb-2 mt-6 border-b border-ink/40 pb-1 first:mt-0">{children}</h3>;
}

/** Drop-down panel used by both "Accessibility" and "Menu". */
function Popover({ open, onClose, label, children, wide }: { open: boolean; onClose: () => void; label: string; children: ReactNode; wide?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  useModal(open, box, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 top-16 z-40 bg-offblack/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`sheet panel-scroll absolute inset-x-0 top-0 max-h-[calc(100vh-64px)] overflow-y-auto overscroll-contain p-5 sm:left-auto sm:right-3 sm:top-2 sm:max-h-[calc(100vh-88px)] ${wide ? 'sm:w-[460px]' : 'sm:w-[400px]'}`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-serif text-[28px] leading-none">{label}</h2>
          <button type="button" className="btn" onClick={onClose}>
            <IconClose width={16} height={16} /> {ui.dialog.close}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Navbar() {
  const simpleView = useStore((s) => s.simpleView);
  const section = useStore((s) => s.section);
  const menuOpen = useStore((s) => s.menuOpen);
  const setMenu = useStore((s) => s.setMenu);
  const setHelp = useStore((s) => s.setHelp);
  const setTour = useStore((s) => s.setTour);
  const setTerminal = useStore((s) => s.setTerminal);
  const setPalette = useStore((s) => s.setPalette);
  const setAchievementsOpen = useStore((s) => s.setAchievementsOpen);
  const achieved = useStore((s) => s.achievements.length);
  const [a11yOpen, setA11yOpen] = useState(false);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const activeId = SECTIONS[section]?.id;

  const go = (id: string) => {
    playSound('click');
    setMenu(false);
    if (id === 'hero') goHome();
    else navigateTo(id);
  };
  const extra = (fn: () => void) => () => {
    setMenu(false);
    playSound('click');
    window.setTimeout(fn, 10);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav aria-label={ui.nav.mainLabel} className="flex h-16 items-stretch border-b-2 border-ink bg-surface text-ink">
        <button type="button" onClick={() => go('hero')} className="flex shrink-0 items-center gap-3 border-r border-ink px-3 sm:px-4" aria-label={ui.nav.homeLabel(siteContent.person.name)}>
          <span aria-hidden className="grid h-9 w-9 place-items-center bg-ink font-mono text-[14px] font-semibold text-surface">
            {siteContent.person.initials}
          </span>
          <span className="text-left leading-tight xl:hidden min-[1600px]:block">
            <span className="hidden font-serif text-[18px] tracking-[-0.01em] sm:block">{siteContent.person.name}</span>
            <span className="block font-mono text-[14px] text-muted sm:hidden">{ui.nav.home}</span>
          </span>
        </button>

        <ul className="hidden items-stretch xl:flex">
          {LINKS.map((l) => {
            const active = activeId === l.id;
            return (
              <li key={l.id} className="flex">
                <button
                  type="button"
                  data-tour={l.id === 'projects' ? 'projects-link' : undefined}
                  onClick={() => go(l.id)}
                  aria-current={active ? 'location' : undefined}
                  className={`relative flex min-w-[44px] flex-col items-start justify-center border-r border-ink/20 px-3 text-left hover:bg-ink/5 xl:px-4 ${active ? 'bg-ink/[0.07]' : ''}`}
                >
                  <span className="font-serif text-[18px] leading-tight">{l.label}</span>
                  <span className="font-mono text-[14px] leading-tight text-muted">{l.caption}</span>
                  {active && <span aria-hidden className="absolute inset-x-2 bottom-0 h-[4px] bg-accent" />}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-1.5 px-2 sm:gap-2 sm:px-3">
          <ViewSwitch className="btn !px-2.5 max-[359px]:hidden sm:!px-3" />
          <CvLink className="btn btn-solid hidden min-[1760px]:inline-flex" />
          <button type="button" className="btn hidden !px-3 md:inline-flex" aria-expanded={a11yOpen} onClick={() => (setMenu(false), setA11yOpen(true))}>
            <IconAccessibility width={18} height={18} /> {ui.nav.accessibility}
          </button>
          <button type="button" className="btn !px-3" onClick={() => (setA11yOpen(false), setHelp(true), playSound('click'))} aria-label={ui.nav.helpLabel}>
            <IconHelp width={18} height={18} className="hidden sm:block" /> {ui.nav.help}
          </button>
          <button type="button" data-tour="menu" className="btn !px-3" onClick={() => (setA11yOpen(false), setMenu(true), playSound('click'))} aria-expanded={menuOpen} aria-controls="site-menu">
            <IconMenu width={18} height={18} className="hidden sm:block" /> {ui.nav.menu}
          </button>
        </div>
      </nav>

      <Popover open={a11yOpen} onClose={() => setA11yOpen(false)} label={ui.a11y.title}>
        <AccessibilityControls />
        <MenuHeading>{ui.nav.themeHeading}</MenuHeading>
        <ThemeSoundControls />
      </Popover>

      <Popover open={menuOpen} onClose={() => setMenu(false)} label={ui.nav.menu} wide>
        <div id="site-menu">
          <MenuHeading>{ui.nav.sectionsHeading}</MenuHeading>
          <ul className="grid grid-cols-2 gap-2">
            {SECTIONS.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => go(l.id)}
                  aria-current={activeId === l.id && !simpleView ? 'location' : undefined}
                  className={`flex min-h-[56px] w-full flex-col items-start justify-center border border-ink px-3 py-1.5 text-left hover:bg-ink/5 ${activeId === l.id ? 'bg-ink/10' : ''}`}
                >
                  <span className="font-serif text-[19px] leading-tight">{l.label}</span>
                  <span className="font-mono text-[14px] leading-tight text-muted">{l.caption}</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn mt-2 w-full" onClick={() => go('projects')}>
            {ui.nav.allProjects}
          </button>

          <MenuHeading>{ui.nav.viewHeading}</MenuHeading>
          <div className="flex flex-col gap-2">
            <ViewSwitch long className="btn w-full" />
            <CvLink className="btn btn-solid w-full" />
            <button type="button" className="btn w-full" onClick={extra(() => setTour(true))}>
              {ui.nav.tour}
            </button>
          </div>

          <MenuHeading>{ui.a11y.title}</MenuHeading>
          <AccessibilityControls />
          <ThemeSoundControls />

          <MenuHeading>{ui.nav.extrasHeading}</MenuHeading>
          <ul className="divide-y divide-ink/20 border-y border-ink/20">
            {[
              { label: ui.nav.search, hint: ui.nav.searchHint(isMac ? '⌘' : 'Ctrl'), run: () => setPalette(true) },
              { label: ui.nav.terminal, hint: ui.nav.terminalHint, run: () => setTerminal(true) },
              { label: ui.nav.achievements(achieved, Object.keys(ACHIEVEMENTS).length), hint: ui.nav.achievementsHint, run: () => setAchievementsOpen(true) },
            ].map((x) => (
              <li key={x.label}>
                <button type="button" onClick={extra(x.run)} className="flex min-h-[56px] w-full flex-col items-start justify-center py-1.5 text-left hover:bg-ink/5">
                  <span className="font-serif text-[18px] leading-tight underline decoration-ink/40 underline-offset-4">{x.label}</span>
                  <span className="text-[15px] leading-tight text-muted">{x.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Popover>
    </header>
  );
}
