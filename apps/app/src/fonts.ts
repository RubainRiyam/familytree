// Fonts ship inside the app bundle (no network). Keys must match FONT_FILES in @aalthara/ui.
import {
  AnekMalayalam_400Regular,
  AnekMalayalam_700Bold,
  AnekMalayalam_800ExtraBold,
} from '@expo-google-fonts/anek-malayalam';
import {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible-next';
import type { FONT_FILES } from '@aalthara/ui';

export const fonts: Record<(typeof FONT_FILES)[keyof typeof FONT_FILES], number> = {
  AnekMalayalam_400Regular,
  AnekMalayalam_700Bold,
  AnekMalayalam_800ExtraBold,
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_700Bold,
};
