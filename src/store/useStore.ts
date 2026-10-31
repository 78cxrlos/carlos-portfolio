import { create } from 'zustand';
import type { ThemeId } from '../lib/themes';
import { THEME_ORDER } from '../lib/themes';
import { ui, type ExtraItem } from '../content/uiStrings';

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

/** "Things to try" checklist. Wording, clues and order live in content/uiStrings.ts (ui.extras.items). */
export type AchievementId = keyof typeof ui.extras.items;
export const ACHIEVEMENTS: Record<AchievementId, ExtraItem> = ui.extras.items;

const LS_THEME = 'itm:theme';
const LS_ACH = 'itm:achievements';
const LS_SIMPLE = 'itm:simple'; // legacy boolean, still honoured
const LS_VIEW = 'itm:view'; // 'simple' | '3d' — the visitor's own choice
const LS_PREFS = 'itm:prefs';
const LS_TOUR = 'itm:tour-seen';
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

const hasWindow = typeof window !== 'undefined';
const prefersReducedMotion = hasWindow && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isTouch = hasWindow && !!window.matchMedia?.('(pointer: coarse)').matches;
const isSmall = hasWindow && Math.min(window.innerWidth, window.innerHeight) < 600;

/** A rough guess at a weak GPU / device, without creating a full renderer. */
function isLowTierDevice(): boolean {
  if (!hasWindow) return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency ?? 8) <= 2) return true;
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) return true;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /swiftshader|llvmpipe|software|mali-[4t][0-9]{2}\b|adreno \(tm\) [1-4]\d\d|powervr sgx|intel.*hd graphics [2-5]\d{2,3}\b/i.test(renderer);
  } catch {
    return false;
  }
}

function isSlowConnection(): boolean {
  if (!hasWindow) return false;
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !!c && (!!c.saveData || ['slow-2g', '2g', '3g'].includes(c.effectiveType ?? ''));
}

/** Why the Simple View is the better default here (null = no reason). */
export type SimpleReason = 'touch' | 'gpu' | 'motion' | 'network' | null;
function detectSimpleReason(): SimpleReason {
  if (isTouch && isSmall) return 'touch';
  if (prefersReducedMotion) return 'motion';
  if (isSlowConnection()) return 'network';
  if (isLowTierDevice()) return 'gpu';
  return null;
}

export type MotionPref = 'auto' | 'reduce' | 'full';
export interface Prefs {
  /** Index into TEXT_SCALES. */
  textSize: number;
  highContrast: boolean;
  motion: MotionPref;
}
/** Root font-size multipliers for A- / A / A+. Index 1 is normal. */
export const TEXT_SCALES = [0.9, 1, 1.15, 1.3, 1.5] as const;
const DEFAULT_PREFS: Prefs = { textSize: 1, highContrast: false, motion: 'auto' };

/** Motion is reduced if the visitor asked for it, or by default on phones/tablets and with the OS setting. */
export function computeReducedMotion(motion: MotionPref, os = prefersReducedMotion) {
  if (motion === 'reduce') return true;
  if (motion === 'full') return false;
  return os || isTouch;
}

/**
 * Gentle page effects (fades, filling bars, counters) stay on for touch
 * devices; only the visitor's switch or the OS setting turns them off.
 * The 3D camera uses the stricter `computeReducedMotion`.
 */
export function computeGentleMotion(motion: MotionPref, os = prefersReducedMotion) {
  if (motion === 'reduce') return false;
  if (motion === 'full') return true;
  return !os;
}

const storedView = readLS<'simple' | '3d' | null>(LS_VIEW, null) ?? (readLS<boolean>(LS_SIMPLE, false) ? 'simple' : null);
const simpleReason = storedView ? null : detectSimpleReason();
const initialPrefs: Prefs = { ...DEFAULT_PREFS, ...readLS<Partial<Prefs>>(LS_PREFS, {}) };

