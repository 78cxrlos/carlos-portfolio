import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { siteContent, type Project } from '../content/siteContent';
import { DUR, EASE } from '../lib/motion';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { lockPageScroll } from '../hooks/useModal';
import { ui } from '../content/uiStrings';
import { IconArrowLeft, IconArrowRight, IconClose, IconExternal } from './Icons';

/** Figure placeholder: a hatched frame with a caption, like an unprinted figure. */
function Figure({ project, n, src, big }: { project: Project; n: number; src?: string; big?: boolean }) {
  return (
    <figure className={big ? 'sm:col-span-2' : ''}>
      {src ? (
        <img src={src} alt={`${project.title}, figure ${n + 1}`} loading="lazy" className="aspect-[16/10] w-full border border-ink object-cover" />
      ) : (
        <div
          role="img"
          aria-label={`${project.title}: ${ui.project.noScreenshot}`}
          className="relative aspect-[16/10] w-full border border-ink"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgb(var(--ink) / 0.12) 0 1px, transparent 1px 9px)' }}
        >
          <span className="absolute left-2 top-2 bg-surface px-1 font-mono text-[14px] text-muted">{ui.project.noScreenshot}</span>
        </div>
      )}
      <figcaption className="caption mt-1.5">
        {ui.project.screenshots} {n + 1}
      </figcaption>
    </figure>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full border-collapse text-[16px]">
      <thead>
        <tr className="border-y border-ink text-left">
          {head.map((h) => (
            <th key={h} scope="col" className="py-1.5 pr-3 font-mono font-medium text-muted">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-ink/30 align-top">
            {r.map((c, j) => (
              <td key={j} className={`py-1.5 pr-3 ${j === 0 ? 'whitespace-nowrap' : ''}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const H = ({ children }: { children: string }) => <h3 className="mb-2 mt-7 font-serif text-[24px] leading-tight">{children}</h3>;

export function ProjectPanel() {
  const index = useStore((s) => s.activeProject);
  const openProject = useStore((s) => s.openProject);
  const reduced = useStore((s) => s.reducedMotion);
  const projects = siteContent.projects;
  const [shown, setShown] = useState<number | null>(index);
  const backdrop = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const closing = useRef(false);

  useEffect(() => {
    if (index === null) return;
    if (shown === null) {
      restoreFocus.current = document.activeElement as HTMLElement;
      setShown(index);
    } else if (index !== shown) {
      const dir = index > shown ? 1 : -1;
      if (reduced || !content.current) setShown(index);
      else
        gsap.to(content.current, {
          x: -16 * dir,
          opacity: 0,
          duration: DUR.fast,
          ease: EASE.in,
          onComplete: () => {
            setShown(index);
            content.current?.scrollTo({ top: 0 });
            gsap.fromTo(content.current, { x: 16 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: DUR.base, ease: EASE.out });
          },
        });
    }
  }, [index, shown, reduced]);

  useEffect(() => (shown === null ? undefined : lockPageScroll()), [shown === null]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (shown === null || !card.current || !backdrop.current) return;
    closing.current = false;
    closeBtn.current?.focus();
    if (reduced) return;
    gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: DUR.base, ease: EASE.out });
    // a sheet slid onto the desk: up, slight rotation, settles
    gsap.fromTo(card.current, { y: 48, rotate: 0.8, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: DUR.slow, ease: EASE.out });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown === null]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    playSound('click');
    const done = () => {
      setShown(null);
      openProject(null);
      restoreFocus.current?.focus?.();
    };
    if (reduced || !card.current) return done();
    gsap.to(card.current, { y: 32, opacity: 0, duration: DUR.base * 0.7, ease: EASE.in });
    gsap.to(backdrop.current, { opacity: 0, duration: DUR.base * 0.8, ease: EASE.in, onComplete: done });
  }, [openProject, reduced]);

  const step = useCallback(
    (d: number) => {
      if (shown === null) return;
      playSound('click');
      openProject((shown + d + projects.length) % projects.length);
    },
    [shown, openProject, projects.length],
  );

  useEffect(() => {
    if (shown === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (useStore.getState().terminalOpen || useStore.getState().paletteOpen) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Tab' && card.current) {
        const f = card.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shown, close, step]);

  if (shown === null) return null;
  const p = projects[shown];
  const shots = p.gallery.length ? p.gallery : [undefined, undefined, undefined];

  return (
    <div ref={backdrop} className="fixed inset-0 z-[60] flex items-end justify-center bg-offblack/60 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={card} role="dialog" aria-modal="true" aria-labelledby="project-title" className="sheet flex max-h-[94vh] w-full max-w-[920px] flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink px-3 py-2 sm:px-6">
          <span className="font-mono text-[15px]">{ui.project.counter(shown + 1, projects.length)}</span>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn !px-3" onClick={() => step(-1)} aria-label={ui.project.prev}>
              <IconArrowLeft width={16} height={16} /> <span className="hidden sm:inline">{ui.project.prev}</span>
            </button>
            <button type="button" className="btn !px-3" onClick={() => step(1)} aria-label={ui.project.next}>
              <span className="hidden sm:inline">{ui.project.next}</span> <IconArrowRight width={16} height={16} />
            </button>
            <button ref={closeBtn} type="button" className="btn btn-solid" onClick={close} aria-label={ui.project.closeLabel}>
              <IconClose width={16} height={16} /> {ui.project.close}
            </button>
          </div>
        </div>

        <div ref={content} className="panel-scroll overflow-y-auto overscroll-contain px-4 pb-8 pt-6 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="caption">
                {p.year} · {p.role}
              </p>
              <h2 id="project-title" className="mt-1 font-serif text-[46px] leading-[0.92] tracking-tightest sm:text-[68px]">
                {p.title}
              </h2>
            </div>
            {p.status && <span className="stamp mt-2 text-[14px]">{p.status}</span>}
          </div>
          <p className="mt-4 max-w-[52ch] font-serif text-[22px] leading-[1.5]">{p.summary}</p>

          <div className="mt-2 grid gap-x-10 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div>
              <H>{ui.project.about}</H>
              <div className="space-y-3 text-[18px] leading-[1.6]">
                {p.description.map((d) => (
                  <p key={d}>{d}</p>
                ))}
              </div>
              <H>{ui.project.screenshots}</H>
              <div className="grid gap-4 sm:grid-cols-2">
                {shots.map((src, i) => (
                  <Figure key={i} project={p} n={i} src={src} big={i === 0} />
                ))}
              </div>
            </div>
            <div>
              <H>{ui.project.details}</H>
              <Table
                head={[ui.project.colItem, ui.project.colValue]}
                rows={[[ui.project.year, p.year], [ui.project.role, p.role], ...(p.status ? [[ui.project.status, p.status]] : []), ...(p.specs ?? []).map((s) => [s.label, s.value])]}
              />
              <H>{ui.project.tools}</H>
              <Table head={[ui.project.colTool, ui.project.colUse]} rows={p.tech.map((t, i) => [t, i < 2 ? ui.project.main : ui.project.also])} />
              {p.revisions?.length ? (
                <>
                  <H>{ui.project.history}</H>
                  <Table head={[ui.project.colVersion, ui.project.colDate, ui.project.colChange]} rows={p.revisions.map((r) => [r.rev, r.date, r.note])} />
                </>
              ) : null}
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                {p.links.live && (
                  <a className="btn btn-solid" href={p.links.live} target="_blank" rel="noopener noreferrer">
                    {ui.project.live} <IconExternal width={14} height={14} />
                  </a>
                )}
                {p.links.repo && (
                  <a className="btn" href={p.links.repo} target="_blank" rel="noopener noreferrer">
                    {ui.project.repo} <IconExternal width={14} height={14} />
                  </a>
                )}
                {p.links.caseStudy && (
                  <a className="btn" href={p.links.caseStudy} target="_blank" rel="noopener noreferrer">
                    {ui.project.caseStudy} <IconExternal width={14} height={14} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-ink pt-3">
            <p className="text-[16px] text-muted">{ui.project.keys}</p>
            <button type="button" className="btn btn-solid" onClick={close}>
              <IconClose width={16} height={16} /> {ui.project.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
