import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { siteContent } from '../content/siteContent';
import { ui } from '../content/uiStrings';
import { SECTIONS, sectionIndexById } from '../lib/sections';
import { goHome, navigateTo } from '../lib/navigation';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { ContactForm } from './ContactForm';
import { ContactButtons, EmailCopy, SocialList } from './ContactBlock';
import { CvLink, ViewSwitch } from './Navbar';
import { ExtrasBox } from './Extras';
import { RevealText } from './RevealText';
import { IconArrowRight, IconArrowUp } from './Icons';

/**
 * SIMPLE VIEW — the same content as the 3D board, as one clean, single-column
 * page with large text. No three.js (the 3D code is never downloaded here),
 * semantic landmarks and headings for screen readers, normal scrolling.
 *
 * Small effects keep it lively without hiding anything: things ease in as
 * they scroll into view, numbers count up, skill bars fill, the timeline
 * lights up and signals run along a little circuit in the header. All of it
 * is CSS keyed to html[data-motion='full'] (see index.css), so with reduced
 * motion the page is simply static. Content is always in the page.
 */

/** Stagger helper for [data-reveal] items. */
const delay = (i: number): CSSProperties => ({ ['--d' as string]: `${Math.min(i, 8) * 70}ms` });

/** Marks each [data-reveal] element with data-in the first time it scrolls into view. */
function useReveal(deps: unknown[]) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('#main [data-reveal]:not([data-in])'));
    if (!('IntersectionObserver' in window)) return els.forEach((e) => e.setAttribute('data-in', ''));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.setAttribute('data-in', '');
          io.unobserve(e.target);
        }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function Section({ id, children }: { id: string; children: ReactNode }) {
  const s = SECTIONS[sectionIndexById(id)];
  return (
    <section id={`sv-${id}`} aria-labelledby={`sv-${id}-title`} className="scroll-mt-24 border-t-2 border-ink py-12">
      <header data-reveal>
        <p className="caption">{s.caption}</p>
        <h2 id={`sv-${id}-title`} tabIndex={-1} className="mt-1 font-serif text-[40px] leading-[1.05] tracking-[-0.025em] outline-none sm:text-[52px]">
          {s.title}
        </h2>
        <span aria-hidden className="sv-rule" />
        <p className="mt-3 text-[20px] leading-[1.6] text-muted">{s.intro}</p>
      </header>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Thin bar under the menu showing how far down the page you are. */
function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  return <div ref={bar} aria-hidden className="fixed inset-x-0 top-16 z-40 h-1 origin-left bg-accent" style={{ transform: 'scaleX(0)' }} />;
}

/** Decorative circuit in the header, a nod to the 3D board: signals run along copper traces. */
const TRACES = ['M400 40 H300 L270 70 H190', 'M400 110 H330 L300 140 V200 L270 230 H220', 'M400 170 H360 L340 190 V260 H260', 'M400 250 H380 L350 280 H300', 'M330 0 V30 L300 60 V100'];
function HeroCircuit() {
  return (
    <svg aria-hidden viewBox="0 0 400 300" preserveAspectRatio="xMaxYMid slice" className="pointer-events-none absolute right-0 top-0 h-full w-[75%] text-ink sm:w-[60%] [mask-image:linear-gradient(to_right,transparent,black_45%)]">
      <g fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="3" strokeLinejoin="round">
        {TRACES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g fill="none" stroke="rgb(var(--accent))" strokeWidth="4" strokeLinecap="round">
        {TRACES.map((d, i) => (
          <path key={d} d={d} className="sv-pulse" style={{ ['--t' as string]: `${3 + i * 0.7}s`, ['--w' as string]: `${i * 0.9}s` }} />
        ))}
      </g>
      <g fill="rgb(var(--surface))" stroke="currentColor" strokeOpacity="0.4" strokeWidth="3">
        {[[190, 70], [220, 230], [260, 260], [300, 280], [300, 100]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="7" />
        ))}
      </g>
      <circle cx="372" cy="208" r="6" fill="rgb(var(--accent))" className="sv-led" />
    </svg>
  );
}

/** A number that counts up once it scrolls into view (no counting with reduced motion). */
function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(to);
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (document.documentElement.dataset.motion !== 'full' || !el.current || !('IntersectionObserver' in window)) return;
    setN(0);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - start) / 1100);
        setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el.current);
    return () => (io.disconnect(), cancelAnimationFrame(raf));
  }, [to]);
  return (
    <span ref={el} className="tabular-nums">
      {n}
    </span>
  );
}

