import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useT, useTheme } from '../ThemeProvider.tsx';
import { IconButton } from './Button.tsx';
import { Icon } from './Icon.tsx';
import { Text } from './Text.tsx';
import { defaultManner, type Manner } from './manner.ts';
import { useFocusRing } from './useFocusRing.ts';

type Props = {
  title: string;
  /** Show Back. On iOS it reads "‹ previous title". */
  onBack?: () => void;
  backTitle?: string;
  /** One trailing control, e.g. the family switcher chip on Android. */
  trailing?: ReactNode;
  manner?: Manner;
  topInset?: number;
};

/** iOS: large left-aligned title under a chevron-and-name Back. Android: top app bar with an arrow. */
export function AppBar({ title, onBack, backTitle, trailing, manner = defaultManner, topInset = 0 }: Props) {
  const theme = useTheme();
  const t = useT();
  if (manner === 'android') {
    return (
      <View style={{ paddingTop: topInset, backgroundColor: theme.colors.ground, flexDirection: 'row', alignItems: 'center', minHeight: 64 + topInset, paddingHorizontal: theme.space[1], gap: theme.space[1] }}>
        {onBack ? <IconButton icon="arrow-left" label={t('common.back')} onPress={onBack} testID="appbar-back" /> : <View style={{ width: theme.space[3] }} />}
        <Text variant="title2" accessibilityRole="header" style={{ flex: 1 }}>{title}</Text>
        {trailing ? <View style={{ marginRight: theme.space[3] }}>{trailing}</View> : null}
      </View>
    );
  }
  return (
    <View style={{ paddingTop: topInset, backgroundColor: theme.colors.ground, paddingHorizontal: theme.space[4], paddingBottom: theme.space[2] }}>
      <View style={{ minHeight: theme.space.touch, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {onBack ? <BackLink label={backTitle ?? t('common.back')} onPress={onBack} /> : <View />}
        {trailing}
      </View>
      <Text variant="title1" accessibilityRole="header">{title}</Text>
    </View>
  );
}

function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  const t = useT();
  const { ring, focusProps } = useFocusRing();
  return (
    <Pressable
      testID="appbar-back"
      accessibilityRole="button"
      accessibilityLabel={label === t('common.back') ? label : `${t('common.back')}, ${label}`}
      onPress={onPress}
      {...focusProps}
      style={({ pressed }) => [{ minHeight: theme.space.touch, minWidth: theme.space.touch, flexDirection: 'row', alignItems: 'center', marginLeft: -theme.space[2], opacity: pressed ? 0.6 : 1 }, ring]}
    >
      <Icon name="caret-left" color="brand" />
      <Text variant="label" color="brand">{label}</Text>
    </Pressable>
  );
}
