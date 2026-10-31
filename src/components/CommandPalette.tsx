import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import gsap from 'gsap';
import { buildCommands, type Command } from '../lib/commands';
import { fuzzyScore } from '../lib/fuzzy';
import { useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';
import { IconClose, IconSearch } from './Icons';
import { ui } from '../content/uiStrings';
import { useModal } from '../hooks/useModal';

export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen);
  const setOpen = useStore((s) => s.setPalette);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const commands = useMemo(() => (open ? buildCommands() : []), [open]);

  const results = useMemo(() => {
    if (!query.trim()) return commands;
    return commands
      .map((c) => ({ c, score: Math.max(fuzzyScore(query, c.label), fuzzyScore(query, `${c.label} ${c.keywords ?? ''} ${c.group}`) - 4) }))
      .filter((r) => r.score > -1)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.c);
  }, [commands, query]);

  useModal(open, boxRef, () => setOpen(false), inputRef);
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    if (boxRef.current) gsap.fromTo(boxRef.current, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power3.out' });
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
    }
  };

  let lastGroup = '';
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-offblack/50 px-3 pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div ref={boxRef} role="dialog" aria-modal="true" aria-label={ui.palette.title} className="sheet w-full max-w-xl">
        <div className="flex items-center justify-between border-b border-ink py-1 pl-4 pr-1">
          <p className="font-serif text-[20px]">{ui.palette.title}</p>
          <button type="button" className="btn !min-h-[44px] !px-3" onClick={() => setOpen(false)}>
            <IconClose width={14} height={14} /> {ui.dialog.close}
          </button>
        </div>
        <div className="flex items-center gap-3 border-b border-ink px-4">
          <IconSearch className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder={ui.palette.placeholder}
            aria-label={ui.palette.title}
            className="h-14 min-w-0 flex-1 bg-transparent font-serif text-[20px] tracking-[-0.01em] text-ink outline-none placeholder:text-muted"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
            aria-autocomplete="list"
          />
        </div>
        <ul ref={listRef} id="palette-list" role="listbox" className="panel-scroll max-h-[55vh] overflow-y-auto px-2 pb-2">
          {results.length === 0 && <li className="px-3 py-6 text-[17px] text-muted">{ui.palette.empty}</li>}
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
                  className={`flex min-h-[44px] cursor-pointer items-center gap-3 px-2 py-2 ${i === active ? 'bg-ink text-surface' : 'text-ink'}`}
                >
                  <span className="text-[17px]">{c.label}</span>
                  <span className={`leader ${i === active ? '!border-surface/40' : ''}`} />
                  <span className={`truncate font-mono text-[14px] ${i === active ? 'text-surface' : 'text-muted'}`}>{c.hint ?? c.group}</span>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap justify-between gap-2 border-t border-ink px-4 py-2 font-mono text-[14px] text-muted">
          <span>{ui.palette.keys}</span>
          <span>{ui.palette.count(results.length)}</span>
        </div>
      </div>
    </div>
  );
}
