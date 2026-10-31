import { useEffect, useState, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { siteContent } from '../content/siteContent';
import { ui } from '../content/uiStrings';
import { SECTIONS } from '../lib/sections';
import { DUR, EASE } from '../lib/motion';
import { navigateTo } from '../lib/navigation';
import { requestShutdown } from '../lib/power';
import { scrollToSection } from '../hooks/useScrollProgress';
import { playSound } from '../hooks/useSound';
import { runtime } from '../store/runtime';
import { useStore } from '../store/useStore';
import { ContactForm } from './ContactForm';
import { ContactButtons, EmailCopy, SocialList } from './ContactBlock';
import { CvLink } from './Navbar';
import { ExtrasBox } from './Extras';
import { IconArrowRight, IconArrowUp } from './Icons';

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function SheetHeader({ index, id, as: H = 'h2', title }: { index: number; id: string; as?: 'h1' | 'h2'; title?: string }) {
  const s = SECTIONS[index];
  return (
    <header className="mb-4">
      <div className="mb-3 flex items-end justify-between gap-3 border-b border-ink pb-1.5">
        <p className="caption">
          {ui.progress.of(index + 1, SECTIONS.length)} · {s.caption}
        </p>
        <span aria-hidden className="border border-ink px-1.5 font-mono text-[14px] font-semibold">
          {s.ref}
        </span>
      </div>
      <H id={`${id}-title`} tabIndex={-1} className="font-serif text-[36px] font-normal leading-[1.05] tracking-[-0.025em] outline-none sm:text-[44px]">
        {title ?? s.title}
      </H>
      {!title && <p className="mt-2 text-[18px] leading-[1.6] text-muted">{s.intro}</p>}
    </header>
  );
}

/** Row of a spec table: label · dotted leader · value. */
export function SpecRow({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline py-1.5 font-mono text-[15px]">
      <span className="text-muted">{label}</span>
      <span className="leader" />
      <span className={strong ? 'font-semibold' : ''}>{value}</span>
    </div>
  );
}

/** Small "you can also do this on the board" note. Never the only way to do something. */
const BoardTip = ({ children }: { children: ReactNode }) => <p className="mt-4 border-l-4 border-accent pl-3 text-[16px] leading-[1.5]">{children}</p>;

/**
 * Every section's text sits on a solid paper sheet: on the left on desktop,
 * above the bottom bar on phones (can be folded down to see the board).
 */
function SidePanel({ id, children, tour }: { id: string; children: ReactNode; tour?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <section
      aria-labelledby={`${id}-title`}
      data-tour={tour}
      className="sheet pointer-events-auto fixed inset-x-2 bottom-[116px] flex max-h-[calc(100vh-200px)] flex-col md:bottom-[96px] min-[900px]:inset-x-auto min-[900px]:bottom-auto min-[900px]:left-6 min-[900px]:top-[80px] min-[900px]:max-h-[calc(100vh-184px)] min-[900px]:w-[min(520px,44vw)]"
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex min-h-[44px] w-full shrink-0 items-center justify-center border-b border-ink/30 font-mono text-[15px] min-[900px]:hidden"
        aria-expanded={!collapsed}
      >
        {collapsed ? ui.panel.show : ui.panel.hide}
      </button>
      <div className={`panel-scroll overflow-y-auto overscroll-contain px-5 pb-6 pt-4 min-[900px]:px-7 min-[900px]:pt-5 ${collapsed ? 'hidden' : ''}`}>{children}</div>
    </section>
  );
}

const Body = ({ children }: { children: ReactNode }) => <div className="prose-plain text-[18px] leading-[1.6]">{children}</div>;

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function Hero() {
  const p = siteContent.person;
  return (
    <SidePanel id="hero" tour="hero-panel">
      <SheetHeader index={0} id="hero" as="h1" title={p.name} />
      <p className="font-mono text-[16px] text-muted">{p.title}</p>
      <div className="mt-3">
        <Body>
          <p className="text-[20px]">{p.plainIntro}</p>
        </Body>
      </div>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-y border-ink/40 py-2 text-[17px]">
        <dt className="font-mono text-muted">{ui.hero.based}</dt>
        <dd>{p.location}</dd>
        <dt className="font-mono text-muted">{ui.hero.status}</dt>
        <dd>{p.availability}</dd>
      </dl>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" className="btn btn-solid" onClick={() => (playSound('click'), scrollToSection(1))}>
          {ui.hero.start} <IconArrowRight width={16} height={16} />
        </button>
        <button type="button" className="btn" onClick={() => (playSound('click'), navigateTo('projects'))}>
          {ui.hero.projects}
        </button>
        <button type="button" className="btn" onClick={() => (playSound('click'), navigateTo('contact'))}>
          {ui.hero.contact}
        </button>
        <CvLink className="btn" />
      </div>
      <p className="mt-4 text-[17px] leading-[1.5]">{ui.hero.howTo}</p>
    </SidePanel>
  );
}

/** "Hold to overclock" — a toy, clearly labelled as one, inside a closed box. */
function Overclock() {
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
    <details className="mt-6 border-2 border-ink/60 p-3">
      <summary className="flex min-h-[44px] cursor-pointer items-center font-mono text-[16px] font-medium">{ui.about.extraTitle}</summary>
      <p className="mt-2 text-[17px] leading-[1.5]">{ui.about.extraExplain}</p>
      <SpecRow label={ui.about.temp} value={<span className="tabular-nums">{temp} °C</span>} strong />
      <SpecRow label={ui.about.state} value={hot ? ui.about.states.hot : heat > 0.05 ? ui.about.states.boost : ui.about.states.idle} />
      <div className="mt-2 h-[8px] border border-ink" role="meter" aria-valuemin={38} aria-valuemax={104} aria-valuenow={temp} aria-label={ui.about.temp}>
        <div className={`h-full ${hot ? 'bg-accent' : 'bg-ink'}`} style={{ width: `${Math.max(2, heat * 100)}%` }} />
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
        {ui.about.hold}
      </button>
    </details>
  );
}

