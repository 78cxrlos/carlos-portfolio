/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Labels, data, annotations
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
        // Headlines + body
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Newsreader', 'Georgia', 'serif'],
        // Handwriting on tape / sticky notes
        hand: ['Caveat', 'cursive'],
      },
      colors: {
        // All UI colors come from CSS variables (src/lib/themes.ts -> useThemeSync)
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        overlay: 'rgb(var(--overlay) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-text': 'rgb(var(--accent-text) / <alpha-value>)',
        rule: 'rgb(var(--ink) / 0.22)',
        bone: '#E9E4D8',
        offblack: '#121110',
      },
      letterSpacing: {
        tightest: '-0.045em',
        caption: '0.14em',
      },
      boxShadow: {
        press: '2px 2px 0 0 rgb(var(--ink))',
        'press-sm': '1px 1px 0 0 rgb(var(--ink))',
        sheet: '0 1px 0 rgb(0 0 0 / 0.25), 0 18px 40px -24px rgb(0 0 0 / 0.6)',
      },
    },
  },
  plugins: [],
};
