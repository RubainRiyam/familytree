import type { TextStyle } from 'react-native';
import { colors, radius, shadows, space, typeScale } from './theme.generated.ts';

export { colors, radius, shadows, space, typeScale };
export type Scheme = keyof typeof colors;
export type ColorName = keyof (typeof colors)['light'];
export type TypeStyle = keyof typeof typeScale;
export type Locale = 'en' | 'ml';

/** The six branch colours, in order. A branch stores one of these names. */
export const BRANCH_COLORS = ['chethi', 'vazha', 'kayal', 'mazha', 'chakka', 'kadalas'] as const;
export type BranchColor = (typeof BRANCH_COLORS)[number];
/** Text/initials colour to use on a branch fill (chakka takes on-manjal, the rest on-branch). */
export const onBranchColor = (b: BranchColor): ColorName => (b === 'chakka' ? 'onManjal' : 'onBranch');

/**
 * Font family names as registered with expo-font (see apps/app/src/fonts.ts). React Native has no
 * font fallback stack, so Malayalam UI text uses Anek Malayalam (one design for both scripts) while
 * English UI text uses Atkinson Hyperlegible Next. Never set fontWeight alongside a custom family:
 * Android then ignores the family.
 */
export const FONT_FILES = {
  display700: 'AnekMalayalam_700Bold',
  display800: 'AnekMalayalam_800ExtraBold',
  anek400: 'AnekMalayalam_400Regular',
  text400: 'AtkinsonHyperlegibleNext_400Regular',
  text700: 'AtkinsonHyperlegibleNext_700Bold',
} as const;

export function fontFamily(family: 'display' | 'text', weight: number, locale: Locale): string {
  if (family === 'display' || locale === 'ml') {
    if (weight >= 800 && family === 'display') return FONT_FILES.display800;
    return weight >= 600 ? FONT_FILES.display700 : FONT_FILES.anek400;
  }
  return weight >= 600 ? FONT_FILES.text700 : FONT_FILES.text400;
}

export type Theme = {
  scheme: Scheme;
  locale: Locale;
  colors: (typeof colors)[Scheme];
  shadow: (typeof shadows)[Scheme];
  space: typeof space;
  radius: typeof radius;
  /** In-app text size step (1, 1.25, 1.5), applied on top of the system font setting. */
  textScale: number;
  /** A ready-to-use text style for a type token. Sizes scale with the system font setting. */
  type: (style: TypeStyle) => TextStyle;
};

export function makeTheme(scheme: Scheme, locale: Locale, textScale = 1): Theme {
  const cache = {} as Record<TypeStyle, TextStyle>;
  return {
    scheme,
    locale,
    colors: colors[scheme],
    shadow: shadows[scheme],
    space,
    radius,
    textScale,
    type: (style) =>
      (cache[style] ??= (() => {
        const t = typeScale[style];
        // Malayalam glyphs sit taller; give them a little more line height so stacked marks never clip.
        const lineHeight = (locale === 'ml' ? t.lineHeight * 1.15 : t.lineHeight) * textScale;
        return { fontFamily: fontFamily(t.family, t.fontWeight, locale), fontSize: Math.round(t.fontSize * textScale), lineHeight: Math.round(lineHeight) };
      })()),
  };
}
