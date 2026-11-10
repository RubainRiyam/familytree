import { View } from 'react-native';
import { Image } from 'expo-image';
import { firstCluster, initials } from '@aalthara/core/initials';
import { useTheme } from '../ThemeProvider.tsx';
import { onBranchColor, type BranchColor } from '../theme.ts';
import { Text } from './Text.tsx';

export type DiscSize = 40 | 56 | 96;
export type DiscPerson = {
  givenName: string;
  houseName?: string | null;
  branch?: BranchColor | null;
  photoUri?: string | null;
  isDeceased?: boolean;
};

const INITIALS_SIZE: Record<DiscSize, number> = { 40: 15, 56: 20, 96: 34 };

/**
 * A person: always a circle in their branch colour, with a photo or two initials. `you` adds the
 * manjal ring; someone who has died gets a sunk fill and muted initials. Decorative by default:
 * the row or screen around it names the person. Pass `label` when the disc stands alone.
 */
export function PersonDisc({ person, size = 56, you, label }: { person: DiscPerson; size?: DiscSize; you?: boolean; label?: string }) {
  const theme = useTheme();
  const late = !!person.isDeceased;
  const branch = person.branch ?? null;
  const fill = late ? theme.colors.sunk : branch ? theme.colors[branch] : theme.colors.brand;
  const fg = late ? theme.colors.inkMuted : branch ? theme.colors[onBranchColor(branch)] : theme.colors.onBrand;
  const disc = (
    <View
      style={{
        width: size, height: size, borderRadius: theme.radius.pill, backgroundColor: fill, overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center', borderWidth: late ? 2 : 0, borderColor: theme.colors.lineStrong,
      }}
    >
      {person.photoUri ? (
        <Image source={{ uri: person.photoUri }} style={{ width: size, height: size }} contentFit="cover" accessible={false} />
      ) : (() => {
        // Malayalam clusters are much wider than Latin capitals. Two fit only the 96 disc; smaller
        // discs show the first cluster at full size rather than shrinking text below 15px.
        const both = initials(person.givenName, person.houseName);
        const malayalam = /[\u0D00-\u0D7F]/.test(both);
        const text = malayalam && size < 96 ? firstCluster(person.givenName) || both : both;
        const fontSize = malayalam && size === 96 ? 24 : INITIALS_SIZE[size];
        return (
        // Initials sit in a fixed circle, so they do not scale with text size; the label carries the name.
        <Text
          allowFontScaling={false}
          variant="display"
          style={{ color: fg, fontSize, lineHeight: Math.round(fontSize * 1.4) }}
        >
          {text}
        </Text>
        );
      })()}
    </View>
  );
  const wrapped = you ? (
    <View style={{ padding: 4, borderRadius: theme.radius.pill, borderWidth: 4, borderColor: theme.colors.manjal }}>{disc}</View>
  ) : disc;
  return (
    <View
      accessible={!!label}
      accessibilityLabel={label}
      accessibilityRole={label ? 'image' : undefined}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    >
      {wrapped}
    </View>
  );
}
