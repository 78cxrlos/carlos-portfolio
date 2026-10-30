import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import gsap from 'gsap';
import { buildCommands, type Command } from '../lib/commands';
import { fuzzyScore } from '../lib/fuzzy';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { IconSearch } from './Icons';

export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen);
  const setOpen = useStore((s) => s.setPalette);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const commands = useMemo(() => (open ? buildCommands() : []), [open]);

  const results = useMemo(() => {
    if (!query.trim()) return commands;
    return commands
      .map((c) => ({ c, score: Math.max(fuzzyScore(query, c.label), fuzzyScore(query, `${c.label} ${c.keywords ?? ''} ${c.group}`) - 4) }))
      .filter((r) => r.score > -1)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.c);
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    restoreFocus.current = document.activeElement as HTMLElement;
    setQuery('');
    setActive(0);
    inputRef.current?.focus();
    if (boxRef.current) gsap.fromTo(boxRef.current, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power3.out' });
    return () => restoreFocus.current?.focus?.();
  }, [open]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const run = (c: Command) => {
    playSound('click');
    setOpen(false);
    // let the palette unmount before navigating (focus restore, scroll)
    window.setTimeout(() => c.run(), 10);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
      playSound('hover');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
      playSound('hover');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[active]) run(results[active]);
    } else if (e.key === 'Tab') {
      e.preventDefault(); // keep focus inside the dialog
    }
  };

  let lastGroup = '';
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-offblack/50 px-3 pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div ref={boxRef} role="dialog" aria-modal="true" aria-label="Command palette" className="sheet w-full max-w-xl">
        <div className="flex items-center justify-between border-b border-ink px-4 pt-3">
          <p className="caption">Index · jump to anything</p>
          <kbd className="font-mono text-[10px] text-muted">ESC</kbd>
        </div>
        <div className="flex items-center gap-3 border-b border-ink px-4">
          <IconSearch className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Section, project, setting…"
            className="h-14 flex-1 bg-transparent font-serif text-[22px] tracking-[-0.01em] text-ink outline-none placeholder:text-muted/70"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
            aria-autocomplete="list"
          />
        </div>
        <ul ref={listRef} id="palette-list" role="listbox" className="panel-scroll max-h-[55vh] overflow-y-auto px-2 pb-2">
          {results.length === 0 && <li className="px-3 py-6 font-mono text-[12px] text-muted">Nothing by that name. Try “work” or “night”.</li>}
          {results.map((c, i) => {
            const header = !query && c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            return (
              <li key={c.id} role="presentation">
                {header && <div className="caption px-2 pb-1 pt-3">{header}</div>}
                <div
                  id={`cmd-${c.id}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => run(c)}
                  className={`flex cursor-pointer items-baseline gap-3 px-2 py-2 ${i === active ? 'bg-ink text-surface' : 'text-ink'}`}
                >
                  <span className="font-mono text-[13px]">{c.label}</span>
                  <span className={`leader ${i === active ? '!border-surface/40' : ''}`} />
                  <span className={`truncate font-mono text-[11px] ${i === active ? 'text-surface/70' : 'text-muted'}`}>{c.hint ?? c.group}</span>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-between border-t border-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
          <span>↑↓ navigate · ↵ run</span>
          <span>{results.length} entries</span>
        </div>
      </div>
    </div>
  );
}
