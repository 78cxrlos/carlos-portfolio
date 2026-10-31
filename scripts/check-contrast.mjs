/**
 * WCAG AA contrast check for both themes (normal and high contrast).
 * Runs before every build (`npm run build`) and on its own with
 * `npm run check:contrast`. Fails the build if any pair is below its target:
 *   4.5:1 for text, 3:1 for focus rings and other non-text UI.
 * Colors are read from src/lib/themes.ts, so editing a theme is checked automatically.
 */
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

const src = readFileSync(new URL('../src/lib/themes.ts', import.meta.url), 'utf8');
const { code } = transformSync(src, { loader: 'ts', format: 'esm' });
const { THEMES, HIGH_CONTRAST } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

const lum = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const rows = [];
const check = (group, name, fg, bg, min = 4.5) => rows.push({ group, name, fg, bg, min, r: ratio(fg, bg) });

for (const [id, base] of Object.entries(THEMES)) {
  for (const [mode, t] of [['normal', base], ['high contrast', { ...base, ...HIGH_CONTRAST[id] }]]) {
    const g = `${base.label} · ${mode}`;
    check(g, 'body text (ink on paper)', t.ink, t.surface);
    check(g, 'secondary text (muted on paper)', t.muted, t.surface);
    check(g, 'links / errors (accentText on paper)', t.accentText, t.surface);
    check(g, 'solid buttons (paper on ink)', t.surface, t.ink);
    check(g, 'text on the workbench (overlay on bg)', t.overlay, t.bg);
    check(g, 'focus ring (accentText on paper)', t.accentText, t.surface, 3);
  }
}
// Fixed colors used on the 3D board labels, boot screen and terminal (same in every theme).
check('Fixed', 'board labels / tooltips', '#121110', '#E9E4D8');
check('Fixed', 'board label secondary text', '#57514A', '#E9E4D8');
check('Fixed', 'board label accent', '#9C330A', '#E9E4D8');
check('Fixed', 'start-up screen text', '#E9E4D8', '#121110');
check('Fixed', 'accent buttons', '#121110', '#FF5A1F');
check('Fixed', 'terminal text', '#D8D2C4', '#161513');
check('Fixed', 'terminal system lines', '#A39C8E', '#161513');
check('Fixed', 'terminal title bar', '#B3AD9F', '#1E1C1A');
check('Fixed', 'terminal errors', '#FF8A5C', '#161513');

let failed = 0;
let group = '';
for (const r of rows) {
  if (r.group !== group) console.log(`\n${(group = r.group)}`);
  const ok = r.r >= r.min;
  if (!ok) failed++;
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${r.r.toFixed(2).padStart(5)}:1  (needs ${r.min}:1)  ${r.name}  ${r.fg} on ${r.bg}`);
}
console.log(`\nContrast check: ${rows.length - failed} of ${rows.length} pairs pass WCAG AA.`);
if (failed) process.exit(1);
