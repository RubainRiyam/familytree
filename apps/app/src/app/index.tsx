import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@aalthara/ui';
import { useI18n } from '@/i18n';
import { publicConfig } from '@/config';

// Milestone 0: a blank, themed screen that proves fonts, tokens, both languages and env config.
export default function Welcome() {
  const theme = useTheme();
  const { t, locale, setLocale } = useI18n();
  const insets = useSafeAreaInsets();
  const other = locale === 'en' ? 'ml' : 'en';
  const status = publicConfig.ok
    ? t('status.serverReady')
    : publicConfig.reason === 'missing'
      ? t('status.serverMissing')
      : t('status.configError', { problem: publicConfig.problem });
  const c = theme.colors;
  const switchLabel = t('language.switchTo', { language: t(`language.${other}`) });

  return (
    <ScrollView
      style={{ backgroundColor: c.ground }}
      contentContainerStyle={[styles.page, { paddingTop: insets.top + theme.space[7], paddingBottom: insets.bottom + theme.space[5], paddingHorizontal: theme.space[4] }]}
    >
      <View style={styles.top}>
        <Image
          source={theme.scheme === 'dark' ? require('../../assets/images/mark-on-dark.png') : require('../../assets/images/mark.png')}
          style={styles.mark}
          accessibilityIgnoresInvertColors
          accessible={false}
        />
        <Text accessibilityRole="header" style={[theme.type('display'), { color: c.ink, textAlign: 'center' }]}>
          {t('app.name')}
        </Text>
        <Text style={[theme.type('bodyLg'), { color: c.ink, textAlign: 'center', marginTop: theme.space[2] }]}>
          {t('app.tagline')}
        </Text>
        <Text style={[theme.type('caption'), { color: c.inkMuted, textAlign: 'center', marginTop: theme.space[5] }]}>
          {status}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={switchLabel}
        onPress={() => setLocale(other)}
        style={({ pressed }) => [
          styles.button,
          { minHeight: theme.space.touch, borderRadius: theme.radius.pill, backgroundColor: c.brand, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={[theme.type('label'), { color: c.onBrand, textAlign: 'center' }]}>{switchLabel}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: 'space-between', gap: 32 },
  top: { alignItems: 'center' },
  mark: { width: 120, height: 120, marginBottom: 16 },
  button: { alignSelf: 'stretch', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 12 },
});
