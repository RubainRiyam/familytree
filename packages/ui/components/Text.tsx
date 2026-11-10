import { Text as RNText, type TextProps } from 'react-native';
import { useTheme } from '../ThemeProvider.tsx';
import type { ColorName, TypeStyle } from '../theme.ts';

export type AppTextProps = TextProps & { variant?: TypeStyle; color?: ColorName };

/** Text in a type token and colour token. Names and labels wrap; never pass numberOfLines for a name. */
export function Text({ variant = 'body', color = 'ink', style, ...rest }: AppTextProps) {
  const theme = useTheme();
  return <RNText {...rest} style={[theme.type(variant), { color: theme.colors[color] }, style]} />;
}
