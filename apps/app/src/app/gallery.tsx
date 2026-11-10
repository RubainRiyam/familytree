import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AddAction, AppBar, Button, Card, EmptyState, ErrorState, FactChip, ListGroup, OfflineBanner, PersonDisc, PersonRow,
  Sheet, TabBar, Text, TextField, ThemeProvider, useTheme, type Manner, type Scheme, type TabKey,
} from '@aalthara/ui';
import { useI18n } from '@/i18n';
import { discBranches, sampleFacts, samplePeople } from '@/gallery-data';

const SCALES = [1, 1.3, 1.6];

/** Every design-system component, in both themes, both platform manners and at 160% text. */
export default function Gallery() {
  const { locale } = useI18n();
  const system = useTheme().scheme;
  // null = follow the system (resolved after web hydration), until someone toggles it.
  const [chosen, setScheme] = useState<Scheme | null>(null);
  const scheme = chosen ?? system;
  const [scale, setScale] = useState(1);
  const [manner, setManner] = useState<Manner>('ios');
  return (
    <ThemeProvider locale={locale} scheme={scheme} textScale={scale}>
      <Body scheme={scheme} setScheme={setScheme} scale={scale} setScale={setScale} manner={manner} setManner={setManner} />
    </ThemeProvider>
  );
}

