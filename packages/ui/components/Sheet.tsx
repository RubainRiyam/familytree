import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Modal, Pressable, ScrollView, View } from 'react-native';
import { useT, useTheme } from '../ThemeProvider.tsx';
import { Button, IconButton } from './Button.tsx';
import { Text } from './Text.tsx';
import { defaultManner, type Manner } from './manner.ts';
import { useFocusRing } from './useFocusRing.ts';
import { useReduceMotion } from './useReduceMotion.ts';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** The one action ("Save"). iOS: full-width button at the bottom; Android: in the top bar. */
  action?: { label: string; onPress: () => void; disabled?: boolean };
  children: ReactNode;
  manner?: Manner;
  insets?: { top: number; bottom: number };
};

/** Forms: a bottom sheet with a grabber on iOS, a full-screen dialog (Close left, Save right) on Android. */
export function Sheet({ manner = defaultManner, ...p }: Props) {
  return manner === 'android' ? <FullScreenDialog {...p} /> : <BottomSheet {...p} />;
}

function BottomSheet({ visible, title, onClose, action, children, insets = { top: 0, bottom: 0 } }: Omit<Props, 'manner'>) {
  const theme = useTheme();
  const t = useT();
  const reduce = useReduceMotion();
  const [enter] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!visible) return;
    enter.setValue(reduce ? 1 : 0);
    if (!reduce) Animated.timing(enter, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [visible, reduce, enter]);
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* The backdrop is a shortcut; the labelled Close button is the way out. */}
        <Pressable accessible={false} onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
        <Animated.View
          accessibilityViewIsModal
          style={{
            maxHeight: '92%', marginTop: insets.top + theme.space[5], backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg, boxShadow: theme.shadow.float,
            paddingBottom: insets.bottom + theme.space[4], opacity: enter,
            transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: theme.space[2] }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: theme.colors.lineStrong }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: theme.space[4], paddingRight: theme.space[2] }}>
            <Text variant="title2" accessibilityRole="header" style={{ flex: 1 }}>{title}</Text>
            <IconButton icon="x" label={t('common.close')} onPress={onClose} testID="sheet-close" />
          </View>
          <ScrollView contentContainerStyle={{ padding: theme.space[4], gap: theme.space[4] }}>{children}</ScrollView>
          {action ? (
            <View style={{ paddingHorizontal: theme.space[4] }}>
              <Button fullWidth label={action.label} onPress={action.onPress} disabled={action.disabled} testID="sheet-action" />
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

function FullScreenDialog({ visible, title, onClose, action, children, insets = { top: 0, bottom: 0 } }: Omit<Props, 'manner'>) {
  const theme = useTheme();
  const t = useT();
  const save = useFocusRing();
  return (
    <Modal visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: theme.colors.ground, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingHorizontal: theme.space[1], gap: theme.space[1] }}>
          <IconButton icon="x" label={t('common.close')} onPress={onClose} testID="sheet-close" />
          <Text variant="title2" accessibilityRole="header" style={{ flex: 1 }}>{title}</Text>
          {action ? (
            <Pressable
              testID="sheet-action"
              accessibilityRole="button"
              accessibilityLabel={action.label}
              accessibilityState={{ disabled: !!action.disabled }}
              disabled={action.disabled}
              onPress={action.onPress}
              {...save.focusProps}
              style={({ pressed }) => [{ minHeight: theme.space.touch, minWidth: theme.space.touch, paddingHorizontal: theme.space[4], justifyContent: 'center', opacity: pressed ? 0.6 : 1 }, save.ring]}
            >
              <Text variant="label" color={action.disabled ? 'inkMuted' : 'brand'}>{action.label}</Text>
            </Pressable>
          ) : null}
        </View>
        <ScrollView contentContainerStyle={{ padding: theme.space[4], gap: theme.space[4] }}>{children}</ScrollView>
      </View>
    </Modal>
  );
}
