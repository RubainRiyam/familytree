import { useId, useState } from 'react';
import { TextInput, View, type KeyboardTypeOptions, type TextInputProps } from 'react-native';
import { useT, useTheme } from '../ThemeProvider.tsx';
import { Text } from './Text.tsx';

export type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  helper?: string;
  /** What to fix, in a sentence. Shown once the person has left the field (or with showError). */
  error?: string;
  showError?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  testID?: string;
};

/** A labelled input: label above (never a placeholder), 20px text, error replaces the helper. */
export function TextField({ label, value, onChangeText, helper, error, showError, keyboardType, autoComplete, textContentType, testID }: TextFieldProps) {
  const theme = useTheme();
  const t = useT();
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [left, setLeft] = useState(false);
  const errorVisible = !!error && (left || !!showError);
  const border = errorVisible ? theme.colors.chethi : focused ? theme.colors.focus : theme.colors.lineStrong;
  return (
    <View style={{ gap: theme.space[2], alignSelf: 'stretch' }}>
      <Text variant="label" nativeID={`${id}-label`}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setLeft(true); }}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        textContentType={textContentType}
        accessibilityLabel={label}
        accessibilityLabelledBy={`${id}-label`}
        accessibilityHint={errorVisible ? t('field.errorPrefix', { message: error }) : helper}
        aria-invalid={errorVisible}
        selectionColor={theme.colors.brand}
        style={[
          theme.type('bodyLg'),
          {
            minHeight: 60, paddingHorizontal: theme.space[4], paddingVertical: theme.space[3], borderRadius: theme.radius.md,
            borderWidth: focused || errorVisible ? 3 : 2, borderColor: border, backgroundColor: theme.colors.surface, color: theme.colors.ink,
          },
        ]}
      />
      {errorVisible ? (
        <Text variant="caption" accessibilityLiveRegion="polite" style={{ color: theme.colors.chethi, fontFamily: theme.type('label').fontFamily }}>
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" color="inkMuted">{helper}</Text>
      ) : null}
    </View>
  );
}
