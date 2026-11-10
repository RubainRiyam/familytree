import { Children, Fragment, type ReactNode } from 'react';
import { View } from 'react-native';
import { useTheme } from '../ThemeProvider.tsx';
import { defaultManner, type Manner } from './manner.ts';

/** A list of rows: inset rounded card on iOS, edge-to-edge rows with dividers on Android. */
export function ListGroup({ children, manner = defaultManner }: { children: ReactNode; manner?: Manner }) {
  const theme = useTheme();
  const items = Children.toArray(children);
  const divider = <View style={{ height: 1, backgroundColor: theme.colors.line, marginLeft: manner === 'ios' ? 84 : 0 }} />;
  return (
    <View
      style={
        manner === 'ios'
          ? { marginHorizontal: theme.space[4], backgroundColor: theme.colors.surface, borderColor: theme.colors.line, borderWidth: 1, borderRadius: theme.radius.md, overflow: 'hidden' }
          : { backgroundColor: theme.colors.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.line }
      }
    >
      {items.map((child, i) => (
        <Fragment key={i}>
          {i > 0 ? divider : null}
          {child}
        </Fragment>
      ))}
    </View>
  );
}
