import { Platform, Pressable } from 'react-native';
import { useT, useTheme } from '../ThemeProvider.tsx';
import { Text } from './Text.tsx';
import { useFocusRing } from './useFocusRing.ts';

/**
 * A fact to filter the family by ("Dubai 14"). Selected changes fill, text and border weight, so it
 * never relies on colour alone. Do not render a chip whose count is zero.
 */
export function FactChip({ label, count, selected, onPress, testID }: { label: string; count: number; selected: boolean; onPress: () => void; testID?: string }) {
  const theme = useTheme();
  const t = useT();
  const { ring, focusProps } = useFocusRing();
  const border = selected ? 4 : 2;
  return (
    <Pressable
      testID={testID}
      // "togglebutton" is native-only; on the web a toggle is role=button with aria-pressed.
      accessibilityRole={Platform.OS === 'web' ? 'button' : 'togglebutton'}
      accessibilityLabel={t('chip.count', { label, count })}
      accessibilityState={{ checked: selected }}
      aria-pressed={selected}
      onPress={onPress}
      {...focusProps}
      style={({ pressed }) => [
        {
          minHeight: theme.space.touch, paddingHorizontal: 22 - border, borderRadius: theme.radius.pill, borderWidth: border,
          borderColor: selected ? theme.colors.brand : theme.colors.lineStrong, backgroundColor: selected ? theme.colors.brandTint : theme.colors.surface,
          flexDirection: 'row', alignItems: 'center', gap: theme.space[2], opacity: pressed ? 0.85 : 1,
        },
        ring,
      ]}
    >
      <Text variant="label" color={selected ? 'brand' : 'ink'} style={{ flexShrink: 1 }}>{label}</Text>
      <Text variant="label" color={selected ? 'brand' : 'inkMuted'} style={{ fontFamily: theme.type('body').fontFamily }}>{String(count)}</Text>
    </Pressable>
  );
}
