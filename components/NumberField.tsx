import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { fontSize, radius, spacing, useTheme } from '@/constants/theme';
import { sanitizeNumericInput } from '@/lib/format';

interface NumberFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  helper?: string;
  error?: string;
  /** Short unit shown before the value, e.g. a currency symbol. */
  prefix?: string;
  /** Short unit shown after the value, e.g. "%" or "h". */
  suffix?: string;
  placeholder?: string;
  /** Extra content under the input, e.g. quick-pick chips. */
  children?: ReactNode;
}

export function NumberField({
  label,
  value,
  onChangeText,
  helper,
  error,
  prefix,
  suffix,
  placeholder = '0',
  children,
}: NumberFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.inputBorder;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={[styles.inputRow, { backgroundColor: colors.inputBackground, borderColor }]}>
        {prefix ? <Text style={[styles.affix, { color: colors.textSubtle }]}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={(t) => onChangeText(sanitizeNumericInput(t))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="decimal-pad"
          inputMode="decimal"
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          maxLength={12}
          accessibilityLabel={label}
          accessibilityHint={helper}
          style={[styles.input, { color: colors.text }]}
        />
        {suffix ? <Text style={[styles.affix, { color: colors.textSubtle }]}>{suffix}</Text> : null}
      </View>
      {error ? (
        <Text style={[styles.helper, { color: colors.danger }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helper ? (
        <Text style={[styles.helper, { color: colors.textSubtle }]}>{helper}</Text>
      ) : null}
      {children ? <View style={styles.extra}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '500',
    paddingVertical: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  affix: {
    fontSize: fontSize.md,
    fontWeight: '600',
    paddingHorizontal: spacing.xs,
  },
  helper: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  extra: {
    marginTop: spacing.sm,
  },
});
