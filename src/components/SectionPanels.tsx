import { useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { siteContent } from '../content/siteContent';
import { SECTIONS } from '../lib/sections';
import { DUR, EASE } from '../lib/motion';
import { copyEmail, navigateTo, openResume, openSocial } from '../lib/navigation';
import { shutdown } from '../lib/power';
import { scrollToSection } from '../hooks/useScrollProgress';
import { playSound } from '../hooks/useSound';
import { runtime } from '../store/runtime';
import { useStore } from '../store/useStore';
import { RevealText } from './RevealText';
import { ContactForm } from './ContactForm';
import { IconArrowRight, IconCopy } from './Icons';

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function SheetHeader({ index, id }: { index: number; id: string }) {
  const s = SECTIONS[index];
  return (
    <header className="mb-5">
      <div className="mb-4 flex items-stretch justify-between border-b border-ink pb-2">
        <p className="caption self-end">{s.fig}</p>
        <span className="border border-ink px-1.5 py-0.5 font-mono text-[11px] font-semibold">{s.ref}</span>
      </div>
      <RevealText as="h2" id={`${id}-title`} tabIndex={-1} text={s.title} className="font-serif text-[40px] font-normal leading-[0.95] tracking-tightest sm:text-[52px]" />
    </header>
  );
}

/** Row of a spec table: label · dotted leader · value. */
export function SpecRow({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline py-1.5 font-mono text-[12px]">
      <span className="uppercase tracking-[0.06em] text-muted">{label}</span>
      <span className="leader" />
      <span className={strong ? 'font-semibold' : ''}>{value}</span>
    </div>
  );
}

/** Desktop: a printed sheet on the left. Mobile: a collapsible bottom sheet. */
function SidePanel({ id, index, children }: { id: string; index: number; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="sheet pointer-events-auto fixed inset-x-2 bottom-2 flex max-h-[50vh] flex-col min-[900px]:inset-x-auto min-[900px]:bottom-auto min-[900px]:left-8 min-[900px]:top-[84px] min-[900px]:max-h-[calc(100vh-150px)] min-[900px]:w-[min(460px,40vw)]"
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex h-7 w-full shrink-0 items-center justify-center border-b border-ink/20 min-[900px]:hidden"
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
      >
        <span className="caption">{collapsed ? 'Show sheet ↑' : 'Fold ↓'}</span>
      </button>
      <div className={`panel-scroll overflow-y-auto overscroll-contain px-5 pb-6 pt-4 min-[900px]:px-7 min-[900px]:pt-6 ${collapsed ? 'max-h-[88px] overflow-hidden' : ''}`}>
        <SheetHeader index={index} id={id} />
        {children}
      </div>
    </section>
  );
}

const Body = ({ children }: { children: ReactNode }) => <div className="space-y-3 font-serif text-[17px] leading-[1.5]">{children}</div>;

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function Hero() {
  const p = siteContent.person;
  const booted = useStore((s) => s.booted);
  const [first, ...rest] = p.name.split(' ');
  return (
    <section aria-labelledby="hero-title" className="pointer-events-none fixed inset-0 flex items-end px-5 pb-8 sm:px-[6vw] sm:pb-[9vh]">
      <div className="w-full max-w-[860px] text-overlay [text-shadow:0_1px_14px_rgb(18_17_16/0.85)]">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-overlay/75">FIG. 00 — The board, from above · see note 1</p>
        <RevealText
          as="h1"
          id="hero-title"
          tabIndex={-1}
          trigger={booted}
          delay={0.15}
          text={rest.length ? [first, rest.join(' ')] : [first]}
          className="font-serif text-[clamp(56px,min(13vw,17vh),168px)] font-normal leading-[0.84] tracking-tightest"
        />
        <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,300px)] sm:items-end">
          <p className="max-w-[34ch] font-serif text-[20px] italic leading-snug text-overlay/90 sm:text-[23px]">{p.tagline}</p>
          {/* engineering-drawing title block */}
          <div className="sheet pointer-events-auto text-[12px] [text-shadow:none]">
            <dl className="grid grid-cols-[72px_1fr] font-mono">
              {[
                ['Drawn', p.name],
                ['Title', p.title.replace('[Placeholder] ', '')],
                ['Based', p.location.replace('[Placeholder] ', '')],
                ['Status', p.availability.replace('[Placeholder] ', '')],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="border-b border-r border-ink/40 px-2 py-1.5 uppercase tracking-[0.06em] text-muted">{k}</dt>
                  <dd className="border-b border-ink/40 px-2 py-1.5">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-2.5">
              <button type="button" className="btn btn-solid" onClick={() => (playSound('click'), scrollToSection(1))}>
                Start at U1 <IconArrowRight width={14} height={14} />
              </button>
              <button type="button" className="btn-quiet" onClick={() => (playSound('click'), navigateTo('projects'))}>
                Work
              </button>
              <button type="button" className="btn-quiet" onClick={() => (playSound('click'), navigateTo('contact'))}>
                Say hi
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TemperatureGauge() {
  const heat = useStore((s) => s.heat);
  const [holding, setHolding] = useState(false);
  const temp = Math.round(38 + heat * 66);
  const holdStart = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    runtime.overclocking = true;
    setHolding(true);
  };
  const holdEnd = () => {
    runtime.overclocking = false;
    setHolding(false);
  };
  const hot = heat > 0.85;
  return (
    <div className="mt-6 border-t border-ink pt-3">
      <p className="caption mb-1">Note 2 — thermal</p>
      <SpecRow label="Package temp" value={<span className="tabular-nums" aria-live="polite">{temp} °C</span>} strong />
      <SpecRow label="State" value={hot ? 'throttling' : heat > 0.05 ? 'boosting' : 'idle'} />
      <div className="mt-2 h-[6px] border border-ink" role="meter" aria-valuemin={38} aria-valuemax={104} aria-valuenow={temp} aria-label="CPU temperature">
        <div className={`h-full transition-[width] duration-100 ${hot ? 'bg-accent' : 'bg-ink'}`} style={{ width: `${Math.max(2, heat * 100)}%` }} />
      </div>
      <button
        type="button"
        data-pressed={holding}
        className="btn mt-4 w-full select-none"
        onPointerDown={holdStart}
        onPointerUp={holdEnd}
        onPointerLeave={holdEnd}
        onPointerCancel={holdEnd}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && holdStart(e)}
        onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && holdEnd()}
        onBlur={holdEnd}
      >
        Hold to overclock
      </button>
    </div>
  );
}

