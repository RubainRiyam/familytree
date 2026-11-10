import { Platform } from 'react-native';

/** The two sets of platform manners in docs/DESIGN.md. Web and iPad follow iOS. */
export type Manner = 'ios' | 'android';
export const defaultManner: Manner = Platform.OS === 'android' ? 'android' : 'ios';
