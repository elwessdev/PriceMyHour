import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppState } from '@/components/AppStateProvider';
import { BreakdownBar } from '@/components/BreakdownBar';
import { NumberField } from '@/components/NumberField';
import { SavePresetModal } from '@/components/SavePresetModal';
import { Screen } from '@/components/Screen';
import { Button, Card, Chip, ChipRow, Divider, fitFontSize, SectionTitle, StatRow } from '@/components/ui';
import { fontSize, radius, spacing, useTheme } from '@/constants/theme';
import type { RateField } from '@/lib/calc';
import { CURRENCIES, currencyFor, formatMoney, formatNumber, parseNumber } from '@/lib/format';

const PLATFORM_CHIPS = [
  { label: 'Upwork 10%', value: '10' },
  { label: 'Fiverr 20%', value: '20' },
  { label: 'Direct 0%', value: '0' },
] as const;

export default function CalculatorScreen() {
  const { colors } = useTheme();
  const { form, setField, currency, setCurrency, outcome, addPreset, presets, resetForm } = useAppState();
  const [modalOpen, setModalOpen] = useState(false);

  const errors = outcome.ok ? {} : outcome.errors;
  const result = outcome.ok ? outcome.result : null;
  const { symbol } = currencyFor(currency);
  const money = (n: number) => formatMoney(n, currency);
  const heroText = result ? money(result.hourlyRate) : '—';

  const field = (key: RateField) => ({
    value: form[key],
    onChangeText: (v: string) => setField(key, v),
    error: errors[key],
  });

  const onSave = (name: string) => {
    setModalOpen(false);
    if (addPreset(name)) {
      Alert.alert('Preset saved', `"${name}" is now in your Presets tab.`);
    }
  };

  return (
    <Screen title="Rate Calculator" subtitle="Find the minimum hourly rate that hits your income goal.">
      {/* Live headline result */}
      <View style={[styles.hero, { backgroundColor: result ? colors.primary : colors.cardBorder }]}>
        <Text style={[styles.heroLabel, { color: result ? colors.onPrimary : colors.textMuted }]}>
          Minimum hourly rate
        </Text>
        <Text
          style={[
            styles.heroValue,
            { color: result ? colors.onPrimary : colors.textMuted, fontSize: fitFontSize(heroText, fontSize.hero, 10) },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          accessibilityLiveRegion="polite"
        >
          {heroText}
        </Text>
        <Text style={[styles.heroSub, { color: result ? colors.onPrimary : colors.textMuted }]}>
          {result
            ? `${money(result.dailyRate)} per day · ${money(result.monthlyGross)} per month gross`
            : 'Fix the highlighted fields to see your rate.'}
        </Text>
      </View>

      <Card>
        <SectionTitle>Income goal</SectionTitle>
        <NumberField
          label="Target monthly net income"
          helper="What you want to take home each month, after tax."
          prefix={symbol}
          {...field('monthlyIncome')}
        />
        <Text style={[styles.inlineLabel, { color: colors.text }]}>Currency</Text>
        <ChipRow>
          {CURRENCIES.map((c) => (
            <Chip
              key={c.code}
              label={c.code === 'CUSTOM' ? 'Custom' : `${c.label} ${c.symbol}`}
              selected={currency.code === c.code}
              onPress={() => setCurrency({ ...currency, code: c.code })}
            />
          ))}
        </ChipRow>
        {currency.code === 'CUSTOM' ? (
          <TextInput
            value={currency.customSymbol}
            onChangeText={(t) => setCurrency({ ...currency, customSymbol: t.slice(0, 4) })}
            placeholder="Symbol, e.g. CHF or ₹"
            placeholderTextColor={colors.textSubtle}
            selectionColor={colors.primary}
            maxLength={4}
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel="Custom currency symbol"
            style={[
              styles.symbolInput,
              { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
            ]}
          />
        ) : null}
      </Card>

      <Card>
        <SectionTitle>Working time</SectionTitle>
        <NumberField label="Billable hours per day" helper="Hours you could bill on a working day." suffix="h" {...field('hoursPerDay')} />
        <NumberField label="Working days per week" helper="Usually 5." suffix="days" {...field('daysPerWeek')} />
        <NumberField
          label="Vacation & holiday days per year"
          helper="Public holidays, vacation and sick days."
          suffix="days"
          {...field('vacationDays')}
        />
        <NumberField
          label="Non-billable time"
          helper="Admin, proposals, learning, invoicing."
          suffix="%"
          {...field('nonBillablePct')}
        />
      </Card>

      <Card>
        <SectionTitle>Costs</SectionTitle>
        <NumberField label="Platform fee" helper="Taken from what the client pays." suffix="%" {...field('platformFeePct')}>
          <ChipRow>
            {PLATFORM_CHIPS.map((chip) => (
              <Chip
                key={chip.label}
                label={chip.label}
                selected={parseNumber(form.platformFeePct) === Number(chip.value)}
                onPress={() => setField('platformFeePct', chip.value)}
              />
            ))}
          </ChipRow>
        </NumberField>
        <NumberField label="Tax rate" helper="Your estimated effective income tax rate." suffix="%" {...field('taxPct')} />
        <NumberField
          label="Monthly business expenses"
          helper="Software, internet, equipment, insurance."
          prefix={symbol}
          {...field('monthlyExpenses')}
        />
        <NumberField
          label="Profit / safety margin"
          helper="A buffer for slow months and growth."
          suffix="%"
          {...field('marginPct')}
        />
      </Card>

      <Card>
        <SectionTitle>Results</SectionTitle>
        {result ? (
          <>
            <StatRow label="Minimum hourly rate" value={money(result.hourlyRate)} emphasis />
            <StatRow label="Daily rate" value={money(result.dailyRate)} hint={`${form.hoursPerDay} billable hours`} />
            <StatRow label="Monthly gross needed" value={money(result.monthlyGross)} hint="What clients pay you per month" />
            <StatRow
              label="Billable hours per year"
              value={formatNumber(result.billableHoursPerYear, 0)}
              hint={`${formatNumber(result.workingDaysPerYear, 0)} working days`}
            />
            <Divider />
            <Text style={[styles.inlineLabel, { color: colors.text }]}>Where each month's gross goes</Text>
            <BreakdownBar breakdown={result.breakdown} currency={currency} />
          </>
        ) : (
          <Text style={[styles.errorNote, { color: colors.danger }]}>
            Some inputs need attention. Results will appear as soon as every field is valid.
          </Text>
        )}
        <View style={styles.actions}>
          <Button
            label="Save as preset"
            onPress={() => setModalOpen(true)}
            disabled={!result}
            accessibilityHint="Saves these inputs so you can load them later"
          />
          <Button label="Reset to defaults" variant="secondary" onPress={resetForm} />
        </View>
      </Card>

      <SavePresetModal
        visible={modalOpen}
        defaultName={`Preset ${presets.length + 1}`}
        onCancel={() => setModalOpen(false)}
        onSave={onSave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    opacity: 0.9,
  },
  heroValue: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    letterSpacing: -1,
    marginVertical: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  heroSub: {
    fontSize: fontSize.sm,
    opacity: 0.9,
    lineHeight: 20,
  },
  inlineLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  symbolInput: {
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
    fontSize: fontSize.md,
  },
  errorNote: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
});
