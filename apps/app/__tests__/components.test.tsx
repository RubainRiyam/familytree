import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import {
  Button, ErrorState, FactChip, PersonDisc, PersonRow, Sheet, TabBar, TextField, ThemeProvider, type Locale,
} from '@aalthara/ui';

const wrap = (ui: ReactElement, locale: Locale = 'en') => render(<ThemeProvider locale={locale}>{ui}</ThemeProvider>);

test('Button calls onPress, and a disabled one does not and says why', async () => {
  const onPress = jest.fn();
  await wrap(<><Button label="Save" onPress={onPress} /><Button label="Send" onPress={onPress} disabled disabledReason="Add a name first." /></>);
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Add a name first.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
});

test('PersonDisc shows initials; Malayalam shows one cluster on small discs, two on the large one', async () => {
  await wrap(<><PersonDisc person={{ givenName: 'Saraswathi', houseName: 'Amma', branch: 'vazha' }} label="Saraswathi Amma" /><PersonDisc person={{ givenName: 'ശ്രീദേവി', houseName: 'കിഴക്കേതിൽ' }} /><PersonDisc size={96} person={{ givenName: 'ലീല', houseName: 'കിഴക്കേതിൽ' }} /></>);
  expect(screen.getByText('ലീകി', { includeHiddenElements: true })).toBeTruthy();
  expect(screen.getByText('SA')).toBeTruthy();
  // Decorative inside a row (hidden from screen readers), so look for it among hidden elements.
  expect(screen.getByText('ശ്രീ', { includeHiddenElements: true })).toBeTruthy();
  expect(screen.getByLabelText('Saraswathi Amma')).toBeTruthy();
});

test('PersonRow: opening the person and calling are separate, labelled actions', async () => {
  const onPress = jest.fn();
  const onCall = jest.fn();
  await wrap(<PersonRow person={{ displayName: 'Vinod Kizhakkethil', givenName: 'Vinod', houseName: 'Kizhakkethil', branch: 'kayal' }} relation="അനിയൻ · Younger brother" fact="Dubai" onPress={onPress} onCall={onCall} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Call Vinod Kizhakkethil' }));
  expect(onCall).toHaveBeenCalledTimes(1);
  expect(onPress).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Vinod Kizhakkethil, അനിയൻ · Younger brother, Dubai' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('FactChip states its count and selection', async () => {
  const onPress = jest.fn();
  await wrap(<FactChip label="Dubai" count={14} selected onPress={onPress} />);
  const chip = screen.getByLabelText('Dubai: 14 people');
  expect(chip.props.accessibilityRole).toBe('togglebutton');
  expect(chip.props.accessibilityState).toEqual({ checked: true });
  await fireEvent.press(chip);
  expect(onPress).toHaveBeenCalled();
});

test('TextField shows its error only after the person leaves the field, and keeps what was typed', async () => {
  const onChange = jest.fn();
  await wrap(<TextField label="Mobile number" value="98470 1234" onChangeText={onChange} helper="With country code." error="That number looks one digit short." />);
  const input = screen.getByLabelText('Mobile number');
  expect(screen.getByText('With country code.')).toBeTruthy();
  expect(screen.queryByText('That number looks one digit short.')).toBeNull();
  await fireEvent(input, 'focus');
  await fireEvent(input, 'blur');
  expect(screen.getByText('That number looks one digit short.')).toBeTruthy();
  expect(screen.queryByText('With country code.')).toBeNull();
  expect(input.props.value).toBe('98470 1234');
});

test.each(['ios', 'android'] as const)('TabBar (%s) has four labelled tabs and reports the chosen one', async (manner) => {
  const onSelect = jest.fn();
  await wrap(<TabBar manner={manner} selected="home" onSelect={onSelect} badges={{ home: 2 }} />);
  expect(screen.getAllByRole('tab')).toHaveLength(4);
  expect(screen.getByRole('tab', { name: 'Home, tab 1 of 4, 2 new' })).toBeSelected();
  await fireEvent.press(screen.getByRole('tab', { name: 'Find, tab 3 of 4' }));
  expect(onSelect).toHaveBeenCalledWith('find');
});

test('TabBar labels are Malayalam in Malayalam', async () => {
  await wrap(<TabBar selected="me" onSelect={() => {}} />, 'ml');
  for (const label of ['വീട്', 'വൃക്ഷം', 'തിരയുക', 'ഞാൻ']) expect(screen.getByText(label)).toBeTruthy();
});

test.each(['ios', 'android'] as const)('Sheet (%s) has a labelled Close and its one action', async (manner) => {
  const onClose = jest.fn();
  const onSave = jest.fn();
  await wrap(<Sheet manner={manner} visible title="Edit name" onClose={onClose} action={{ label: 'Save', onPress: onSave }}><></></Sheet>);
  expect(screen.getByText('Edit name')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onSave).toHaveBeenCalledTimes(1);
});

test('ErrorState offers Try again', async () => {
  const onRetry = jest.fn();
  await wrap(<ErrorState title="Couldn't load this." body="Check the internet connection, then try again." onRetry={onRetry} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(onRetry).toHaveBeenCalled();
});

test('PersonRow puts Call under the name at large text sizes', async () => {
  await render(
    <ThemeProvider locale="en" textScale={1.6}>
      <PersonRow person={{ displayName: 'Vinod Kizhakkethil', givenName: 'Vinod' }} onPress={() => {}} onCall={() => {}} />
    </ThemeProvider>,
  );
  const call = screen.getByRole('button', { name: 'Call Vinod Kizhakkethil' });
  expect(call).toHaveStyle({ marginLeft: 84 });
});
