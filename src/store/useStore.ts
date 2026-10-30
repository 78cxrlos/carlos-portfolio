import { create } from 'zustand';
import type { ThemeId } from '../lib/themes';
import { THEME_ORDER } from '../lib/themes';

/**
 * Global UI state. Anything that changes every frame (scroll, heat, ripples)
 * lives in `runtime.ts` instead so it never triggers React re-renders.
 */

export type Quality = 0 | 1 | 2; // 0 = low (no post), 1 = medium (bloom), 2 = high (all effects)
export type CursorState = 'default' | 'hover' | 'grab' | 'grabbing' | 'text' | 'hold';

export interface Toast {
  id: number;
  title: string;
  body?: string;
  tone?: 'info' | 'success' | 'warn' | 'achievement';
}

export const ACHIEVEMENTS = {
  booted: { label: 'Powered on', hint: 'Pressed the button' },
  tourist: { label: 'Full inspection', hint: 'Looked at every part of the board' },
  overclock: { label: 'Thermal limit', hint: 'Held the CPU until it complained' },
  konami: { label: 'Cheat code', hint: '↑↑↓↓←→←→BA' },
  chip: { label: 'Unmarked part', hint: 'Found the chip with no label' },
  sudo: { label: 'Root access', hint: 'Asked the terminal nicely' },
  tosser: { label: 'Dropped a screw', hint: 'Threw a loose part' },
  plugged: { label: 'Link up', hint: 'Plugged a cable in' },
  hacker: { label: 'Shell user', hint: 'Opened the terminal' },
  inspector: { label: 'Read the datasheet', hint: 'Opened a project' },
} as const;
export type AchievementId = keyof typeof ACHIEVEMENTS;

const LS_THEME = 'itm:theme';
const LS_ACH = 'itm:achievements';
const LS_SIMPLE = 'itm:simple';
const SS_BOOTED = 'itm:booted';

