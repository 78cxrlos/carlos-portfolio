/**
 * PALETTE + THEMES
 *
 * One fixed material palette for the hardware (PALETTE) and two UI themes
 * that only change the paper/ink of the interface and how bright the desk
 * lamp is. The board itself never changes color.
 *
 *   Base      warm off-black #121110 · bone paper #E9E4D8 (never pure black/white)
 *   Board     PCB green #0F3B2E (+ lighter #16503E) · gold #C9A24B · copper #B8693A
 *   Accent    safety orange #FF5A1F — links, active states, one LED. Nothing else is bright.
 *
 * Every text/background pair is checked against WCAG AA by
 * scripts/check-contrast.mjs before each build.
 *
 * To tweak: change values here. CSS variables are written from the active
 * theme by useThemeSync (src/hooks/useTheme.ts); Tailwind maps them in
 * tailwind.config.js (bg-paper, text-ink, text-accent, border-rule, …).
 */
export type ThemeId = 'bench' | 'night';

export const PALETTE = {
  offBlack: '#121110',
  bone: '#E9E4D8',
  pcb: '#0F3B2E',
  pcbLight: '#16503E',
  gold: '#C9A24B',
  copper: '#B8693A',
  accent: '#FF5A1F',
  // material helpers (not UI colors)
  aluminum: '#A9A8A3',
  steel: '#8E9091',
  plastic: '#1B1A19',
  ceramic: '#B39A72',
  ferrite: '#3A3835',
  tape: '#D9CBA6',
  kapton: '#C9822E',
  sticky: '#E6D79A',
} as const;

export interface Theme {
  id: ThemeId;
  label: string;
  /** Page background (Simple View) and 3D clear/fog color — the workbench. */
  bg: string;
  /** Panel / sheet surface. */
  surface: string;
  /** Text on surfaces. */
  ink: string;
  /** Secondary text. */
  muted: string;
  /** Text drawn directly over the 3D scene. */
  overlay: string;
  /** Accent for fills, markers, the activity LED. */
  accent: string;
  /** Accent used for small text/links (contrast-checked against `surface`). */
  accentText: string;
  /** Scene lighting. */
  lamp: number;
  lampColor: string;
  fill: number;
  ambient: number;
  exposure: number;
  bench: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  bench: {
    id: 'bench',
    label: 'Light',
    bg: '#2B2621',
    surface: PALETTE.bone,
    ink: PALETTE.offBlack,
    muted: '#57514A', // 6.2:1 on bone
    overlay: PALETTE.bone,
    accent: PALETTE.accent,
    accentText: '#B33A0C', // 4.7:1 on bone
    lamp: 1150,
    lampColor: '#FFE2BC',
    fill: 0.55,
    ambient: 0.16,
    exposure: 1.0,
    bench: '#3A332C',
  },
  night: {
    id: 'night',
    label: 'Dark',
    bg: PALETTE.offBlack,
    surface: '#1C1A17',
    ink: PALETTE.bone,
    muted: '#A39C8E', // 6.4:1 on #1C1A17
    overlay: PALETTE.bone,
    accent: PALETTE.accent,
    accentText: '#FF7A45', // 6.7:1 on #1C1A17
    lamp: 760,
    lampColor: '#FFD09A',
    fill: 0.14,
    ambient: 0.05,
    exposure: 0.92,
    bench: '#1A1714',
  },
};

export const THEME_ORDER: ThemeId[] = ['bench', 'night'];

/** "High contrast" overrides: secondary text becomes full ink, accents get darker/lighter. */
export const HIGH_CONTRAST: Record<ThemeId, Partial<Theme>> = {
  bench: { surface: '#F7F4EC', ink: '#000000', muted: '#1F1D1A', accentText: '#8A2A05', bg: '#1E1A16' },
  night: { surface: '#000000', ink: '#FFFFFF', muted: '#E9E4D8', accentText: '#FFA37A', bg: '#000000' },
};

/** "#E9E4D8" -> "233 228 216" for `rgb(var(--x) / a)` in Tailwind. */
export function hexToRgbTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function resolveThemeId(name: string): ThemeId | null {
  const n = name.toLowerCase().trim();
  if (['bench', 'day', 'daylight', 'light', 'paper'].includes(n)) return 'bench';
  if (['night', 'night-shift', 'nightshift', 'dark'].includes(n)) return 'night';
  return null;
}
