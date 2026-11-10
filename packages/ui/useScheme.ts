import { useColorScheme } from 'react-native';
import type { Scheme } from './theme.ts';

export function useScheme(): Scheme {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}