function About() {
  const facts = siteContent.about.facts.slice(0, 8);
  const selected = useStore((s) => s.selectedFact);
  const selectFact = useStore((s) => s.selectFact);
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (detailRef.current && selected !== null) gsap.fromTo(detailRef.current, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: DUR.base, ease: EASE.out });
  }, [selected]);
  return (
    <SidePanel id="about" index={1}>
      <Body>
        {siteContent.about.intro.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Body>
      <p className="caption mt-6 mb-2">Note 1 — eight cores, eight facts. Click one here or on the die.</p>
      <div className="grid grid-cols-4 border-l border-t border-ink">
        {facts.map((f, i) => (
          <button
            key={f.label}
            type="button"
            aria-pressed={selected === i}
            onClick={() => {
              selectFact(selected === i ? null : i);
              runtime.ledFlash = 1;
              playSound('click');
              useStore.getState().markHint('cpu-core');
            }}
            className={`border-b border-r border-ink py-2 font-mono text-[12px] transition-colors ${selected === i ? 'bg-ink text-surface' : 'hover:bg-ink/10'}`}
          >
            C{i}
          </button>
        ))}
      </div>
      <div ref={detailRef} className="min-h-[84px] border-x border-b border-ink p-3" aria-live="polite">
        {selected === null ? (
          <p className="font-mono text-[12px] text-muted">No core selected.</p>
        ) : (
          <>
            <p className="caption !text-ink">{facts[selected].label}</p>
            <p className="mt-1 font-serif text-[16px] leading-snug">{facts[selected].detail}</p>
          </>
        )}
      </div>
      <TemperatureGauge />
    </SidePanel>
  );
}