export interface ConfirmRequest {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
}

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
  /** Small UI animations allowed (see computeGentleMotion). */
  gentleMotion: boolean;
  prefs: Prefs;
  /** Shown until the visitor picks a version (first visit). */
  welcomeOpen: boolean;
  /** Why Simple was preselected, if it was. */
  simpleReason: SimpleReason;
  helpOpen: boolean;
  tourOpen: boolean;
  tourSeen: boolean;
  menuOpen: boolean;
  confirm: ConfirmRequest | null;
  /** Floating label for 3D objects (hover / long-press). */
  sceneTip: { text: string; x: number; y: number } | null;
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
  chooseView: (view: 'simple' | '3d') => void;
  setPrefs: (p: Partial<Prefs>) => void;
  setOsReducedMotion: (on: boolean) => void;
  setHelp: (open: boolean) => void;
  setTour: (open: boolean) => void;
  setMenu: (open: boolean) => void;
  askConfirm: (c: ConfirmRequest | null) => void;
  setSceneTip: (t: State['sceneTip']) => void;
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
  unlock: (id: AchievementId, silent?: boolean) => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
}

let toastId = 1;
let osReduced = prefersReducedMotion;

export const useStore = create<State>((set, get) => ({
  theme: (['bench', 'night'] as ThemeId[]).includes(readLS<ThemeId>(LS_THEME, 'bench')) ? readLS<ThemeId>(LS_THEME, 'bench') : 'bench',
  sound: false, // OFF by default, always
  simpleView: storedView ? storedView === 'simple' : !!simpleReason,
  webglOk: true,
  booted: readLS<boolean>(SS_BOOTED, false, 'session'),
  sceneReady: false,
  assetProgress: 0,
  section: 0,
  visited: [0],
  quality: isTouch || isSmall ? 1 : 2,
  reducedMotion: computeReducedMotion(initialPrefs.motion),
  gentleMotion: computeGentleMotion(initialPrefs.motion),
  prefs: initialPrefs,
  welcomeOpen: !storedView,
  simpleReason,
  helpOpen: false,
  tourOpen: false,
  tourSeen: readLS<boolean>(LS_TOUR, false),
  menuOpen: false,
  confirm: null,
  sceneTip: null,
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
    if (theme === 'night') get().unlock('night');
  },
  cycleTheme: () => {
    const i = THEME_ORDER.indexOf(get().theme);
    get().setTheme(THEME_ORDER[(i + 1) % THEME_ORDER.length]);
  },
  setSound: (sound) => {
    set({ sound });
    if (sound) get().unlock('sound');
  },
  setSimpleView: (simpleView) => {
    writeLS(LS_VIEW, simpleView ? 'simple' : '3d');
    set({ simpleView, welcomeOpen: false, menuOpen: false, sceneTip: null });
  },
  chooseView: (view) => get().setSimpleView(view === 'simple'),
  setPrefs: (p) => {
    const prefs = { ...get().prefs, ...p };
    writeLS(LS_PREFS, prefs);
    set({ prefs, reducedMotion: computeReducedMotion(prefs.motion, osReduced), gentleMotion: computeGentleMotion(prefs.motion, osReduced) });
  },
  setOsReducedMotion: (on) => {
    osReduced = on;
    set({ reducedMotion: computeReducedMotion(get().prefs.motion, on), gentleMotion: computeGentleMotion(get().prefs.motion, on) });
  },
  setHelp: (helpOpen) => set({ helpOpen, menuOpen: false }),
  setTour: (tourOpen) => {
    if (!tourOpen) writeLS(LS_TOUR, true);
    set({ tourOpen, menuOpen: false, helpOpen: false, ...(tourOpen ? {} : { tourSeen: true }) });
  },
  setMenu: (menuOpen) => set({ menuOpen }),
  askConfirm: (confirm) => set({ confirm }),
  setSceneTip: (sceneTip) => set({ sceneTip }),
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
  setPalette: (paletteOpen) => {
    set({ paletteOpen, terminalOpen: paletteOpen ? false : get().terminalOpen });
    if (paletteOpen) get().unlock('search');
  },
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
  unlock: (id, silent = false) => {
    const { achievements } = get();
    if (achievements.includes(id)) return;
    const next = [...achievements, id];
    writeLS(LS_ACH, next);
    set({ achievements: next });
    if (!silent) get().toast({ tone: 'achievement', title: ACHIEVEMENTS[id].label, body: ui.extras.toastBody(next.length, Object.keys(ACHIEVEMENTS).length) });
  },
  toast: (t) => {
    const id = toastId++;
    set({ toasts: [...get().toasts.slice(-3), { ...t, id }] });
    // long enough to read slowly; warnings stay until closed
    if (t.tone !== 'warn') window.setTimeout(() => get().dismissToast(id), 7000);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
