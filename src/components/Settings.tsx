import { useId } from 'react';
import { ui } from '../content/uiStrings';
import { THEMES, THEME_ORDER } from '../lib/themes';
import { TEXT_SCALES, useStore } from '../store/useStore';
import { playSound } from '../hooks/useSound';

/** On/off switch with its label written out — never colour alone. */
export function Switch({ label, note, checked, onChange }: { label: string; note?: string; checked: boolean; onChange: (on: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <label htmlFor={id} className="label">
          {label}
        </label>
        {note && (
          <p id={`${id}-note`} className="text-[15px] leading-snug text-muted">
            {note}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={note ? `${id}-note` : undefined}
        onClick={() => (onChange(!checked), playSound('click'))}
        className={`flex min-h-[44px] min-w-[96px] shrink-0 items-center gap-2 border-2 border-ink px-2 font-mono text-[15px] ${checked ? 'bg-ink text-surface' : 'bg-surface text-ink'}`}
      >
        <span aria-hidden className={`relative h-5 w-9 border-2 ${checked ? 'border-surface' : 'border-ink'}`}>
          <span className={`absolute top-0 h-full w-1/2 ${checked ? 'right-0 bg-surface' : 'left-0 bg-ink'}`} />
        </span>
        {checked ? ui.nav.on : ui.nav.off}
      </button>
    </div>
  );
}

/** A- / A / A+, high contrast, reduce motion. Choices persist (see store). */
export function AccessibilityControls() {
  const prefs = useStore((s) => s.prefs);
  const setPrefs = useStore((s) => s.setPrefs);
  const reduced = useStore((s) => s.reducedMotion);
  const size = prefs.textSize;
  const max = TEXT_SCALES.length - 1;
  const pct = Math.round((TEXT_SCALES[size] ?? 1) * 100);
  const sizeBtn = 'btn !px-3 min-w-[56px] text-[17px]';
  return (
    <div>
      <div className="py-2">
        <p className="label" id="text-size-label">
          {ui.a11y.textSize} <span className="font-normal text-muted">· {ui.a11y.current(pct)}</span>
        </p>
        <div className="mt-2 flex gap-2" role="group" aria-labelledby="text-size-label">
          <button type="button" className={sizeBtn} disabled={size <= 0} onClick={() => setPrefs({ textSize: Math.max(0, size - 1) })} aria-label={ui.a11y.smallerLabel}>
            {ui.a11y.smaller}
          </button>
          <button type="button" className={`${sizeBtn} ${size === 1 ? 'btn-solid' : ''}`} onClick={() => setPrefs({ textSize: 1 })} aria-label={ui.a11y.resetLabel} aria-pressed={size === 1}>
            {ui.a11y.reset}
          </button>
          <button type="button" className={`${sizeBtn} text-[20px]`} disabled={size >= max} onClick={() => setPrefs({ textSize: Math.min(max, size + 1) })} aria-label={ui.a11y.largerLabel}>
            {ui.a11y.larger}
          </button>
        </div>
      </div>
      <Switch label={ui.a11y.highContrast} note={ui.a11y.highContrastNote} checked={prefs.highContrast} onChange={(on) => setPrefs({ highContrast: on })} />
      <Switch label={ui.a11y.reduceMotion} note={ui.a11y.reduceMotionNote} checked={reduced} onChange={(on) => setPrefs({ motion: on ? 'reduce' : 'full' })} />
      <p className="mt-2 text-[15px] text-muted">{ui.a11y.saved}</p>
    </div>
  );
}

/** Light / Dark colours and sound on/off. */
export function ThemeSoundControls() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const sound = useStore((s) => s.sound);
  const setSound = useStore((s) => s.setSound);
  return (
    <div>
      <div className="py-2">
        <p className="label" id="theme-label">
          {ui.nav.themeHeading}
        </p>
        <div className="mt-2 flex gap-2" role="group" aria-labelledby="theme-label">
          {THEME_ORDER.map((id) => (
            <button key={id} type="button" aria-pressed={theme === id} className={`btn flex-1 ${theme === id ? 'btn-solid' : ''}`} onClick={() => (setTheme(id), playSound('click'))}>
              {THEMES[id].label}
            </button>
          ))}
        </div>
      </div>
      <Switch
        label={ui.nav.sound}
        checked={sound}
        onChange={(on) => {
          setSound(on);
          window.setTimeout(() => playSound('click'), 30);
        }}
      />
    </div>
  );
}