function Skills() {
  const filter = useStore((s) => s.skillFilter);
  const setFilter = useStore((s) => s.setSkillFilter);
  const hovered = useStore((s) => s.hoveredSkill);
  const setHovered = useStore((s) => s.setHoveredSkill);
  const cats = siteContent.skills;
  return (
    <SidePanel id="skills" index={2}>
      <Body>
        <p>One stick per area, one chip per skill. The marking on each chip says how well I know it, out of five. I rounded down.</p>
      </Body>
      <div className="mt-5 flex flex-wrap border-l border-t border-ink" role="group" aria-label="Filter skills by area">
        {[{ id: null as string | null, label: 'All' }, ...cats.map((c) => ({ id: c.id as string | null, label: c.label }))].map((c) => (
          <button
            key={c.label}
            type="button"
            aria-pressed={filter === c.id}
            onClick={() => {
              setFilter(c.id);
              playSound('click');
              runtime.ledFlash = 1;
            }}
            className={`border-b border-r border-ink px-3 py-1.5 font-mono text-[11.5px] uppercase tracking-[0.06em] transition-colors ${filter === c.id ? 'bg-ink text-surface' : 'hover:bg-ink/10'}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="mt-3 h-5 font-mono text-[12px]" aria-live="polite">
        {hovered ? (
          <>
            <span className="font-semibold">{hovered.name}</span> <span className="text-muted">— level {hovered.level} of 5</span>
          </>
        ) : (
          <span className="text-muted">Hover a chip on the board, or a row below.</span>
        )}
      </p>
      <div className="mt-4 space-y-5">
        {cats.map((c) => (
          <div key={c.id} className={`transition-opacity duration-300 ${filter && filter !== c.id ? 'opacity-35' : ''}`}>
            <p className="caption mb-1 border-b border-ink/40 pb-1">{c.label}</p>
            <ul>
              {c.skills.map((sk) => (
                <li key={sk.name}>
                  <button
                    type="button"
                    className="flex w-full items-center py-1 text-left font-mono text-[12.5px] hover:bg-ink/5"
                    onMouseEnter={() => setHovered({ category: c.id, name: sk.name, level: sk.level })}
                    onFocus={() => setHovered({ category: c.id, name: sk.name, level: sk.level })}
                    onMouseLeave={() => setHovered(null)}
                    onBlur={() => setHovered(null)}
                    aria-label={`${sk.name}, level ${sk.level} of 5`}
                  >
                    <span>{sk.name}</span>
                    <span className="leader" />
                    <span aria-hidden className="flex gap-[3px]">
                      {Array.from({ length: 5 }, (_, k) => (
                        <i key={k} className={`h-2 w-2 border border-ink ${k < sk.level ? 'bg-ink' : ''}`} />
                      ))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SidePanel>
  );
}

function Projects() {
  const openProject = useStore((s) => s.openProject);
  return (
    <SidePanel id="projects" index={3}>
      <Body>
        <p>Six drives, one project each. Pull one out to read its datasheet. The first two are the ones I’d show you first.</p>
      </Body>
      <ul className="mt-5 border-t border-ink">
        {siteContent.projects.map((p, i) => (
          <li key={p.id} className="border-b border-ink/40">
            <button
              type="button"
              onClick={() => (playSound('click'), openProject(i))}
              onMouseEnter={() => playSound('hover')}
              className="group grid w-full grid-cols-[64px_1fr_auto] items-baseline gap-2 py-2.5 text-left"
            >
              <span className="font-mono text-[11px] text-muted">{p.partNo ?? `P0${i + 1}`}</span>
              <span>
                <span className={`block font-serif leading-tight tracking-[-0.01em] group-hover:underline group-hover:decoration-accent group-hover:decoration-2 group-hover:underline-offset-4 ${i < 2 ? 'text-[24px]' : 'text-[19px]'}`}>
                  {p.title}
                </span>
                <span className="mt-0.5 block font-serif text-[14px] leading-snug text-muted">{p.summary}</span>
              </span>
              <span className="font-mono text-[11px] text-muted">{p.year}</span>
            </button>
          </li>
        ))}
      </ul>
    </SidePanel>
  );
}

function Experience() {
  const hovered = useStore((s) => s.hoveredPacket);
  const setHovered = useStore((s) => s.setHoveredPacket);
  return (
    <SidePanel id="experience" index={4}>
      <Body>
        <p>Each carriage on the rail is a job. Hover one to stop it, or use the list.</p>
      </Body>
      <ol className="mt-5 border-t border-ink">
        {siteContent.experience.map((e, i) => (
          <li key={`${e.org}-${i}`} className="border-b border-ink/40">
            <button
              type="button"
              className={`grid w-full grid-cols-[92px_1fr] gap-3 py-3 text-left ${hovered === i ? 'bg-ink/5' : ''}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              onClick={() => setHovered(hovered === i ? null : i)}
              aria-expanded={hovered === i}
            >
              <span className="font-mono text-[11px] leading-5 text-muted">{e.period}</span>
              <span>
                <span className="block font-serif text-[19px] leading-tight tracking-[-0.01em]">{e.title}</span>
                <span className="block font-mono text-[11.5px] text-muted">
                  {e.org}
                  {e.kind === 'education' ? ' · school' : ''}
                </span>
                {hovered === i && <span className="mt-1.5 block font-serif text-[15px] leading-snug">{e.summary}</span>}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </SidePanel>
  );
}

function Contact() {
  const plugged = useStore((s) => s.pluggedIn);
  return (
    <SidePanel id="contact" index={5}>
      <Body>
        <p>Email is best. I answer within two working days, usually faster. Or plug a cable into the board and see where it goes.</p>
      </Body>
      <div className="mt-5 flex items-stretch border border-ink">
        <span className="flex flex-1 items-center truncate px-3 font-mono text-[13px]">{siteContent.contact.email}</span>
        <button type="button" onClick={() => (copyEmail(), playSound('click'))} className="flex items-center gap-1.5 border-l border-ink px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] hover:bg-ink hover:text-surface">
          <IconCopy width={14} height={14} /> Copy
        </button>
      </div>
      <div className="mt-6">
        <p className="caption mb-2">Note 3 — or write it here</p>
        <ContactForm compact />
      </div>
      <p className="caption mt-7 mb-1">Ports</p>
      <ul className="border-t border-ink">
        {siteContent.contact.socials.map((s) => (
          <li key={s.id} className="border-b border-ink/40">
            <a
              href={s.url}
              target={s.url.startsWith('mailto:') ? undefined : '_blank'}
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                playSound('plug');
                openSocial(s);
              }}
              className="flex items-baseline py-2 font-mono text-[12.5px] hover:text-accent-text"
            >
              <span>{s.label}</span>
              <span className="leader" />
              <span className="text-muted">{s.handle}</span>
              {plugged.includes(s.id) && <span className="ml-2 h-2 w-2 self-center bg-accent" aria-label="linked" />}
            </a>
          </li>
        ))}
      </ul>
    </SidePanel>
  );
}

function Shutdown() {
  const p = siteContent.person;
  return (
    <section aria-labelledby="shutdown-title" className="pointer-events-none fixed inset-0 flex items-end px-3 pb-3 sm:px-[6vw] sm:pb-[10vh]">
      <div className="sheet pointer-events-auto w-full max-w-[520px] p-6 sm:p-8">
        <div className="mb-4 flex justify-between border-b border-ink pb-2">
          <p className="caption">FIG. 06 — POWER</p>
          <span className="border border-ink px-1.5 py-0.5 font-mono text-[11px] font-semibold">SW1</span>
        </div>
        <RevealText as="h2" id="shutdown-title" tabIndex={-1} text="That’s the board." className="font-serif text-[44px] leading-none tracking-tightest sm:text-[56px]" />
        <p className="mt-3 max-w-[40ch] font-serif text-[17px] leading-snug">Thanks for looking. You can switch it off and start again, or go back to the top.</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="button" className="btn btn-solid" onClick={() => shutdown()}>
            Power off
          </button>
          <button type="button" className="btn-quiet" onClick={() => (playSound('click'), scrollToSection(0))}>
            Back to top
          </button>
          <button type="button" className="btn-quiet" onClick={() => openResume()}>
            Résumé (PDF)
          </button>
        </div>
        <footer className="mt-7 flex flex-wrap justify-between gap-2 border-t border-ink/40 pt-3 font-mono text-[11px] text-muted">
          <span>
            © {new Date().getFullYear()} {p.name}
          </span>
          <span>{siteContent.footerNote}</span>
        </footer>
      </div>
    </section>
  );
}

const PANELS = [Hero, About, Skills, Projects, Experience, Contact, Shutdown];

/**
 * Renders the sheet for the active section. Sheets slide out/in a few
 * pixels with the same easing as everything else — like swapping a page.
 */
export function SectionPanels() {
  const section = useStore((s) => s.section);
  const booted = useStore((s) => s.booted);
  const [shown, setShown] = useState(section);
  const wrap = useRef<HTMLDivElement>(null);
  const reduced = useStore((s) => s.reducedMotion);

  useEffect(() => {
    if (section === shown) return;
    const el = wrap.current;
    if (!el || reduced) return setShown(section);
    const tl = gsap.timeline();
    tl.to(el, { opacity: 0, x: -10, duration: DUR.fast, ease: EASE.in }).add(() => setShown(section));
    return () => {
      tl.kill();
    };
  }, [section, shown, reduced]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (reduced) {
      gsap.set(el, { opacity: 1, x: 0 });
      return;
    }
    gsap.fromTo(el, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: DUR.base, ease: EASE.out });
  }, [shown, reduced]);

  const Panel = PANELS[shown] ?? Hero;
  return (
    <div ref={wrap} id="main" className={`pointer-events-none fixed inset-0 z-20 ${booted ? '' : 'invisible'}`}>
      <Panel />
    </div>
  );
}
