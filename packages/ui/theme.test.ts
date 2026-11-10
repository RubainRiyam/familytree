import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contrast } from './contrast.ts';
import { colors, typeScale, space } from './theme.generated.ts';
import { generate } from './scripts/gen-theme.ts';
import { fontFamily, makeTheme, BRANCH_COLORS, onBranchColor } from './theme.ts';

test('theme.generated.ts matches design/tokens.json', () => {
  const tokens = JSON.parse(readFileSync(new URL('../../design/tokens.json', import.meta.url), 'utf8'));
  assert.equal(readFileSync(new URL('./theme.generated.ts', import.meta.url), 'utf8'), generate(tokens));
});

// docs/DESIGN.md rule 6: text >= 4.5:1, the core trio >= 7:1, control borders >= 3:1.
for (const scheme of ['light', 'dark'] as const) {
  const c = colors[scheme];
  const check = (fg: keyof typeof c, bg: keyof typeof c, min: number) =>
    test(`${scheme}: ${fg} on ${bg} >= ${min}:1`, () => {
      const r = contrast(c[fg], c[bg]);
      assert.ok(r >= min, `${fg} on ${bg} is ${r.toFixed(2)}:1`);
    });
  for (const bg of ['ground', 'surface', 'sunk'] as const) {
    check('ink', bg, 7);
    check('inkMuted', bg, 4.5);
  }
  for (const bg of ['ground', 'surface'] as const) {
    check('brand', bg, 4.5);
    check('lineStrong', bg, 3);
    check('focus', bg, 3);
  }
  check('onBrand', 'brand', 4.5);
  check('brand', 'brandTint', 4.5);
  check('ink', 'brandTint', 4.5);
  check('onManjal', 'manjal', 4.5);
  for (const b of BRANCH_COLORS) check(onBranchColor(b), b, 4.5);
}

test('nothing under 15px and tap targets are 56px', () => {
  for (const [name, s] of Object.entries(typeScale)) assert.ok(s.fontSize >= 15, name);
  assert.equal(typeScale.body.fontSize, 18);
  assert.equal(space.touch, 56);
});

test('fonts: Malayalam UI text uses Anek, English uses Atkinson', () => {
  assert.equal(fontFamily('text', 400, 'en'), 'AtkinsonHyperlegibleNext_400Regular');
  assert.equal(fontFamily('text', 700, 'ml'), 'AnekMalayalam_700Bold');
  assert.equal(fontFamily('display', 800, 'en'), 'AnekMalayalam_800ExtraBold');
  const t = makeTheme('dark', 'en');
  assert.equal(t.colors.ground, '#0C1512');
  assert.deepEqual(t.type('body'), { fontFamily: 'AtkinsonHyperlegibleNext_400Regular', fontSize: 18, lineHeight: 28 });
  assert.equal(t.type('body'), t.type('body'), 'styles are cached');
});
