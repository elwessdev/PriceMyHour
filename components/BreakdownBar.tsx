import { StyleSheet, Text, View } from 'react-native';

import { fontSize, radius, spacing, useTheme } from '@/constants/theme';
import type { Breakdown } from '@/lib/calc';
import { formatMoney, formatNumber, type CurrencySetting } from '@/lib/format';

interface BreakdownBarProps {
  /** Yearly amounts; displayed per month. */
  breakdown: Breakdown;
  currency: CurrencySetting;
}

const LABELS: Record<keyof Breakdown, string> = {
  net: 'Your net income',
  taxes: 'Taxes',
  expenses: 'Expenses',
  margin: 'Margin',
  platformFees: 'Platform fees',
};

const ORDER: (keyof Breakdown)[] = ['net', 'taxes', 'expenses', 'margin', 'platformFees'];

/** Horizontal stacked bar built from plain Views (no chart library). */
export function BreakdownBar({ breakdown, currency }: BreakdownBarProps) {
  const { colors } = useTheme();
  const total = ORDER.reduce((sum, k) => sum + Math.max(breakdown[k], 0), 0);
  const items = ORDER.map((key) => {
    const value = Math.max(breakdown[key], 0);
    return { key, value, share: total > 0 ? value / total : 0 };
  });

  return (
    <View>
      <View
        style={[styles.bar, { backgroundColor: colors.cardBorder }]}
        accessible
        accessibilityLabel={`Breakdown: ${items
          .map((i) => `${LABELS[i.key]} ${formatNumber(i.share * 100, 0)} percent`)
          .join(', ')}`}
      >
        {items
          .filter((i) => i.share > 0)
          .map((i) => (
            <View key={i.key} style={{ flex: i.share, backgroundColor: colors.segments[i.key] }} />
          ))}
      </View>

      <View style={styles.legend}>
        {items.map((i) => (
          <View key={i.key} style={styles.legendRow}>
            <View style={[styles.swatch, { backgroundColor: colors.segments[i.key] }]} />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]} numberOfLines={1}>
              {LABELS[i.key]}
            </Text>
            <Text style={[styles.legendPct, { color: colors.textSubtle }]}>
              {formatNumber(i.share * 100, 0)}%
            </Text>
            <Text style={[styles.legendValue, { color: colors.text }]} numberOfLines={1}>
              {formatMoney(i.value / 12, currency)}
              <Text style={{ color: colors.textSubtle, fontSize: fontSize.xs }}>/mo</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  legend: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendLabel: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  legendPct: {
    fontSize: fontSize.xs,
    width: 36,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  legendValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    minWidth: 96,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
