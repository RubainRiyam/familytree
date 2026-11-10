import { useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';
import type { Scheme } from './theme.ts';

const noop = () => () => {};
// The web build is pre-rendered to static HTML in light. React hydrates with the server snapshot
// (false) and then re-renders with the client one (true), so the switch to the system scheme
// happens right after hydration without a hydration mismatch.
export function useScheme(): Scheme {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const system = useColorScheme();
  return hydrated && system === 'dark' ? 'dark' : 'light';
}
