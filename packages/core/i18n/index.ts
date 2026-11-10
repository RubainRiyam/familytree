import { en, type MessageKey } from './en.ts';
import { ml } from './ml.ts';

export type Locale = 'en' | 'ml';
export type { MessageKey };
export const LOCALES: readonly Locale[] = ['en', 'ml'];
export const catalogs: Record<Locale, Record<MessageKey, string>> = { en, ml };

export type Params = Record<string, string | number>;

/** Fill {placeholders}. A missing parameter is left visible as {name} so it is caught in review. */
export function format(template: string, params: Params = {}): string {
  return template.replace(/\{(\w+)\}/g, (whole, k: string) => (k in params ? String(params[k]) : whole));
}

export function translate(locale: Locale, key: MessageKey, params?: Params): string {
  return format(catalogs[locale][key] ?? en[key], params);
}

/** Pick the app language from the device's preferred languages (BCP-47 tags), defaulting to English. */
export function pickLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const lang = tag.toLowerCase().split(/[-_]/)[0];
    if (lang === 'ml' || lang === 'en') return lang;
  }
  return 'en';
}

/** Placeholder names used in a template, sorted: lets tests check that translations keep them. */
export function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort();
}
