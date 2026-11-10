// Generates packages/ui/theme.generated.ts from design/tokens.json (the source of truth).
//   node packages/ui/scripts/gen-theme.ts          write the file
//   node packages/ui/scripts/gen-theme.ts --check  exit 1 if the file is out of date (CI)
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../../../', import.meta.url);
const out = new URL('packages/ui/theme.generated.ts', root);

type Tok = { name: string; value: string | { light: string; dark: string } };
type Style = { name: string; fontSize: string; lineHeight: string; fontWeight: number };
type Tokens = {
  color: { tokens: Tok[] };
  type: { groups: { family: 'display' | 'text'; styles: Style[] }[] };
  spacing: { tokens: Tok[] };
  radius: { tokens: Tok[] };
  shadow: { tokens: Tok[] };
};

export const camel = (s: string) => s.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const px = (v: string) => {
  const m = /^(\d+(?:\.\d+)?)px$/.exec(v);
  if (!m) throw new Error(`expected a px value, got ${v}`);
  return Number(m[1]);
};
const themed = (t: Tok, scheme: 'light' | 'dark') => (typeof t.value === 'string' ? t.value : t.value[scheme]);

export function generate(tokens: Tokens): string {
  const colors = (scheme: 'light' | 'dark') =>
    Object.fromEntries(tokens.color.tokens.map((t) => [camel(t.name), themed(t, scheme)]));
  const shadows = (scheme: 'light' | 'dark') =>
    Object.fromEntries(tokens.shadow.tokens.map((t) => [camel(t.name.replace(/^shadow-/, '')), themed(t, scheme)]));
  const space = Object.fromEntries(
    tokens.spacing.tokens.map((t) => [t.name === 'touch' ? 'touch' : t.name.replace('space-', ''), px(String(t.value))]),
  );
  const radius = Object.fromEntries(
    tokens.radius.tokens.map((t) => [t.name.replace('radius-', ''), px(String(t.value))]),
  );
  const type = Object.fromEntries(
    tokens.type.groups.flatMap((g) =>
      g.styles.map((s) => [
        camel(s.name),
        { family: g.family, fontSize: px(s.fontSize), lineHeight: px(s.lineHeight), fontWeight: s.fontWeight },
      ]),
    ),
  );
  const j = (v: unknown) => JSON.stringify(v, null, 2);
  return `// GENERATED from design/tokens.json by packages/ui/scripts/gen-theme.ts. Do not edit by hand.
export const colors = {
  light: ${j(colors('light')).replace(/\n/g, '\n  ')},
  dark: ${j(colors('dark')).replace(/\n/g, '\n  ')},
} as const;

export const shadows = {
  light: ${j(shadows('light')).replace(/\n/g, '\n  ')},
  dark: ${j(shadows('dark')).replace(/\n/g, '\n  ')},
} as const;

export const space = ${j(space)} as const;

export const radius = ${j(radius)} as const;

export const typeScale = ${j(type)} as const;
`;
}

if (import.meta.main) {
  const tokens = JSON.parse(readFileSync(new URL('design/tokens.json', root), 'utf8')) as Tokens;
  const next = generate(tokens);
  if (process.argv.includes('--check')) {
    let current = '';
    try { current = readFileSync(out, 'utf8'); } catch { /* missing counts as stale */ }
    if (current !== next) {
      console.error('packages/ui/theme.generated.ts is out of date. Run: pnpm gen:theme');
      process.exit(1);
    }
    console.log('theme.generated.ts is up to date');
  } else {
    writeFileSync(out, next);
    console.log('wrote packages/ui/theme.generated.ts');
  }
}
