import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@aalthara/ui';
import { fonts } from '@/fonts';
import { I18nProvider, useI18n } from '@/i18n';

SplashScreen.preventAutoHideAsync();

function Themed() {
  const { locale } = useI18n();
  return (
    <ThemeProvider locale={locale}>
      <Shell />
    </ThemeProvider>
  );
}

function Shell() {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.ground } }} />
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts(fonts);
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);
  // Fonts are local files and load in milliseconds; if they fail, carry on with system fonts.
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <Themed />
      </I18nProvider>
    </SafeAreaProvider>
  );
}
