import { Pressable, View, useWindowDimensions } from 'react-native';
import { useT, useTheme } from '../ThemeProvider.tsx';
import { Icon } from './Icon.tsx';
import { PersonDisc, type DiscPerson } from './PersonDisc.tsx';
import { Text } from './Text.tsx';
import { useFocusRing } from './useFocusRing.ts';

export type PersonRowProps = {
  person: DiscPerson & { displayName: string };
  /** Kin term, Malayalam then English: "അമ്മാവൻ · Mother's brother". Falls back to the branch name. */
  relation?: string;
  /** One fact: place and work for the living, years for those who have died. */
  fact?: string;
  you?: boolean;
  onPress: () => void;
  /** When given, a labelled Call button is the one trailing action. */
  onCall?: () => void;
  testID?: string;
};

/**
 * One person in a list. The main area and the Call button are siblings, not nested, so screen
 * readers reach both.
 */
export function PersonRow({ person, relation, fact, you, onPress, onCall, testID }: PersonRowProps) {
  const theme = useTheme();
  const t = useT();
  const main = useFocusRing();
  const call = useFocusRing();
  // At large text sizes a trailing Call button squeezes names until words break; stack it below.
  const { fontScale } = useWindowDimensions();
  const stacked = !!onCall && fontScale * theme.textScale >= 1.3;
  const late = person.isDeceased ? t('person.late') : undefined;
  const label = [person.displayName, you ? t('person.you') : undefined, relation, fact, late].filter(Boolean).join(', ');
  return (
    <View style={stacked ? { minHeight: 80, paddingBottom: theme.space[3] } : { flexDirection: 'row', alignItems: 'center', minHeight: 80 }}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        {...main.focusProps}
        style={({ pressed }) => [
          { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.space[3], paddingVertical: theme.space[3], paddingHorizontal: theme.space[4], minHeight: 80, opacity: pressed ? 0.7 : 1 },
          main.ring,
        ]}
      >
        <PersonDisc person={person} size={56} you={you} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="title3">{person.displayName}</Text>
          {relation ? <Text variant="caption" color="inkMuted">{relation}</Text> : null}
          {fact ? <Text variant="caption" color="inkMuted">{fact}</Text> : null}
        </View>
        {onCall ? null : <Icon name="caret-right" size={24} color="inkMuted" />}
      </Pressable>
      {onCall ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.callName', { name: person.displayName })}
          onPress={onCall}
          {...call.focusProps}
          style={({ pressed }) => [
            {
              minWidth: theme.space.touch, minHeight: theme.space.touch, marginRight: theme.space[4], paddingHorizontal: theme.space[3],
              marginLeft: stacked ? 84 : 0, alignSelf: stacked ? 'flex-start' : 'auto',
              borderRadius: theme.radius.pill, borderWidth: 2, borderColor: theme.colors.brand, backgroundColor: theme.colors.surface,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.space[1], opacity: pressed ? 0.85 : 1,
            },
            call.ring,
          ]}
        >
          <Icon name="phone" size={24} color="brand" />
          <Text variant="label" color="brand">{t('common.call')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
