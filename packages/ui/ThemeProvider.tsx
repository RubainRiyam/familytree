import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { makeTheme, type Locale, type Scheme, type Theme } from './theme.ts';
// No extension: Metro only picks useScheme.web.ts for web when the import is extensionless.
import { useScheme } from './useScheme';

const ThemeContext = createContext<Theme>(makeTheme('light', 'en'));

export function ThemeProvider({ locale, scheme, children }: { locale: Locale; scheme?: Scheme; children: ReactNode }) {
  const system = useScheme();
  const resolved = scheme ?? system;
  const theme = useMemo(() => makeTheme(resolved, locale), [resolved, locale]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
