import { useEffect, useState } from 'react';
import { siteContent } from '../content/siteContent';
import { SECTIONS } from '../lib/sections';
import { copyEmail, openResume } from '../lib/navigation';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { ContactForm } from './ContactForm';
import { RevealText } from './RevealText';
import { IconArrowRight, IconCopy } from './Icons';

/**
 * PLAIN PAGE — the same content as the board, as a printed document. Fast,
 * semantic, no three.js. For recruiters, slow devices, no-WebGL browsers, or
 * anyone who'd rather just read. Layout is an asymmetric 12-column grid:
 * captions in a narrow left margin, content offset to the right.
 */
function SectionHead({ index, id }: { index: number; id: string }) {
  const s = SECTIONS[index];
  return (
    <header className="mb-8 grid gap-2 border-t border-ink pt-3 md:grid-cols-12">
      <p className="caption md:col-span-3">
        {s.fig}
        <span className="mt-1 block text-ink">{s.ref}</span>
      </p>
      <h2 id={id} tabIndex={-1} className="font-serif text-[44px] leading-[0.95] tracking-tightest md:col-span-9 md:text-[64px]">
        {s.title}
      </h2>
    </header>
  );
}

const strip = (s: string) => s.replace('[Placeholder] ', '');

export function SimpleView() {
  const p = siteContent.person;
  const webglOk = useStore((s) => s.webglOk);
  const setSimpleView = useStore((s) => s.setSimpleView);
  const openProject = useStore((s) => s.openProject);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    document.title = siteContent.meta.title;
  }, []);

  return (
    <div className="sheet min-h-screen !border-0 !shadow-none before:hidden after:hidden">
      <main id="main" className="mx-auto max-w-[1180px] px-5 pb-24 pt-24 sm:px-10">
        {/* HERO */}
        <section id="sv-hero" aria-labelledby="sv-hero-title" className="grid gap-8 pb-20 pt-10 md:grid-cols-12">
          <div className="md:col-span-9">
            <p className="caption mb-6">Sheet 1 of {SECTIONS.length} · plain edition · rev 2.3</p>
            <RevealText as="h1" id="sv-hero-title" tabIndex={-1} text={p.name.split(' ')} className="font-serif text-[clamp(64px,12vw,156px)] leading-[0.84] tracking-tightest" />
            <p className="mt-8 max-w-[30ch] font-serif text-[24px] italic leading-snug sm:text-[28px]">{p.tagline}</p>
          </div>
          <aside className="self-end md:col-span-3">
            <dl className="border-t border-ink font-mono text-[12px]">
              {[
                ['Role', strip(p.title)],
                ['Based', strip(p.location)],
                ['Status', strip(p.availability)],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-ink/40 py-2">
                  <dt className="caption">{k}</dt>
                  <dd className="mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button type="button" className="btn btn-solid" onClick={() => openResume()}>
                Résumé
              </button>
              {webglOk && (
                <button type="button" className="btn-quiet" onClick={() => (setSimpleView(false), window.scrollTo(0, 0))}>
                  See the board
                </button>
              )}
            </div>
          </aside>
        </section>

        {/* ABOUT */}
        <section id="sv-about" aria-labelledby="sv-about-title" className="scroll-mt-24 py-14">
          <SectionHead index={1} id="sv-about-title" />
          <div className="grid gap-10 md:grid-cols-12">
            <div className="space-y-4 font-serif text-[20px] leading-[1.5] md:col-span-6 md:col-start-4">
              {siteContent.about.intro.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
            <ol className="md:col-span-3">
              {siteContent.about.facts.map((f) => (
                <li key={f.label} className="border-t border-ink/40 py-2.5">
                  <p className="caption">{f.label}</p>
                  <p className="mt-0.5 font-serif text-[15px] leading-snug">{f.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* SKILLS */}
        <section id="sv-skills" aria-labelledby="sv-skills-title" className="scroll-mt-24 py-14">
          <SectionHead index={2} id="sv-skills-title" />
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-3">
              <p className="font-serif text-[17px] leading-snug">How well I know each thing, out of five. Rounded down.</p>
              <div className="mt-4 flex flex-wrap border-l border-t border-ink" role="group" aria-label="Filter skills">
                {[{ id: null as string | null, label: 'All' }, ...siteContent.skills.map((c) => ({ id: c.id as string | null, label: c.label }))].map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    aria-pressed={filter === c.id}
                    onClick={() => setFilter(c.id)}
                    className={`border-b border-r border-ink px-3 py-1.5 font-mono text-[11.5px] uppercase tracking-[0.06em] ${filter === c.id ? 'bg-ink text-surface' : 'hover:bg-ink/10'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 md:col-span-9">
              {siteContent.skills
                .filter((c) => !filter || c.id === filter)
                .map((c) => (
                  <table key={c.id} className="w-full border-collapse font-mono text-[13px]">
                    <caption className="caption border-b border-ink pb-1 text-left">{c.label}</caption>
                    <tbody>
                      {c.skills.map((s) => (
                        <tr key={s.name} className="border-b border-ink/30">
                          <th scope="row" className="py-1.5 text-left font-normal">
                            {s.name}
                          </th>
                          <td className="py-1.5 text-right">
                            <span className="sr-only">{s.level} of 5</span>
                            <span aria-hidden className="inline-flex gap-[3px]">
                              {Array.from({ length: 5 }, (_, k) => (
                                <i key={k} className={`h-2 w-2 border border-ink ${k < s.level ? 'bg-ink' : ''}`} />
                              ))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ))}
            </div>
          </div>
        </section>

        {/* PROJECTS — first one large, the rest in a looser grid */}
        <section id="sv-projects" aria-labelledby="sv-projects-title" className="scroll-mt-24 py-14">
          <SectionHead index={3} id="sv-projects-title" />
          <ul className="grid gap-x-10 gap-y-12 md:grid-cols-12">
            {siteContent.projects.map((pr, i) => {
              const span = i === 0 ? 'md:col-span-7' : i === 1 ? 'md:col-span-5 md:mt-24' : i % 2 ? 'md:col-span-4 md:col-start-8' : 'md:col-span-5 md:col-start-2';
              return (
                <li key={pr.id} className={span}>
                  <article className="group">
                    <button type="button" onClick={() => (playSound('click'), openProject(i))} className="block w-full text-left" aria-label={`Open datasheet for ${pr.title}`}>
                      <div
                        className={`relative w-full border border-ink ${i === 0 ? 'aspect-[4/3]' : 'aspect-[16/10]'}`}
                        style={pr.gallery[0] ? undefined : { backgroundImage: 'repeating-linear-gradient(135deg, rgb(var(--ink) / 0.1) 0 1px, transparent 1px 10px)' }}
                      >
                        {pr.gallery[0] ? (
                          <img src={pr.gallery[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <span className="absolute left-2 top-2 bg-surface px-1 font-mono text-[10px] text-muted">screenshot goes here</span>
                        )}
                        <span className="absolute bottom-0 left-0 h-full w-2" style={{ background: pr.color }} aria-hidden />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between gap-4 border-b border-ink pb-1">
                        <span className="font-mono text-[11px] text-muted">{pr.partNo ?? `P0${i + 1}`}</span>
                        <span className="font-mono text-[11px] text-muted">
                          {pr.year} · {pr.role}
                        </span>
                      </div>
                      <h3 className={`mt-2 font-serif leading-[0.95] tracking-tightest group-hover:underline group-hover:decoration-accent group-hover:decoration-2 group-hover:underline-offset-[6px] ${i === 0 ? 'text-[48px]' : 'text-[32px]'}`}>
                        {pr.title}
                      </h3>
                    </button>
                    <p className="mt-2 max-w-[46ch] font-serif text-[17px] leading-snug">{pr.summary}</p>
                    <p className="mt-2 font-mono text-[11.5px] text-muted">{pr.tech.join(' · ')}</p>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>

        {/* EXPERIENCE */}
        <section id="sv-experience" aria-labelledby="sv-experience-title" className="scroll-mt-24 py-14">
          <SectionHead index={4} id="sv-experience-title" />
          <ol>
            {siteContent.experience.map((e, i) => (
              <li key={`${e.org}-${i}`} className="grid gap-2 border-b border-ink/40 py-6 md:grid-cols-12">
                <p className="font-mono text-[12px] text-muted md:col-span-3">
                  <time>{e.period}</time>
                  <span className="block">{e.kind === 'work' ? e.location ?? '' : 'School'}</span>
                </p>
                <div className="md:col-span-5">
                  <h3 className="font-serif text-[28px] leading-tight tracking-[-0.02em]">{e.title}</h3>
                  <p className="font-mono text-[12px]">{e.org}</p>
                </div>
                <div className="md:col-span-4">
                  <p className="font-serif text-[17px] leading-snug">{e.summary}</p>
                  <ul className="mt-2 list-['–_'] space-y-1 pl-4 font-serif text-[15px] text-muted">
                    {e.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* CONTACT */}
        <section id="sv-contact" aria-labelledby="sv-contact-title" className="scroll-mt-24 py-14">
          <SectionHead index={5} id="sv-contact-title" />
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4 md:col-start-4">
              <p className="font-serif text-[20px] leading-snug">Email is best. I answer within two working days, usually faster.</p>
              <div className="mt-5 flex items-stretch border border-ink">
                <span className="flex flex-1 items-center truncate px-3 font-mono text-[13px]">{siteContent.contact.email}</span>
                <button type="button" onClick={() => copyEmail()} className="flex items-center gap-1.5 border-l border-ink px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] hover:bg-ink hover:text-surface">
                  <IconCopy width={14} height={14} /> Copy
                </button>
              </div>
              <ul className="mt-5 border-t border-ink">
                {siteContent.contact.socials.map((s) => (
                  <li key={s.id} className="border-b border-ink/40">
                    <a href={s.url} target={s.url.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer" className="flex items-baseline py-2 font-mono text-[12.5px] hover:text-accent-text">
                      {s.label}
                      <span className="leader" />
                      <span className="text-muted">{s.handle}</span>
                      <IconArrowRight width={12} height={12} className="ml-2 self-center" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-5">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <footer id="sv-shutdown" className="border-t border-ink">
        <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-3 px-5 py-6 font-mono text-[11px] text-muted sm:flex-row sm:px-10">
          <span>
            © {new Date().getFullYear()} {p.name} · {siteContent.footerNote}
          </span>
          <span className="flex gap-5">
            <button type="button" className="btn-quiet !min-h-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Top
            </button>
            {webglOk && (
              <button type="button" className="btn-quiet !min-h-0" onClick={() => (setSimpleView(false), window.scrollTo(0, 0))}>
                The board
              </button>
            )}
          </span>
        </div>
      </footer>
    </div>
  );
}
