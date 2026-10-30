import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { siteContent, type Project } from '../content/siteContent';
import { DUR, EASE } from '../lib/motion';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
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
          aria-label={`${project.title} figure ${n + 1} (placeholder)`}
          className="relative aspect-[16/10] w-full border border-ink"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgb(var(--ink) / 0.12) 0 1px, transparent 1px 9px)' }}
        >
          <span className="absolute left-2 top-2 bg-surface px-1 font-mono text-[10px] text-muted">screenshot goes here</span>
        </div>
      )}
      <figcaption className="caption mt-1.5">
        Fig. {n + 1} — {n === 0 ? 'main view' : n === 1 ? 'detail' : 'edge case'}
      </figcaption>
    </figure>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full border-collapse font-mono text-[12px]">
      <thead>
        <tr className="border-y border-ink text-left">
          {head.map((h) => (
            <th key={h} className="py-1.5 pr-3 font-medium uppercase tracking-[0.06em] text-muted">
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

const H = ({ n, children }: { n: number; children: string }) => (
  <h3 className="mb-2 mt-7 flex items-baseline gap-2 font-mono text-[11.5px] font-semibold uppercase tracking-[0.1em]">
    <span className="text-muted">{n}.</span>
    {children}
  </h3>
);

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
        const f = card.current.querySelectorAll<HTMLElement>('button, a[href]');
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
  const part = p.partNo ?? `ITM-P${String(shown + 1).padStart(2, '0')}`;
  const rev = p.revisions?.[p.revisions.length - 1]?.rev ?? 'A';
  const shots = p.gallery.length ? p.gallery : [undefined, undefined, undefined];

  return (
    <div ref={backdrop} className="fixed inset-0 z-[60] flex items-end justify-center bg-offblack/60 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div ref={card} role="dialog" aria-modal="true" aria-labelledby="project-title" className="sheet flex max-h-[94vh] w-full max-w-[920px] flex-col">
        <div className="flex items-center justify-between border-b border-ink px-4 py-2 sm:px-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em]">
            Datasheet · <span className="font-semibold">{part}</span> · Rev {rev}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="Previous project">
              <IconArrowLeft />
            </button>
            <button type="button" className="icon-btn" onClick={() => step(1)} aria-label="Next project">
              <IconArrowRight />
            </button>
            <button ref={closeBtn} type="button" className="icon-btn" onClick={close} aria-label="Close datasheet">
              <IconClose />
            </button>
          </div>
        </div>

        <div ref={content} className="panel-scroll overflow-y-auto px-4 pb-8 pt-6 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="caption">
                {p.year} · {p.role}
              </p>
              <h2 id="project-title" className="mt-1 font-serif text-[46px] leading-[0.92] tracking-tightest sm:text-[68px]">
                {p.title}
              </h2>
            </div>
            {p.status && <span className="stamp mt-2 text-[11px]">{p.status}</span>}
          </div>
          <p className="mt-4 max-w-[52ch] font-serif text-[21px] italic leading-snug">{p.summary}</p>

          <div className="mt-2 grid gap-x-10 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div>
              <H n={1}>General description</H>
              <div className="space-y-3 font-serif text-[17px] leading-[1.55]">
                {p.description.map((d) => (
                  <p key={d}>{d}</p>
                ))}
              </div>
              <H n={4}>Figures</H>
              <div className="grid gap-4 sm:grid-cols-2">
                {shots.map((src, i) => (
                  <Figure key={i} project={p} n={i} src={src} big={i === 0} />
                ))}
              </div>
            </div>
            <div>
              <H n={2}>Specifications</H>
              <Table
                head={['Parameter', 'Value']}
                rows={[['Year', p.year], ['Role', p.role], ...(p.status ? [['Status', p.status]] : []), ...(p.specs ?? []).map((s) => [s.label, s.value])]}
              />
              <H n={3}>Absolute maximum ratings</H>
              <Table head={['Stack', 'Use']} rows={p.tech.map((t, i) => [t, i < 2 ? 'Primary' : 'Supporting'])} />
              <p className="mt-2 font-mono text-[10.5px] leading-snug text-muted">Stresses beyond those listed may cause the project to be rewritten.</p>
              {p.revisions?.length ? (
                <>
                  <H n={5}>Revision history</H>
                  <Table head={['Rev', 'Date', 'Change']} rows={p.revisions.map((r) => [r.rev, r.date, r.note])} />
                </>
              ) : null}
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                {p.links.live && (
                  <a className="btn btn-solid" href={p.links.live} target="_blank" rel="noopener noreferrer">
                    Visit <IconExternal width={13} height={13} />
                  </a>
                )}
                {p.links.repo && (
                  <a className="link font-mono text-[12px] uppercase tracking-[0.06em]" href={p.links.repo} target="_blank" rel="noopener noreferrer">
                    Source
                  </a>
                )}
                {p.links.caseStudy && (
                  <a className="link font-mono text-[12px] uppercase tracking-[0.06em]" href={p.links.caseStudy} target="_blank" rel="noopener noreferrer">
                    Case study
                  </a>
                )}
              </div>
            </div>
          </div>

          <p className="mt-10 flex justify-between border-t border-ink pt-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted">
            <span>
              Sheet {shown + 1} of {projects.length}
            </span>
            <span>← → flip · Esc close</span>
          </p>
        </div>
      </div>
    </div>
  );
}
