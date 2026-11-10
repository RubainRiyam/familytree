import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTheme } from '../ThemeProvider.tsx';
import { Text } from './Text.tsx';

/** Surface with a line border, no shadow. `feature` cards use the larger radius. */
export function Card({ title, children, feature }: { title?: string; children?: ReactNode; feature?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface, borderColor: theme.colors.line, borderWidth: 1,
        borderRadius: feature ? theme.radius.lg : theme.radius.md, padding: theme.space[4], gap: theme.space[2],
      }}
    >
      {title ? <Text variant="title2" accessibilityRole="header">{title}</Text> : null}
      {children}
    </View>
  );
}