/** Three quick numbers under the header; each one jumps to its section. */
function Stats() {
  const skills = siteContent.skills.reduce((t, c) => t + c.skills.length, 0);
  const items = [
    { n: siteContent.projects.length, label: ui.simple.stats.projects, id: 'projects' },
    { n: skills, label: ui.simple.stats.skills, id: 'skills' },
    { n: siteContent.experience.length, label: ui.simple.stats.places, id: 'experience' },
  ];
  return (
    <ul className="relative mt-8 grid grid-cols-3 gap-2 sm:gap-3">
      {items.map((it, i) => (
        <li key={it.id} data-reveal style={delay(i + 2)}>
          <button
            type="button"
            className="sv-card flex h-full w-full flex-col items-start border-2 border-ink bg-surface p-3 text-left hover:bg-ink/[0.04] sm:p-4"
            onClick={() => (playSound('click'), navigateTo(it.id))}
            aria-label={ui.simple.stats.go(it.n, it.label, SECTIONS[sectionIndexById(it.id)].title)}
          >
            <span className="font-serif text-[40px] leading-none sm:text-[52px]">
              <CountUp to={it.n} />
            </span>
            <span className="mt-1 font-mono text-[14px] leading-tight sm:text-[15px]">{it.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Keeps the menu's "you are here" mark in sync with what is on screen. */
function useActiveSection() {
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(`sv-${s.id}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) useStore.getState().setSection(sectionIndexById(vis.target.id.replace('sv-', '')));
      },
      { rootMargin: '-80px 0px -55% 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 400);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  if (!show) return null;
  return (
    <button type="button" className="btn btn-solid fixed bottom-4 right-4 z-30" onClick={() => (playSound('click'), goHome())}>
      <IconArrowUp width={16} height={16} /> {ui.footer.top}
    </button>
  );
}

export function SimpleView() {
  const p = siteContent.person;
  const openProject = useStore((s) => s.openProject);
  const [filter, setFilter] = useState<string | null>(null);
  useActiveSection();
  useReveal([filter]);

  useEffect(() => {
    document.title = siteContent.meta.title;
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-surface text-ink">
      <ReadingProgress />
      <main id="main" className="mx-auto max-w-[760px] px-4 pb-24 pt-24 sm:px-6">
        {/* HOME */}
        <section id="sv-hero" aria-labelledby="sv-hero-title" className="relative pb-12 pt-6">
          <div className="absolute inset-y-0 -right-4 left-1/3 sm:-right-[min(30vw,320px)]">
            <HeroCircuit />
          </div>
          <div className="relative">
            <p className="caption" data-reveal>
              {p.title}
            </p>
            <RevealText as="h1" id="sv-hero-title" tabIndex={-1} text={p.name.split(' ')} delay={0.1} className="mt-2 font-serif text-[clamp(48px,11vw,88px)] leading-[0.95] tracking-tightest outline-none" />
            <p className="mt-5 max-w-[30ch] font-serif text-[24px] leading-[1.5] [text-shadow:0_0_12px_rgb(var(--surface)),0_0_4px_rgb(var(--surface))]" data-reveal style={delay(2)}>
              {p.plainIntro}
            </p>
          </div>
          <Stats />
          <dl className="relative mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 border-y border-ink/40 py-3 text-[19px]">
            <dt className="font-mono text-muted">{ui.hero.based}</dt>
            <dd>{p.location}</dd>
            <dt className="font-mono text-muted">{ui.hero.status}</dt>
            <dd>{p.availability}</dd>
          </dl>
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap" data-tour="sv-buttons">
            <button type="button" className="btn btn-solid btn-big" onClick={() => (playSound('click'), navigateTo('contact'))}>
              {ui.hero.contact}
            </button>
            <button type="button" className="btn btn-big" onClick={() => (playSound('click'), navigateTo('projects'))}>
              {ui.hero.projects}
            </button>
            <CvLink className="btn btn-big" />
          </div>
        </section>

        <Section id="about">
          <div className="prose-plain text-[20px] leading-[1.6]">
            {siteContent.about.intro.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>
          <h3 className="mt-8 font-serif text-[28px]">{ui.about.factsTitle}</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {siteContent.about.facts.map((f, i) => (
              <div key={f.label} data-reveal style={delay(i % 2)} className="sv-card border-2 border-ink/50 border-l-[6px] border-l-accent bg-surface p-4">
                <dt className="font-serif text-[21px] font-semibold">{f.label.split(' · ').pop()}</dt>
                <dd className="mt-1 text-[18px] leading-[1.55]">{f.detail}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="skills">
          <p className="text-[19px] leading-[1.6]">{ui.skills.legend}</p>
          <p className="label mt-4" id="sv-filter-label">
            {ui.skills.filterLabel}
          </p>
          <div className="mt-1 flex flex-wrap gap-2" role="group" aria-labelledby="sv-filter-label">
            {[{ id: null as string | null, label: ui.skills.all }, ...siteContent.skills.map((c) => ({ id: c.id as string | null, label: c.label }))].map((c) => (
              <button key={c.label} type="button" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)} className={`btn !px-4 ${filter === c.id ? 'btn-solid' : ''}`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-8">
            {siteContent.skills
              .filter((c) => !filter || c.id === filter)
              .map((c) => (
                <table key={c.id} data-reveal className="w-full border-collapse text-[19px]">
                  <caption className="border-b-2 border-ink pb-1 text-left font-serif text-[24px]">{c.label}</caption>
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">{ui.skills.colSkill}</th>
                      <th scope="col">{ui.skills.colLevel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.skills.map((s, row) => (
                      <tr key={s.name} className="border-b border-ink/30" style={delay(row)}>
                        <th scope="row" className="py-2 text-left font-normal">
                          {s.name}
                        </th>
                        <td className="py-2 text-right">
                          <span aria-hidden className="mr-3 inline-flex gap-[3px] align-middle" style={delay(row)}>
                            {Array.from({ length: 5 }, (_, k) => (
                              <span key={k} className="sv-seg" style={{ ['--k' as string]: k }}>
                                {k < s.level && <i />}
                              </span>
                            ))}
                          </span>
                          <span className="font-mono text-[16px]">{ui.skills.level(s.level)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
          </div>
        </Section>

        <Section id="projects">
          <h3 className="font-serif text-[26px]" data-tour="sv-projects">
            {ui.projects.listTitle(siteContent.projects.length)}
          </h3>
          <ul className="mt-4 space-y-5">
            {siteContent.projects.map((pr, i) => (
              <li key={pr.id} data-reveal style={delay(1)}>
                <article className="sheet sv-card relative overflow-hidden p-5 pl-7" aria-labelledby={`sv-p-${pr.id}`}>
                  <span aria-hidden className="absolute inset-y-0 left-0 w-3 border-r border-ink/40" style={{ background: pr.color }} />
                  <span aria-hidden className="absolute right-4 top-2 font-serif text-[56px] leading-none text-ink/15">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="font-mono text-[15px] text-muted">
                    {pr.year} · {pr.role}
                    {pr.status ? ` · ${pr.status}` : ''}
                  </p>
                  <h4 id={`sv-p-${pr.id}`} className="mt-1 font-serif text-[30px] leading-tight">
                    {pr.title}
                  </h4>
                  <p className="mt-2 text-[19px] leading-[1.6]">{pr.summary}</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={ui.project.tools}>
                    {pr.tech.map((t) => (
                      <li key={t} className="border border-ink/50 px-2 py-0.5 font-mono text-[14px]">
                        {t}
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="btn btn-solid mt-4" onClick={() => (playSound('click'), openProject(i))} aria-label={ui.projects.openLabel(pr.title)}>
                    {ui.projects.open} <IconArrowRight width={16} height={16} />
                  </button>
                </article>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="experience">
          <ol className="relative ml-2 space-y-8 border-l-4 border-ink/25 pl-7">
            {siteContent.experience.map((e, i) => (
              <li key={`${e.org}-${i}`} data-reveal className="relative">
                <span aria-hidden className="sv-dot !-left-[41px]" />
                <p className="font-mono text-[16px] text-muted">
                  <time>{e.period}</time> · {e.kind === 'education' ? ui.experience.school : ui.experience.work}
                  {e.location ? ` · ${e.location}` : ''}
                </p>
                <h3 className="font-serif text-[26px] leading-tight">{e.title}</h3>
                <p className="font-mono text-[16px]">{e.org}</p>
                <p className="mt-2 text-[19px] leading-[1.6]">{e.summary}</p>
                {e.highlights.length > 0 && (
                  <ul className="mt-1 list-disc pl-6 text-[19px] leading-[1.6]">
                    {e.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </Section>

        <Section id="contact">
          <p className="text-[20px] leading-[1.6]">{ui.contact.lead}</p>
          <div className="mt-5 space-y-6">
            <ContactButtons />
            <EmailCopy />
            <div>
              <h3 className="mb-3 font-serif text-[26px]">{ui.contact.formTitle}</h3>
              <ContactForm />
            </div>
            <SocialList />
          </div>
        </Section>

        <aside className="sheet mt-4 p-5" aria-label={ui.nav.to3dLong}>
          <p className="text-[19px] leading-[1.6]">{ui.simple.switchNote}</p>
          <ViewSwitch long className="btn btn-big mt-3 w-full sm:w-auto" />
        </aside>
        <div className="mt-4">
          <ExtrasBox />
        </div>
      </main>

      <footer id="sv-shutdown" className="border-t-2 border-ink">
        <div className="mx-auto flex max-w-[760px] flex-col gap-4 px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CvLink className="btn btn-solid" />
            <button type="button" className="btn" onClick={() => goHome()}>
              <IconArrowUp width={16} height={16} /> {ui.footer.top}
            </button>
            <ViewSwitch long />
          </div>
          <p className="text-[16px] text-muted">
            © {new Date().getFullYear()} {p.name} · {siteContent.footerNote}
          </p>
        </div>
      </footer>
      <BackToTop />
    </div>
  );
}
