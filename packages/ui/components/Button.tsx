import { Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '../ThemeProvider.tsx';
import type { ColorName } from '../theme.ts';
import { Icon, type IconName } from './Icon.tsx';
import { Text } from './Text.tsx';
import { useFocusRing } from './useFocusRing.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  /** Shown under a disabled button so nobody has to guess why it does nothing. */
  disabledReason?: string;
  fullWidth?: boolean;
  testID?: string;
};

const LOOK: Record<ButtonVariant, { bg: ColorName | null; fg: ColorName; border: ColorName | null }> = {
  primary: { bg: 'brand', fg: 'onBrand', border: null },
  secondary: { bg: 'surface', fg: 'brand', border: 'brand' },
  quiet: { bg: null, fg: 'ink', border: null },
  danger: { bg: 'surface', fg: 'chethi', border: 'chethi' },
};

/** A pill with a verb on it. One primary per screen, full width at the bottom on phones. */
export function Button({ label, onPress, variant = 'primary', icon, disabled, disabledReason, fullWidth, testID }: ButtonProps) {
  const theme = useTheme();
  const { ring, focusProps } = useFocusRing();
  const look = disabled ? { bg: 'sunk', fg: 'inkMuted', border: 'line' } as const : LOOK[variant];
  const box: ViewStyle = {
    minHeight: theme.space.touch,
    minWidth: theme.space.touch,
    paddingHorizontal: 28,
    paddingVertical: theme.space[2],
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: look.border ? theme.colors[look.border] : 'transparent',
    backgroundColor: look.bg ? theme.colors[look.bg] : 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
  };
  return (
    <View style={fullWidth ? { alignSelf: 'stretch' } : undefined}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={disabled ? disabledReason : undefined}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onPress}
        {...focusProps}
        style={({ pressed }) => [box, ring, { opacity: pressed ? 0.85 : 1 }]}
      >
        {icon ? <Icon name={icon} size={24} color={look.fg} /> : null}
        <Text
          variant="label"
          color={look.fg}
          style={[{ textAlign: 'center', flexShrink: 1 }, variant === 'quiet' && !disabled ? { textDecorationLine: 'underline' } : null]}
        >
          {label}
        </Text>
      </Pressable>
      {disabled && disabledReason ? (
        <Text variant="caption" color="inkMuted" style={{ marginTop: theme.space[2], textAlign: fullWidth ? 'center' : 'left' }}>
          {disabledReason}
        </Text>
      ) : null}
    </View>
  );
}

/** Icon-only button. Allowed for Back and Close only (DESIGN rule 2); the label is required. */
export function IconButton({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID?: string }) {
  const theme = useTheme();
  const { ring, focusProps } = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      {...focusProps}
      style={({ pressed }) => [
        { width: theme.space.touch, height: theme.space.touch, borderRadius: theme.radius.pill, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 },
        ring,
      ]}
    >
      <Icon name={icon} />
    </Pressable>
  );
}
