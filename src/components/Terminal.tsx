import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import gsap from 'gsap';
import { siteContent } from '../content/siteContent';
import { SECTIONS } from '../lib/sections';
import { THEMES, THEME_ORDER, resolveThemeId } from '../lib/themes';
import { navigateTo, openResume } from '../lib/navigation';
import { shutdown } from '../lib/power';
import { activateGodMode } from '../hooks/useKeyboard';
import { playSound } from '../hooks/useSound';
import { ACHIEVEMENTS, useStore } from '../store/useStore';
import { runtime } from '../store/runtime';
import { IconClose } from './Icons';

interface Line {
  id: number;
  kind: 'in' | 'out' | 'err' | 'sys';
  content: ReactNode;
}

const COMMANDS = ['help', 'about', 'skills', 'projects', 'open', 'experience', 'contact', 'theme', 'sound', 'goto', 'clear', 'resume', 'reboot', 'whoami', 'achievements', 'simple', 'exit'];
const HELP: [string, string][] = [
  ['help', 'list commands'],
  ['about', 'who am I'],
  ['skills', 'list skills by category'],
  ['projects', 'list projects'],
  ['open <project>', 'open a project panel (id or number)'],
  ['experience', 'career timeline'],
  ['contact', 'contact info + jump to the port'],
  ['goto <section>', 'fly to a section'],
  ['theme <name>', `switch theme: ${THEME_ORDER.join(' | ')}`],
  ['sound on|off', 'toggle sound'],
  ['resume', 'open resume'],
  ['achievements', 'list discoveries'],
  ['simple', 'toggle Simple View'],
  ['clear', 'clear the screen'],
  ['reboot', 'power cycle the machine'],
  ['exit', 'close terminal (or press `)'],
];

let lineId = 0;
const mk = (kind: Line['kind'], content: ReactNode): Line => ({ id: lineId++, kind, content });

const banner = () => [
  mk('sys', `itm-os 2.3 (tty1) — ${siteContent.person.name.toLowerCase().replace(/\s+/g, '')}@bench`),
  mk('sys', 'Last login: today, on this board. Type `help`. Tab completes, ↑/↓ for history.'),
];

