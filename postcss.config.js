/**
 * Readability: every `font-size: Npx` (including Tailwind's `text-[12px]`) is
 * rewritten to rem so the "Text size" control (which changes the root font
 * size) scales all text. Anything smaller than MIN_PX is raised to MIN_PX, so
 * no caption is ever too small to read.
 */
const MIN_PX = 14;

const remFontSizes = () => ({
  postcssPlugin: 'rem-font-sizes',
  Declaration: {
    'font-size': (decl) => {
      decl.value = decl.value.replace(/(\d*\.?\d+)px/g, (_, n) => `${Math.max(MIN_PX, parseFloat(n)) / 16}rem`);
    },
  },
});
remFontSizes.postcss = true;

export default {
  plugins: [(await import('tailwindcss')).default, remFontSizes, (await import('autoprefixer')).default],
};
