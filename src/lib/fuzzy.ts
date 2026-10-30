/**
 * Tiny fuzzy matcher: every query character must appear in order. Scores
 * reward consecutive runs, word-start hits and early matches. Returns -1
 * for no match.
 */
export function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase().replace(/\s+/g, '');
  const t = text.toLowerCase();
  if (!q) return 0;
  let score = 0;
  let ti = 0;
  let run = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    const found = t.indexOf(ch, ti);
    if (found === -1) return -1;
    const wordStart = found === 0 || /[\s\-_/·]/.test(t[found - 1]);
    run = found === ti ? run + 1 : 0;
    score += 1 + run * 3 + (wordStart ? 6 : 0) - Math.min(found - ti, 6) * 0.3;
    ti = found + 1;
  }
  if (t.startsWith(q)) score += 10;
  return score - t.length * 0.02;
}
