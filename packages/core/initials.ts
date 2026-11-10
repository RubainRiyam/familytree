// Two initials for a person disc: the first letter of the given name and of the house name.
// Malayalam letters are often several code points (consonant + vowel sign, or a conjunct joined
// by the virama, e.g. ശ്രീ), so take the whole first syllable cluster, not the first code point.
// Hand-rolled rather than Intl.Segmenter, which Hermes does not reliably provide.

const MARK = /[̀-ͯഀ-ഃ഻഼ാ-ൌൗൢൣ‌‍]/;
const VIRAMA = '്';

export function firstCluster(word: string): string {
  const chars = [...word.trim()];
  if (!chars.length) return '';
  let out = chars[0] ?? '';
  for (let i = 1; i < chars.length; i++) {
    const c = chars[i] ?? '';
    if (MARK.test(c)) { out += c; continue; }
    if (c === VIRAMA) {
      out += c;
      const next = chars[i + 1];
      // virama + consonant continues a conjunct; virama + ZWJ is a chillu-style form
      if (next && /[ക-ഹ‍]/.test(next)) { out += next; i++; }
      continue;
    }
    break;
  }
  return /^[a-z]/.test(out) ? out.toUpperCase() : out;
}

export function initials(givenName: string, houseName?: string | null): string {
  const words = givenName.trim().split(/\s+/).filter(Boolean);
  const first = firstCluster(words[0] ?? '');
  const second = houseName?.trim() ? firstCluster(houseName) : words.length > 1 ? firstCluster(words[1] ?? '') : '';
  return (first + second) || '?';
}
