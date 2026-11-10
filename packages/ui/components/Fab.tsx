import { Pressable, View } from 'react-native';
import { useTheme } from '../ThemeProvider.tsx';
import { Button } from './Button.tsx';
import { Icon } from './Icon.tsx';
import { Text } from './Text.tsx';
import { defaultManner, type Manner } from './manner.ts';
import { useFocusRing } from './useFocusRing.ts';

/** Android's manjal extended floating button, always with its label. Place it bottom-right. */
export function Fab({ label, onPress, bottom = 16 }: { label: string; onPress: () => void; bottom?: number }) {
  const theme = useTheme();
  const { ring, focusProps } = useFocusRing();
  return (
    <View style={{ position: 'absolute', right: theme.space[4], bottom }} pointerEvents="box-none">
      <Pressable
        testID="fab"
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        {...focusProps}
        style={({ pressed }) => [
          { minHeight: theme.space.touch, paddingHorizontal: 20, borderRadius: theme.radius.pill, backgroundColor: theme.colors.manjal, flexDirection: 'row', alignItems: 'center', gap: theme.space[2], boxShadow: theme.shadow.float, opacity: pressed ? 0.85 : 1 },
          ring,
        ]}
      >
        <Icon name="plus" color="onManjal" />
        <Text variant="label" color="onManjal">{label}</Text>
      </Pressable>
    </View>
  );
}

/** "Add" in each platform's manners: a button in the content on iOS, the floating button on Android. */
export function AddAction({ label, onPress, manner = defaultManner, bottom }: { label: string; onPress: () => void; manner?: Manner; bottom?: number }) {
  return manner === 'android'
    ? <Fab label={label} onPress={onPress} bottom={bottom} />
    : <Button variant="secondary" icon="plus" label={label} onPress={onPress} />;
}
