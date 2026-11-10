import { Pressable, View } from 'react-native';
import { useT, useTheme } from '../ThemeProvider.tsx';
import type { MessageKey } from '@aalthara/core/i18n';
import { Icon, type IconName } from './Icon.tsx';
import { Text } from './Text.tsx';
import { defaultManner, type Manner } from './manner.ts';
import { useFocusRing } from './useFocusRing.ts';

/** How far tab labels may grow. Malayalam words are longer, so they get less room to grow. */
export const TAB_LABEL_MAX_SCALE = { en: 1.3, ml: 1.1 } as const;
export type TabKey = 'home' | 'tree' | 'find' | 'me';
export const TABS: { key: TabKey; icon: IconName; label: MessageKey }[] = [
  { key: 'home', icon: 'house', label: 'tab.home' },
  { key: 'tree', icon: 'tree-structure', label: 'tab.tree' },
  { key: 'find', icon: 'magnifying-glass', label: 'tab.find' },
  { key: 'me', icon: 'user', label: 'tab.me' },
];

type Props = {
  selected: TabKey;
  onSelect: (k: TabKey) => void;
  badges?: Partial<Record<TabKey, number>>;
  manner?: Manner;
  /** Safe-area bottom inset from the screen. */
  bottomInset?: number;
};

/** Always four tabs, always labelled. iOS: floating pill; Android: full-width bar on sunk. */
export function TabBar({ selected, onSelect, badges = {}, manner = defaultManner, bottomInset = 0 }: Props) {
  const theme = useTheme();
  const ios = manner === 'ios';
  return (
    <View
      accessibilityRole="tablist"
      style={
        ios
          ? {
              flexDirection: 'row', marginHorizontal: theme.space[4], marginBottom: Math.max(bottomInset, theme.space[4]), padding: 4,
              backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.line, boxShadow: theme.shadow.float,
            }
          : {
              flexDirection: 'row', paddingTop: 10, paddingBottom: 8 + bottomInset,
              backgroundColor: theme.colors.sunk, borderTopWidth: 1, borderColor: theme.colors.line,
            }
      }
    >
      {TABS.map((tab, i) => (
        <Tab key={tab.key} tab={tab} index={i} on={tab.key === selected} badge={badges[tab.key]} ios={ios} onPress={() => onSelect(tab.key)} />
      ))}
    </View>
  );
}

function Tab({ tab, index, on, badge, ios, onPress }: { tab: (typeof TABS)[number]; index: number; on: boolean; badge?: number; ios: boolean; onPress: () => void }) {
  const theme = useTheme();
  const t = useT();
  const { ring, focusProps } = useFocusRing();
  const name = t(tab.label);
  const label = [t('tab.label', { tab: name, index: index + 1, count: TABS.length }), badge ? t('tab.badge', { count: badge }) : null].filter(Boolean).join(', ');
  const fg = ios ? (on ? 'onBrand' : 'inkMuted') : on ? 'ink' : 'inkMuted';
  const iconColor = ios ? fg : on ? 'brand' : 'inkMuted';
  return (
    <Pressable
      testID={`tab-${tab.key}`}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      {...focusProps}
      style={[
        { flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
        ios ? { borderRadius: 18, backgroundColor: on ? theme.colors.brand : 'transparent' } : null,
        ring,
      ]}
    >
      <View style={[{ alignItems: 'center', justifyContent: 'center' }, ios ? null : { width: 68, height: 36, borderRadius: theme.radius.pill, backgroundColor: on ? theme.colors.brandTint : 'transparent' }]}>
        <Icon name={tab.icon} color={iconColor} />
        {badge ? (
          <View style={{ position: 'absolute', top: -4, right: ios ? -12 : 6, minWidth: 22, height: 22, paddingHorizontal: 5, borderRadius: 11, backgroundColor: theme.colors.manjal, alignItems: 'center', justifyContent: 'center' }}>
            <Text allowFontScaling={false} variant="caption" color="onManjal" style={{ fontSize: 15, lineHeight: 18, fontFamily: theme.type('label').fontFamily }}>
              {String(badge)}
            </Text>
          </View>
        ) : null}
      </View>
      {/* Tab labels are single fixed words in quarter-width tabs, so they cannot wrap: they grow to
          130% (English) or 110% (Malayalam) at most, as the system tab bars do, instead of the 160% every other text honours. */}
      <Text
        variant="caption"
        color={fg}
        maxFontSizeMultiplier={TAB_LABEL_MAX_SCALE[theme.locale]}
        style={{ fontFamily: theme.type('label').fontFamily, textAlign: 'center', fontSize: Math.round(15 * Math.min(theme.textScale, TAB_LABEL_MAX_SCALE[theme.locale])), lineHeight: Math.round(20 * Math.min(theme.textScale, TAB_LABEL_MAX_SCALE[theme.locale])) }}
      >
        {name}
      </Text>
    </Pressable>
  );
}
