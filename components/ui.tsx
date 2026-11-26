import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { fontSize, radius, spacing, useTheme } from '@/constants/theme';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }, style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>{children}</Text>;
}

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  compact?: boolean;
  accessibilityHint?: string;
}

export function Button({ label, onPress, variant = 'primary', disabled, compact, accessibilityHint }: ButtonProps) {
  const { colors } = useTheme();
  const palette: Record<ButtonVariant, { bg: string; pressed: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: 'transparent', pressed: colors.primarySoft, fg: colors.primary, border: colors.primary },
    danger: { bg: 'transparent', pressed: colors.dangerSoft, fg: colors.danger, border: colors.danger },
  };
  const p = palette[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={accessibilityHint}
      hitSlop={compact ? 6 : 0}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: pressed ? p.pressed : p.bg, borderColor: p.border, opacity: disabled ? 0.45 : 1 },
      ]}
    >
      <Text style={[styles.buttonLabel, compact && styles.buttonLabelCompact, { color: p.fg }]}>{label}</Text>
    </Pressable>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : pressed ? colors.primarySoft : colors.inputBackground,
          borderColor: selected ? colors.primary : colors.inputBorder,
        },
      ]}
    >
      <Text style={[styles.chipLabel, { color: selected ? colors.onPrimary : colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

interface StatRowProps {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}

export function StatRow({ label, value, hint, emphasis }: StatRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.statRow}>
      <View style={styles.statLabelWrap}>
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
        {hint ? <Text style={[styles.statHint, { color: colors.textSubtle }]}>{hint}</Text> : null}
      </View>
      <Text
        style={[styles.statValue, { color: emphasis ? colors.primary : colors.text }, emphasis && styles.statValueEmphasis]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

export function Divider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  buttonLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  buttonLabelCompact: {
    fontSize: fontSize.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  statLabelWrap: {
    flexShrink: 1,
  },
  statLabel: {
    fontSize: fontSize.md,
  },
  statHint: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
    maxWidth: '60%',
    textAlign: 'right',
  },
  statValueEmphasis: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
});
