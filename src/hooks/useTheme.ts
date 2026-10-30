import { useEffect } from 'react';
import { THEMES, hexToRgbTriplet, type Theme } from '../lib/themes';
import { useStore } from '../store/useStore';

/** Current theme object (re-renders on change). */
export function useTheme(): Theme {
  return THEMES[useStore((s) => s.theme)];
}

/** Writes the active palette to CSS variables on <html>. Mount once. */
export function useThemeSync() {
  const theme = useTheme();
  useEffect(() => {
    const root = document.documentElement;
    const vars: Record<string, string> = {
      '--bg': theme.bg,
      '--surface': theme.surface,
      '--ink': theme.ink,
      '--muted': theme.muted,
      '--overlay': theme.overlay,
      '--accent': theme.accent,
      '--accent-text': theme.accentText,
    };
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, hexToRgbTriplet(v));
    root.dataset.theme = theme.id;
    root.style.colorScheme = theme.id === 'night' ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.bg);
  }, [theme]);
}