function Body(p: { scheme: Scheme; setScheme: (s: Scheme) => void; scale: number; setScale: (n: number) => void; manner: Manner; setManner: (m: Manner) => void }) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale, setLocale } = useI18n();
  const [tab, setTab] = useState<TabKey>('home');
  const [chips, setChips] = useState<Record<string, boolean>>({ Dubai: true });
  const [name, setName] = useState('Saraswathi');
  const [phone, setPhone] = useState('98470 1234');
  const [sheet, setSheet] = useState(false);
  const [pressed, setPressed] = useState('');
  const other = locale === 'en' ? 'ml' : 'en';
  const nextScale = SCALES[(SCALES.indexOf(p.scale) + 1) % SCALES.length] ?? 1;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.ground }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + theme.space[6] }}>
        <AppBar title={t('gallery.title')} manner={p.manner} onBack={() => router.back()} backTitle={t('app.name')} topInset={insets.top} />
        <View style={{ paddingHorizontal: theme.space[4], gap: theme.space[3] }}>
          <Button variant="secondary" fullWidth testID="toggle-theme" label={t('gallery.theme', { theme: t(p.scheme === 'light' ? 'gallery.themeLight' : 'gallery.themeDark') })} onPress={() => p.setScheme(p.scheme === 'light' ? 'dark' : 'light')} />
          <Button variant="secondary" fullWidth testID="toggle-scale" label={t('gallery.textSize', { percent: Math.round(p.scale * 100) })} onPress={() => p.setScale(nextScale)} />
          <Button variant="secondary" fullWidth testID="toggle-manner" label={t('gallery.manner', { manner: p.manner === 'ios' ? 'iOS' : 'Android' })} onPress={() => p.setManner(p.manner === 'ios' ? 'android' : 'ios')} />
          <Button variant="secondary" fullWidth testID="toggle-language" label={t('language.switchTo', { language: t(`language.${other}`) })} onPress={() => setLocale(other)} />
        </View>

        <Section title={t('gallery.buttons')}>
          <Button label={t('common.save')} onPress={() => setPressed('save')} fullWidth />
          <Button variant="secondary" icon="plus" label={t('common.addRelative')} onPress={() => setPressed('add')} />
          <Button variant="quiet" label={t('common.notNow')} onPress={() => setPressed('quiet')} />
          <Button variant="danger" label={t('gallery.removeFromFamily')} onPress={() => setPressed('danger')} />
          <Button label={t('common.save')} onPress={() => {}} disabled disabledReason={t('gallery.fieldNameHelp')} />
          {pressed ? <Text variant="caption" color="inkMuted">{pressed}</Text> : null}
        </Section>

        <Section title={t('gallery.people')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[3], alignItems: 'flex-end' }}>
            <PersonDisc person={{ givenName: 'Saraswathi', houseName: 'Amma', branch: 'vazha' }} size={96} label="Saraswathi Amma" />
            {discBranches.map((b, i) => <PersonDisc key={b} person={{ givenName: samplePeople[i % 4]?.givenName ?? 'A', houseName: samplePeople[i % 4]?.houseName, branch: b }} />)}
            <PersonDisc person={{ givenName: 'Anand', houseName: 'Kizhakkethil', branch: 'vazha' }} you />
            <PersonDisc person={{ givenName: 'Raghavan', houseName: 'Kizhakkethil', isDeceased: true }} />
            <PersonDisc person={{ givenName: 'Thomas', houseName: 'Pulickal', branch: 'kayal' }} size={40} />
          </View>
        </Section>
        <ListGroup manner={p.manner}>
          {samplePeople.map((person, i) => (
            <PersonRow key={person.id} person={person} relation={person.relation} fact={person.fact} onPress={() => setPressed(person.id)} onCall={i === 1 ? () => setPressed('call') : undefined} />
          ))}
        </ListGroup>

        <Section title={t('gallery.fields')}>
          <TextField label={t('gallery.fieldName')} helper={t('gallery.fieldNameHelp')} value={name} onChangeText={setName} />
          <TextField label={t('gallery.fieldPhone')} keyboardType="phone-pad" value={phone} onChangeText={setPhone} error={t('gallery.fieldPhoneError')} showError />
        </Section>

        <Section title={t('gallery.chips')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] }}>
            {sampleFacts.map((f) => <FactChip key={f.label} label={f.label} count={f.count} selected={!!chips[f.label]} onPress={() => setChips((c) => ({ ...c, [f.label]: !c[f.label] }))} />)}
          </View>
        </Section>

        <Section title={t('gallery.cards')}>
          <Card title={t('gallery.cardTitle')}><Text>{t('gallery.cardBody')}</Text></Card>
          <Card feature title={t('gallery.familyName')}><Text color="inkMuted">{t('app.tagline')}</Text></Card>
        </Section>

        <Section title={t('gallery.nav')}>
          <AppBar title={t('gallery.familyName')} manner="ios" onBack={() => {}} backTitle={t('tab.home')} />
          <AppBar title={t('gallery.familyName')} manner="android" onBack={() => {}} />
          <TabBar manner="ios" selected={tab} onSelect={setTab} badges={{ home: 2 }} />
          <TabBar manner="android" selected={tab} onSelect={setTab} badges={{ home: 2 }} />
          <View style={{ minHeight: 96, justifyContent: 'center' }}>
            <AddAction manner={p.manner} label={t('common.addRelative')} onPress={() => setPressed('add')} />
          </View>
        </Section>

        <Section title={t('gallery.sheets')}>
          <Button variant="secondary" label={t('gallery.openSheet')} onPress={() => setSheet(true)} testID="open-sheet" />
        </Section>

        <Section title={t('gallery.states')}>
          <OfflineBanner />
          <Card><EmptyState title={t('state.empty.title')} body={t('state.empty.body')} /></Card>
          <Card><ErrorState title={t('state.error.title')} body={t('state.error.body')} onRetry={() => setPressed('retry')} /></Card>
        </Section>
      </ScrollView>
      <Sheet manner={p.manner} visible={sheet} title={t('gallery.fieldName')} onClose={() => setSheet(false)} action={{ label: t('common.save'), onPress: () => setSheet(false) }} insets={insets}>
        <Text>{t('gallery.sheetBody')}</Text>
        <TextField label={t('gallery.fieldName')} value={name} onChangeText={setName} />
      </Sheet>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ paddingHorizontal: theme.space[4], paddingTop: theme.space[6], gap: theme.space[3] }}>
      <Text variant="title2" accessibilityRole="header">{title}</Text>
      {children}
    </View>
  );
}