export function Terminal() {
  const open = useStore((s) => s.terminalOpen);
  const setOpen = useStore((s) => s.setTerminal);
  const [lines, setLines] = useState<Line[]>(banner);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocus.current = document.activeElement as HTMLElement;
    inputRef.current?.focus();
    if (boxRef.current) gsap.fromTo(boxRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' });
    return () => restoreFocus.current?.focus?.();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  if (!open) return null;

  const print = (...ls: Line[]) => setLines((prev) => [...prev, ...ls].slice(-300));

  const projectByArg = (arg: string) => {
    const n = parseInt(arg, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= siteContent.projects.length) return n - 1;
    const a = arg.toLowerCase();
    return siteContent.projects.findIndex((p) => p.id.toLowerCase() === a || p.title.toLowerCase() === a || p.id.toLowerCase().includes(a) || p.title.toLowerCase().includes(a));
  };

  const exec = (raw: string) => {
    const cmdline = raw.trim();
    print(mk('in', cmdline));
    if (!cmdline) return;
    setHistory((h) => [cmdline, ...h.filter((x) => x !== cmdline)].slice(0, 50));
    setHIdx(-1);
    const [cmd, ...args] = cmdline.split(/\s+/);
    const arg = args.join(' ');
    const s = useStore.getState();
    playSound('click');

    // Easter egg #3
    if (cmdline.startsWith('sudo')) {
      s.unlock('sudo');
      runtime.ledFlash = 1;
      playSound('warn');
      return print(mk('err', `[sudo] password for visitor: ********`), mk('out', siteContent.easterEggs.sudo));
    }

    switch (cmd.toLowerCase()) {
      case 'help':
        return print(
          ...HELP.map(([c, d]) =>
            mk(
              'out',
              <span>
                <span className="inline-block w-40 text-[#e9e4d8]">{c}</span>
                <span className="text-[#8e887b]">{d}</span>
              </span>,
            ),
          ),
          mk('sys', 'There are a few more. I won’t say which.'),
        );
      case 'about':
      case 'whoami':
        return print(mk('out', `${siteContent.person.name} — ${siteContent.person.title}`), mk('out', siteContent.person.tagline), ...siteContent.about.intro.map((p) => mk('out', p)));
      case 'skills':
        return print(
          ...siteContent.skills.map((c) =>
            mk(
              'out',
              <span>
                <span className="text-[#e9e4d8]">{c.label.padEnd(16, ' ')}</span>
                {c.skills.map((sk) => `${sk.name} ${'▮'.repeat(sk.level)}${'▯'.repeat(5 - sk.level)}`).join('  ')}
              </span>,
            ),
          ),
        );
      case 'projects':
      case 'ls':
        return print(
          ...siteContent.projects.map((p, i) =>
            mk(
              'out',
              <span>
                <span className="text-[#e9e4d8]">[{i + 1}]</span> {p.id.padEnd(18, ' ')}
                <span className="text-[#8e887b]">{p.summary.replace('[Placeholder] ', '')}</span>
              </span>,
            ),
          ),
          mk('sys', 'Use `open <id|number>` to inspect one.'),
        );
      case 'open':
      case 'cat': {
        if (!arg) return print(mk('err', 'usage: open <project-id | number>'));
        const i = projectByArg(arg);
        if (i < 0) return print(mk('err', `open: no such project: ${arg}`));
        print(mk('out', `mounting /dev/${siteContent.projects[i].id} … ok`));
        setOpen(false);
        return s.openProject(i);
      }
      case 'experience':
        return print(...siteContent.experience.map((e) => mk('out', `${e.period.padEnd(16, ' ')} ${e.title} @ ${e.org}`)));
      case 'contact':
        print(mk('out', `email: ${siteContent.contact.email}`), ...siteContent.contact.socials.map((so) => mk('out', `${so.label.padEnd(10, ' ')} ${so.url}`)));
        return navigateTo('contact');
      case 'goto':
      case 'cd': {
        const sec = SECTIONS.find((x) => x.id === arg.toLowerCase() || x.label.toLowerCase() === arg.toLowerCase() || x.hardware.toLowerCase().includes(arg.toLowerCase()));
        if (!arg || !sec) return print(mk('err', `usage: goto <${SECTIONS.map((x) => x.id).join('|')}>`));
        navigateTo(sec.id);
        return print(mk('out', `moving to ${sec.ref} (${sec.hardware.toLowerCase()})`));
      }
      case 'theme': {
        const id = resolveThemeId(arg);
        if (!id) return print(mk('err', `usage: theme <${THEME_ORDER.join('|')}>`));
        s.setTheme(id);
        return print(mk('out', `theme: ${THEMES[id].label.toLowerCase()}`));
      }
      case 'sound': {
        const on = arg === 'on' ? true : arg === 'off' ? false : !s.sound;
        s.setSound(on);
        return print(mk('out', `sound: ${on ? 'on (quietly)' : 'off'}`));
      }
      case 'resume':
        openResume();
        return print(mk('out', 'opening résumé in a new tab'));
      case 'achievements':
        return print(
          ...Object.entries(ACHIEVEMENTS).map(([id, a]) =>
            mk('out', `${s.achievements.includes(id as keyof typeof ACHIEVEMENTS) ? '[x]' : '[ ]'} ${a.label.padEnd(16, ' ')} ${s.achievements.includes(id as keyof typeof ACHIEVEMENTS) ? a.hint : '???'}`),
          ),
        );
      case 'simple':
        s.setSimpleView(!s.simpleView);
        window.scrollTo(0, 0);
        return print(mk('out', `plain page: ${!s.simpleView ? 'on' : 'off'}`));
      case 'konami':
      case 'godmode':
        activateGodMode();
        return print(mk('out', 'ok.'));
      case 'clear':
      case 'cls':
        return setLines([]);
      case 'reboot':
      case 'shutdown':
        print(mk('sys', 'Broadcast message from visitor@bench: the system is going down for reboot NOW.'));
        window.setTimeout(() => shutdown(), 400);
        return;
      case 'exit':
      case 'quit':
        return setOpen(false);
      case 'rm':
        return print(mk('err', 'rm: cannot remove: the portfolio is load-bearing'));
      case 'hello':
      case 'hi':
        return print(mk('out', 'Hello. You can type `help`, or just look around.'));
      default:
        playSound('error');
        return print(mk('err', `${cmd}: command not found`));
    }
  };

  const complete = () => {
    const parts = input.split(/\s+/);
    if (parts.length <= 1) {
      const matches = COMMANDS.filter((c) => c.startsWith(parts[0].toLowerCase()));
      if (matches.length === 1) setInput(`${matches[0]} `);
      else if (matches.length > 1) print(mk('sys', matches.join('  ')));
      return;
    }
    const [cmd, partial = ''] = [parts[0], parts.slice(1).join(' ')];
    let pool: string[] = [];
    if (cmd === 'open' || cmd === 'cat') pool = siteContent.projects.map((p) => p.id);
    else if (cmd === 'theme') pool = THEME_ORDER;
    else if (cmd === 'sound') pool = ['on', 'off'];
    else if (cmd === 'goto' || cmd === 'cd') pool = SECTIONS.map((x) => x.id);
    const matches = pool.filter((p) => p.startsWith(partial.toLowerCase()));
    if (matches.length === 1) setInput(`${cmd} ${matches[0]}`);
    else if (matches.length > 1) print(mk('sys', matches.join('  ')));
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      exec(input);
      setInput('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const n = Math.min(history.length - 1, hIdx + 1);
      if (history[n] !== undefined) (setHIdx(n), setInput(history[n]));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const n = hIdx - 1;
      if (n < 0) (setHIdx(-1), setInput(''));
      else (setHIdx(n), setInput(history[n]));
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[65] flex justify-center p-2 sm:p-4" role="dialog" aria-modal="false" aria-label="Terminal">
      <div
        ref={boxRef}
        className="flex h-[min(60vh,440px)] w-full max-w-3xl flex-col border border-[#3a3733] bg-[#161513] font-mono text-[13px] text-[#d8d2c4] shadow-[0_24px_50px_-20px_rgba(0,0,0,0.8)]"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex items-center justify-between border-b border-[#3a3733] bg-[#1e1c1a] px-3 py-1.5">
          <span className="text-[11px] text-[#9a9385]">tty1 — 80×24 — bash</span>
          <button type="button" onClick={() => setOpen(false)} className="grid h-7 w-7 place-items-center text-[#9a9385] hover:text-[#e9e4d8]" aria-label="Close terminal">
            <IconClose width={14} height={14} />
          </button>
        </div>
        <div ref={scrollRef} className="panel-scroll flex-1 space-y-0.5 overflow-y-auto px-4 py-3" aria-live="polite">
          {lines.map((l) => (
            <div key={l.id} className={`whitespace-pre-wrap break-words ${l.kind === 'err' ? 'text-[#ff8a5c]' : l.kind === 'sys' ? 'text-[#8e887b]' : ''}`}>
              {l.kind === 'in' ? (
                <>
                  <span className="text-[#a9c49a]">visitor@bench:~$</span> {l.content}
                </>
              ) : (
                l.content
              )}
            </div>
          ))}
        </div>
        <label className="flex items-center gap-2 px-4 pb-3 pt-1">
          <span className="shrink-0 text-[#a9c49a]">visitor@bench:~$</span>
          <span className="sr-only">Terminal command</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/`/g, ''))}
            onKeyDown={onKey}
            className="min-w-0 flex-1 bg-transparent text-[#e9e4d8] caret-[#e9e4d8] outline-none"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </label>
      </div>
    </div>
  );
}
