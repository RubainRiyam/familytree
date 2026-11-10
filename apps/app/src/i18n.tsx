import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { getLocales } from 'expo-localization';
import { pickLocale, translate, type Locale, type MessageKey, type Params } from '@aalthara/core/i18n';

type I18n = { locale: Locale; setLocale: (l: Locale) => void; t: (key: MessageKey, params?: Params) => string };
const I18nContext = createContext<I18n | null>(null);

export function deviceLocale(): Locale {
  return pickLocale(getLocales().map((l) => l.languageTag));
}

// The saved language choice arrives with onboarding (milestone 2); until then, follow the device.
export function I18nProvider({ children, initial }: { children: ReactNode; initial?: Locale }) {
  const [locale, setLocale] = useState<Locale>(() => initial ?? deviceLocale());
  const t = useCallback((key: MessageKey, params?: Params) => translate(locale, key, params), [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(I18nContext);
  if (!v) throw new Error('useI18n outside I18nProvider');
  return v;
}