/** "Core 3 · Rule" → { core: "Core 3", name: "Rule" } */
const splitFact = (label: string) => {
  const [a, b] = label.split(' · ');
  return b ? { core: a, name: b } : { core: '', name: a };
};

function About() {
  const facts = siteContent.about.facts.slice(0, 8);
  const selected = useStore((s) => s.selectedFact);
  const selectFact = useStore((s) => s.selectFact);
  return (
    <SidePanel id="about">
      <SheetHeader index={1} id="about" />
      <Body>
        {siteContent.about.intro.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Body>
      <h3 className="mt-6 font-serif text-[24px]">{ui.about.factsTitle}</h3>
      <p className="mt-1 text-[16px] leading-[1.5] text-muted">{ui.about.factsNote}</p>
      <ul className="mt-3 space-y-2">
        {facts.map((f, i) => {
          const { core, name } = splitFact(f.label);
          const on = selected === i;
          return (
            <li key={f.label}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => {
                  selectFact(on ? null : i);
                  runtime.ledFlash = 1;
                  playSound('click');
                  useStore.getState().markHint('cpu-core');
                }}
                className={`block w-full border-2 p-3 text-left transition-colors ${on ? 'border-accent-text bg-ink/[0.06]' : 'border-ink/40 hover:border-ink'}`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-[19px] font-semibold">{name}</span>
                  <span className="shrink-0 font-mono text-[14px] text-muted">
                    {core} · {on ? ui.about.shownOnChip : ui.about.showOnChip}
                  </span>
                </span>
                <span className="mt-1 block text-[17px] leading-[1.5]">{f.detail}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Overclock />
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
    <SidePanel id="skills">
      <SheetHeader index={2} id="skills" />
      <Body>
        <p>{ui.skills.legend}</p>
      </Body>
      <p className="label mt-4" id="skill-filter-label">
        {ui.skills.filterLabel}
      </p>
      <div className="mt-1 flex flex-wrap gap-2" role="group" aria-labelledby="skill-filter-label">
        {[{ id: null as string | null, label: ui.skills.all }, ...cats.map((c) => ({ id: c.id as string | null, label: c.label }))].map((c) => (
          <button
            key={c.label}
            type="button"
            aria-pressed={filter === c.id}
            onClick={() => {
              setFilter(c.id);
              playSound('click');
              runtime.ledFlash = 1;
            }}
            className={`btn !px-3 ${filter === c.id ? 'btn-solid' : ''}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-5">
        {cats
          .filter((c) => !filter || c.id === filter)
          .map((c) => (
            <div key={c.id}>
              <h3 className="border-b-2 border-ink pb-1 font-serif text-[22px]">{c.label}</h3>
              <ul>
                {c.skills.map((sk) => (
                  // pointing at a row lights the matching chip on the board (an extra, not needed to read)
                  <li
                    key={sk.name}
                    className={`flex min-h-[40px] items-center border-b border-ink/25 text-[18px] ${hovered?.name === sk.name ? 'bg-ink/[0.06]' : ''}`}
                    onMouseEnter={() => setHovered({ category: c.id, name: sk.name, level: sk.level })}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <span>{sk.name}</span>
                    <span className="leader" />
                    <span aria-hidden className="mr-3 flex gap-[3px]">
                      {Array.from({ length: 5 }, (_, k) => (
                        <i key={k} className={`h-3 w-3 border-2 border-ink ${k < sk.level ? 'bg-ink' : ''}`} />
                      ))}
                    </span>
                    <span className="w-[3.5em] shrink-0 text-right font-mono text-[15px]">{ui.skills.level(sk.level)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
      <BoardTip>{ui.skills.boardTip}</BoardTip>
    </SidePanel>
  );
}

function Projects() {
  const openProject = useStore((s) => s.openProject);
  const projects = siteContent.projects;
  return (
    <SidePanel id="projects">
      <SheetHeader index={3} id="projects" />
      <h3 className="font-serif text-[22px]">{ui.projects.listTitle(projects.length)}</h3>
      <ul className="mt-2 space-y-3">
        {projects.map((p, i) => (
          <li key={p.id} className="border-2 border-ink/40 p-3">
            <p className="font-mono text-[14px] text-muted">
              {p.year} · {p.role}
            </p>
            <h4 className="font-serif text-[22px] leading-tight">{p.title}</h4>
            <p className="mt-1 text-[17px] leading-[1.5]">{p.summary}</p>
            <button type="button" className="btn mt-2" onClick={() => (playSound('click'), openProject(i))} aria-label={ui.projects.openLabel(p.title)}>
              {ui.projects.open} <IconArrowRight width={16} height={16} />
            </button>
          </li>
        ))}
      </ul>
      <BoardTip>{ui.projects.boardTip}</BoardTip>
    </SidePanel>
  );
}

function Experience() {
  const hovered = useStore((s) => s.hoveredPacket);
  const setHovered = useStore((s) => s.setHoveredPacket);
  return (
    <SidePanel id="experience">
      <SheetHeader index={4} id="experience" />
      <ol className="space-y-3">
        {siteContent.experience.map((e, i) => (
          <li
            key={`${e.org}-${i}`}
            className={`border-2 p-3 ${hovered === i ? 'border-accent-text' : 'border-ink/40'}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <p className="font-mono text-[15px] text-muted">
              {e.period} · {e.kind === 'education' ? ui.experience.school : ui.experience.work}
            </p>
            <h3 className="font-serif text-[22px] leading-tight">{e.title}</h3>
            <p className="font-mono text-[15px]">{e.org}</p>
            <p className="mt-2 text-[17px] leading-[1.5]">{e.summary}</p>
            {e.highlights.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-[17px] leading-[1.5]">
                {e.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <BoardTip>{ui.experience.boardTip}</BoardTip>
    </SidePanel>
  );
}

function Contact() {
  const plugged = useStore((s) => s.pluggedIn);
  return (
    <SidePanel id="contact">
      <SheetHeader index={5} id="contact" />
      <Body>
        <p>{ui.contact.lead}</p>
      </Body>
      <div className="mt-4 space-y-5">
        <ContactButtons />
        <EmailCopy />
        <div>
          <h3 className="mb-2 font-serif text-[22px]">{ui.contact.formTitle}</h3>
          <ContactForm compact />
        </div>
        <SocialList plugged={plugged} />
      </div>
      <BoardTip>{ui.contact.plugTip}</BoardTip>
    </SidePanel>
  );
}

function Shutdown() {
  const p = siteContent.person;
  return (
    <SidePanel id="shutdown">
      <SheetHeader index={6} id="shutdown" />
      <Body>
        <p>{ui.end.body}</p>
      </Body>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" className="btn btn-solid" onClick={() => (playSound('click'), scrollToSection(0))}>
          <IconArrowUp width={16} height={16} /> {ui.end.top}
        </button>
        <CvLink className="btn" />
        <button type="button" className="btn" onClick={() => (playSound('click'), navigateTo('contact'))}>
          {ui.end.contact}
        </button>
      </div>
      <div className="mt-6">
        <ExtrasBox />
      </div>
      <button type="button" className="btn-quiet mt-5" onClick={() => requestShutdown()}>
        {ui.end.powerOff}
      </button>
      <footer className="mt-6 flex flex-wrap justify-between gap-2 border-t border-ink/40 pt-3 text-[15px] text-muted">
        <span>
          © {new Date().getFullYear()} {p.name}
        </span>
        <span>{siteContent.footerNote}</span>
      </footer>
    </SidePanel>
  );
}

const PANELS = [Hero, About, Skills, Projects, Experience, Contact, Shutdown];

/**
 * Renders the sheet for the active section. Sheets fade a few pixels
 * sideways when they change, like swapping a page (no motion when reduced).
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
    tl.to(el, { opacity: 0, x: -8, duration: DUR.fast, ease: EASE.in }).add(() => setShown(section));
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
    gsap.fromTo(el, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: DUR.base, ease: EASE.out });
  }, [shown, reduced]);

  const Panel = PANELS[shown] ?? Hero;
  return (
    <main ref={wrap} id="main" className={`pointer-events-none fixed inset-0 z-20 ${booted ? '' : 'invisible'}`}>
      <Panel />
    </main>
  );
}
