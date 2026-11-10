import { useState } from 'react';
import type { ViewStyle } from 'react-native';
import { useTheme } from '../ThemeProvider.tsx';

/** A 3px focus ring, offset 2px, for keyboard and switch-access users (DESIGN rule 6). */
export function useFocusRing() {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const ring: ViewStyle | undefined = focused
    ? { outlineColor: colors.focus, outlineWidth: 3, outlineStyle: 'solid', outlineOffset: 2 }
    : undefined;
  return { ring, focusProps: { onFocus: () => setFocused(true), onBlur: () => setFocused(false) } };
}
