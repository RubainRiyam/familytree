// Turns a chain of parent / child / spouse steps (from relation_path, or the same walk done
// on the device) into a kinship term in English and Malayalam.
//
// The Malayalam terms are the widely shared defaults. Usage differs between communities and
// regions (വല്യച്ഛൻ / പേരപ്പൻ / മൂത്താപ്പ …), so every family can override any key in
// Family settings › Relation words; pass those overrides in as the third argument.

export type Gender = 'female' | 'male' | 'other' | 'unknown';
export type Step = { step: 'parent' | 'child' | 'spouse'; gender: Gender; birthYear?: number };
export type KinTerm = { key: string; en: string; ml?: string };

const BASE: Record<string, [en: string, ml?: string]> = {
  F: ['Father', 'അച്ഛൻ'], M: ['Mother', 'അമ്മ'], P: ['Parent'],
  S: ['Son', 'മകൻ'], D: ['Daughter', 'മകൾ'], C: ['Child'],
  H: ['Husband', 'ഭർത്താവ്'], W: ['Wife', 'ഭാര്യ'], X: ['Partner'],
  eB: ['Elder brother', 'ചേട്ടൻ'], yB: ['Younger brother', 'അനിയൻ'], B: ['Brother', 'സഹോദരൻ'],
  eZ: ['Elder sister', 'ചേച്ചി'], yZ: ['Younger sister', 'അനിയത്തി'], Z: ['Sister', 'സഹോദരി'],
  G: ['Brother or sister'],
};

const NAMED: Record<string, [en: string, ml?: string]> = {
  'F.F': ["Grandfather (father's side)", 'മുത്തച്ഛൻ'], 'M.F': ["Grandfather (mother's side)", 'മുത്തച്ഛൻ'],
  'F.M': ["Grandmother (father's side)", 'മുത്തശ്ശി'], 'M.M': ["Grandmother (mother's side)", 'മുത്തശ്ശി'],
  'S.S': ['Grandson', 'കൊച്ചുമകൻ'], 'D.S': ['Grandson', 'കൊച്ചുമകൻ'],
  'S.D': ['Granddaughter', 'കൊച്ചുമകൾ'], 'D.D': ['Granddaughter', 'കൊച്ചുമകൾ'],
  'M.B': ["Mother's brother", 'അമ്മാവൻ'],
  'M.eZ': ["Mother's elder sister", 'വല്യമ്മ'], 'M.yZ': ["Mother's younger sister", 'ചെറിയമ്മ'],
  'F.eB': ["Father's elder brother", 'വല്യച്ഛൻ'], 'F.yB': ["Father's younger brother", 'ചെറിയച്ഛൻ'],
  'F.Z': ["Father's sister", 'അമ്മായി'], 'M.B.W': ["Mother's brother's wife", 'അമ്മായി'],
  'H.F': ['Father-in-law', 'അമ്മായിയച്ഛൻ'], 'W.F': ['Father-in-law', 'അമ്മായിയച്ഛൻ'],
  'H.M': ['Mother-in-law', 'അമ്മായിയമ്മ'], 'W.M': ['Mother-in-law', 'അമ്മായിയമ്മ'],
  'S.W': ['Daughter-in-law', 'മരുമകൾ'], 'D.H': ['Son-in-law', 'മരുമകൻ'],
};

const pick = (g: Gender, male: string, female: string, other: string) =>
  g === 'male' ? male : g === 'female' ? female : other;

/** Collapse the raw steps into tokens: parent+child becomes a sibling, with elder/younger when birth years allow. */
export function tokens(self: { birthYear?: number }, path: Step[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const s = path[i]!;
    const next = path[i + 1];
    if (s.step === 'parent' && next?.step === 'child') {
      const ref = i === 0 ? self : path[i - 1]!;
      const age = ref.birthYear != null && next.birthYear != null && ref.birthYear !== next.birthYear
        ? (next.birthYear < ref.birthYear ? 'e' : 'y') : '';
      out.push(next.gender === 'male' ? age + 'B' : next.gender === 'female' ? age + 'Z' : 'G');
      i++;
    } else if (s.step === 'parent') out.push(pick(s.gender, 'F', 'M', 'P'));
    else if (s.step === 'child') out.push(pick(s.gender, 'S', 'D', 'C'));
    else out.push(pick(s.gender, 'H', 'W', 'X'));
  }
  return out;
}

export function kinTerm(self: { birthYear?: number }, path: Step[], overrides: Record<string, string> = {}): KinTerm {
  if (path.length === 0) return { key: '', en: 'You', ml: 'ഞാൻ' };
  const t = tokens(self, path);
  const key = t.join('.');
  const loose = t.map((x) => x.replace(/^[ey](?=[BZ]$)/, '')).join('.');   // M.eB → M.B
  const hit = NAMED[key] ?? NAMED[loose] ?? (t.length === 1 ? BASE[key] : undefined);
  const en = hit?.[0] ?? t.map((x, i) => {
    const word = BASE[x]![0];
    const w = i === 0 ? word : word.toLowerCase();
    return i < t.length - 1 ? w + "'s" : w;
  }).join(' ');
  return { key, en, ml: overrides[key] ?? overrides[loose] ?? hit?.[1] };
}