// Storage can throw (private mode, blocked cookies) — always guard.
function readLS<T>(key: string, fallback: T, store: 'local' | 'session' = 'local'): T {
  try {
    const raw = (store === 'local' ? localStorage : sessionStorage).getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}
function writeLS(key: string, value: unknown, store: 'local' | 'session' = 'local') {
  try {
    (store === 'local' ? localStorage : sessionStorage).setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
const isSmall = typeof window !== 'undefined' && window.innerWidth < 768;

interface State {
  theme: ThemeId;
  sound: boolean;
  simpleView: boolean;
  webglOk: boolean;
  booted: boolean;
  sceneReady: boolean;
  assetProgress: number;
  section: number;
  visited: number[];
  quality: Quality;
  reducedMotion: boolean;
  isTouch: boolean;
  isMobile: boolean;
  cursor: CursorState;
  idle: boolean;

  activeProject: number | null;
  terminalOpen: boolean;
  paletteOpen: boolean;
  achievementsOpen: boolean;
  secretMessage: string | null;
  godMode: boolean;
  powering: boolean;

  selectedFact: number | null;
  skillFilter: string | null;
  hoveredSkill: { category: string; name: string; level: number } | null;
  hoveredPacket: number | null;
  heat: number; // throttled copy of runtime.heat for the gauge UI
  pluggedIn: string[];
  hintsSeen: string[];

  achievements: AchievementId[];
  toasts: Toast[];

  setTheme: (t: ThemeId) => void;
  cycleTheme: () => void;
  setSound: (on: boolean) => void;
  setSimpleView: (on: boolean) => void;
  setWebglOk: (ok: boolean) => void;
  setBooted: (b: boolean) => void;
  setSceneReady: (b: boolean) => void;
  setSection: (i: number) => void;
  setQuality: (q: Quality) => void;
  setCursor: (c: CursorState) => void;
  setIdle: (b: boolean) => void;
  openProject: (i: number | null) => void;
  setTerminal: (open: boolean) => void;
  setPalette: (open: boolean) => void;
  setAchievementsOpen: (open: boolean) => void;
  setSecretMessage: (m: string | null) => void;
  setGodMode: (b: boolean) => void;
  setPowering: (b: boolean) => void;
  selectFact: (i: number | null) => void;
  setSkillFilter: (id: string | null) => void;
  setHoveredSkill: (s: State['hoveredSkill']) => void;
  setHoveredPacket: (i: number | null) => void;
  setHeat: (h: number) => void;
  plugIn: (id: string) => void;
  unplugAll: () => void;
  markHint: (id: string) => void;
  unlock: (id: AchievementId) => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
}

let toastId = 1;

export const useStore = create<State>((set, get) => ({
  theme: (['bench', 'night'] as ThemeId[]).includes(readLS<ThemeId>(LS_THEME, 'bench')) ? readLS<ThemeId>(LS_THEME, 'bench') : 'bench',
  sound: false, // OFF by default, always
  simpleView: readLS<boolean>(LS_SIMPLE, false),
  webglOk: true,
  booted: readLS<boolean>(SS_BOOTED, false, 'session'),
  sceneReady: false,
  assetProgress: 0,
  section: 0,
  visited: [0],
  quality: isTouch || isSmall ? 1 : 2,
  reducedMotion: !!prefersReducedMotion,
  isTouch: !!isTouch,
  isMobile: !!isSmall,
  cursor: 'default',
  idle: false,

  activeProject: null,
  terminalOpen: false,
  paletteOpen: false,
  achievementsOpen: false,
  secretMessage: null,
  godMode: false,
  powering: false,

  selectedFact: null,
  skillFilter: null,
  hoveredSkill: null,
  hoveredPacket: null,
  heat: 0,
  pluggedIn: [],
  hintsSeen: [],

  achievements: readLS<AchievementId[]>(LS_ACH, []).filter((a) => a in ACHIEVEMENTS),
  toasts: [],

  setTheme: (theme) => {
    writeLS(LS_THEME, theme);
    set({ theme });
  },
  cycleTheme: () => {
    const i = THEME_ORDER.indexOf(get().theme);
    get().setTheme(THEME_ORDER[(i + 1) % THEME_ORDER.length]);
  },
  setSound: (sound) => set({ sound }),
  setSimpleView: (simpleView) => {
    writeLS(LS_SIMPLE, simpleView);
    set({ simpleView });
  },
  setWebglOk: (webglOk) => set({ webglOk }),
  setBooted: (booted) => {
    writeLS(SS_BOOTED, booted, 'session');
    set({ booted });
  },
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setSection: (section) => {
    const { visited } = get();
    if (get().section === section) return;
    const next = visited.includes(section) ? visited : [...visited, section];
    set({ section, visited: next });
  },
  setQuality: (quality) => set({ quality }),
  setCursor: (cursor) => {
    if (get().cursor !== cursor) set({ cursor });
  },
  setIdle: (idle) => {
    if (get().idle !== idle) set({ idle });
  },
  openProject: (activeProject) => {
    set({ activeProject });
    if (activeProject !== null) get().unlock('inspector');
  },
  setTerminal: (terminalOpen) => {
    set({ terminalOpen, paletteOpen: terminalOpen ? false : get().paletteOpen });
    if (terminalOpen) get().unlock('hacker');
  },
  setPalette: (paletteOpen) => set({ paletteOpen, terminalOpen: paletteOpen ? false : get().terminalOpen }),
  setAchievementsOpen: (achievementsOpen) => set({ achievementsOpen }),
  setSecretMessage: (secretMessage) => set({ secretMessage }),
  setGodMode: (godMode) => set({ godMode }),
  setPowering: (powering) => set({ powering }),
  selectFact: (selectedFact) => set({ selectedFact }),
  setSkillFilter: (skillFilter) => set({ skillFilter }),
  setHoveredSkill: (hoveredSkill) => set({ hoveredSkill }),
  setHoveredPacket: (hoveredPacket) => set({ hoveredPacket }),
  setHeat: (heat) => set({ heat }),
  plugIn: (id) => {
    if (!get().pluggedIn.includes(id)) set({ pluggedIn: [...get().pluggedIn, id] });
    get().unlock('plugged');
  },
  unplugAll: () => set({ pluggedIn: [] }),
  markHint: (id) => {
    if (!get().hintsSeen.includes(id)) set({ hintsSeen: [...get().hintsSeen, id] });
  },
  unlock: (id) => {
    const { achievements } = get();
    if (achievements.includes(id)) return;
    const next = [...achievements, id];
    writeLS(LS_ACH, next);
    set({ achievements: next });
    get().toast({ tone: 'achievement', title: `QC passed — ${ACHIEVEMENTS[id].label}`, body: ACHIEVEMENTS[id].hint });
  },
  toast: (t) => {
    const id = toastId++;
    set({ toasts: [...get().toasts.slice(-3), { ...t, id }] });
    window.setTimeout(() => get().dismissToast(id), t.tone === 'warn' ? 5000 : 3800);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
