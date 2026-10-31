import { useEffect } from 'react';
import { HIGH_CONTRAST, THEMES, hexToRgbTriplet, type Theme } from '../lib/themes';
import { TEXT_SCALES, useStore } from '../store/useStore';

/** Current theme object (re-renders on change). */
export function useTheme(): Theme {
  return THEMES[useStore((s) => s.theme)];
}

/** Writes the active palette, text size and contrast to <html>. Mount once. */
export function useThemeSync() {
  const base = useTheme();
  const highContrast = useStore((s) => s.prefs.highContrast);
  const textSize = useStore((s) => s.prefs.textSize);
  const gentle = useStore((s) => s.gentleMotion);
  const theme = highContrast ? { ...base, ...HIGH_CONTRAST[base.id] } : base;

  useEffect(() => {
    const root = document.documentElement;
    // every font-size in the CSS is in rem (see postcss.config.js), so this scales all text
    root.style.fontSize = `${(TEXT_SCALES[textSize] ?? 1) * 100}%`;
    root.dataset.contrast = highContrast ? 'high' : 'normal';
    // CSS animations follow the gentle setting; the 3D camera reads reducedMotion itself
    root.dataset.motion = gentle ? 'full' : 'reduce';
  }, [textSize, highContrast, gentle]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, highContrast]);
}
