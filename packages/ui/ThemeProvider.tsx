import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { translate, type MessageKey, type Params } from '@aalthara/core/i18n';
import { makeTheme, type Locale, type Scheme, type Theme } from './theme.ts';
// No extension: Metro only picks useScheme.web.ts for web when the import is extensionless.
import { useScheme } from './useScheme';

const ThemeContext = createContext<Theme>(makeTheme('light', 'en'));

export function ThemeProvider({ locale, scheme, textScale = 1, children }: { locale: Locale; scheme?: Scheme; textScale?: number; children: ReactNode }) {
  const system = useScheme();
  const resolved = scheme ?? system;
  const theme = useMemo(() => makeTheme(resolved, locale, textScale), [resolved, locale, textScale]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/** Strings for the components themselves (Back, Close, tab labels), in the theme's language. */
export function useT() {
  const { locale } = useTheme();
  return (key: MessageKey, params?: Params) => translate(locale, key, params);
}
