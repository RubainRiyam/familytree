import Svg, { Path } from 'react-native-svg';
import { ICON_PATHS, type IconName } from '../icons.generated.ts';
import { useTheme } from '../ThemeProvider.tsx';
import type { ColorName } from '../theme.ts';

export type { IconName };

/** A Phosphor regular icon, 28px by default. Decorative: the control around it carries the label. */
export function Icon({ name, size = 28, color = 'ink' }: { name: IconName; size?: number; color?: ColorName }) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" fill={colors[color]} accessible={false} importantForAccessibility="no-hide-descendants">
      {ICON_PATHS[name].map((d, i) => <Path key={i} d={d} />)}
    </Svg>
  );
}
