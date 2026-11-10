import { View } from 'react-native';
import { useT, useTheme } from '../ThemeProvider.tsx';
import { Button } from './Button.tsx';
import { Icon, type IconName } from './Icon.tsx';
import { Text } from './Text.tsx';

/** Nothing to show yet: say so plainly, and offer the one thing to do about it. */
export function EmptyState({ title, body, action, icon = 'users-three' }: { title: string; body?: string; action?: { label: string; onPress: () => void }; icon?: IconName }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: theme.space[5], gap: theme.space[3] }}>
      <Icon name={icon} size={48} color="inkMuted" />
      <Text variant="title3" style={{ textAlign: 'center' }} accessibilityRole="header">{title}</Text>
      {body ? <Text variant="body" color="inkMuted" style={{ textAlign: 'center' }}>{body}</Text> : null}
      {action ? <Button variant="secondary" label={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}

/** Something failed: what happened, what to do, and a Try again button. Never auto-dismissed. */
export function ErrorState({ title, body, onRetry, retryLabel }: { title: string; body: string; onRetry?: () => void; retryLabel?: string }) {
  const theme = useTheme();
  const t = useT();
  return (
    <View accessibilityRole="alert" style={{ alignItems: 'center', padding: theme.space[5], gap: theme.space[3] }}>
      <Icon name="warning-circle" size={48} color="chethi" />
      <Text variant="title3" style={{ textAlign: 'center' }}>{title}</Text>
      <Text variant="body" color="inkMuted" style={{ textAlign: 'center' }}>{body}</Text>
      {onRetry ? <Button variant="secondary" label={retryLabel ?? t('common.tryAgain')} onPress={onRetry} /> : null}
    </View>
  );
}

/** A plain, permanent banner while offline. Screens keep working from the cache underneath. */
export function OfflineBanner({ message }: { message?: string }) {
  const theme = useTheme();
  const t = useT();
  return (
    <View
      accessibilityRole="summary"
      accessibilityLiveRegion="polite"
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3], padding: theme.space[3], paddingHorizontal: theme.space[4], backgroundColor: theme.colors.sunk, borderBottomWidth: 2, borderColor: theme.colors.lineStrong }}
    >
      <Icon name="wifi-slash" color="ink" />
      <Text variant="body" style={{ flex: 1 }}>{message ?? t('state.offline')}</Text>
    </View>
  );
}
