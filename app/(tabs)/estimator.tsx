import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppState } from '@/components/AppStateProvider';
import { NumberField } from '@/components/NumberField';
import { Screen } from '@/components/Screen';
import { Button, Card, Divider, SectionTitle, StatRow } from '@/components/ui';
import { fontSize, radius, spacing, useTheme } from '@/constants/theme';
import { estimateProject } from '@/lib/calc';
import { formatMoney, formatNumber, parseNumber } from '@/lib/format';

export default function EstimatorScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { outcome, form, project, setProjectField, currency } = useAppState();
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const hourlyRate = outcome.ok ? outcome.result.hourlyRate : 0;
  const feePct = parseNumber(form.platformFeePct);
  // The buffer is optional: an empty field means no buffer.
  const bufferPct = project.bufferPct.trim() === '' ? 0 : parseNumber(project.bufferPct);
  const estimate = useMemo(
    () =>
      estimateProject({
        hours: parseNumber(project.hours),
        bufferPct,
        hourlyRate,
        platformFeePct: feePct,
      }),
    [project.hours, bufferPct, hourlyRate, feePct],
  );

  const money = (n: number) => formatMoney(n, currency);
  const errors = estimate.ok ? {} : estimate.errors;
  const result = estimate.ok && outcome.ok ? estimate.result : null;

  const copyQuote = async () => {
    if (!result) return;
    const lines = [
      'Project quote',
      `Estimated effort: ${formatNumber(result.bufferedHours, 1)} hours (incl. ${formatNumber(bufferPct, 0)}% buffer)`,
      `Hourly rate: ${money(hourlyRate)}`,
      `Fixed price: ${money(result.suggestedPrice)}`,
    ];
    try {
      await Clipboard.setStringAsync(lines.join('\n'));
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Screen title="Project Estimator" subtitle="Turn your hourly rate into a fixed project price.">
      <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }}>
        <Text style={[styles.rateLabel, { color: colors.textMuted }]}>Your current hourly rate</Text>
        {outcome.ok ? (
          <Text style={[styles.rateValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {money(hourlyRate)}
            <Text style={[styles.rateUnit, { color: colors.textMuted }]}> /h</Text>
          </Text>
        ) : (
          <View style={styles.noRate}>
            <Text style={[styles.noRateText, { color: colors.danger }]}>
              The calculator has invalid inputs, so there is no rate to use yet.
            </Text>
            <Button label="Open calculator" variant="secondary" compact onPress={() => router.navigate('/')} />
          </View>
        )}
      </Card>

      <Card>
        <SectionTitle>Project</SectionTitle>
        <NumberField
          label="Estimated hours"
          helper="Your best guess for the whole project."
          suffix="h"
          value={project.hours}
          onChangeText={(v) => setProjectField('hours', v)}
          error={errors.hours}
        />
        <NumberField
          label="Buffer (optional)"
          helper="Extra time for revisions, meetings and surprises."
          suffix="%"
          placeholder="0"
          value={project.bufferPct}
          onChangeText={(v) => setProjectField('bufferPct', v)}
          error={errors.bufferPct}
        />
      </Card>

      {result ? (
        <Card>
          <SectionTitle>Price</SectionTitle>
          <StatRow label="Hours incl. buffer" value={`${formatNumber(result.bufferedHours, 1)} h`} />
          <StatRow label="Project price" value={money(result.clientPays)} hint="Hours × hourly rate" />
          <Divider />
          <StatRow label="Client pays" value={money(result.clientPays)} />
          <StatRow
            label="Platform fee"
            value={`− ${money(result.platformFee)}`}
            hint={`${formatNumber(Number.isFinite(feePct) ? feePct : 0, 1)}% from the calculator`}
          />
          <StatRow label="You receive" value={money(result.youReceive)} emphasis />

          <View style={[styles.suggested, { backgroundColor: colors.primary }]}>
            <Text style={[styles.suggestedLabel, { color: colors.onPrimary }]}>Suggested fixed price</Text>
            <Text style={[styles.suggestedValue, { color: colors.onPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
              {money(result.suggestedPrice)}
            </Text>
            <Text style={[styles.suggestedSub, { color: colors.onPrimary }]}>
              You receive {money(result.suggestedYouReceive)} after fees
            </Text>
          </View>

          <Button label={copied ? 'Copied ✓' : 'Copy quote'} onPress={copyQuote} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rateLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  rateValue: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    marginTop: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  rateUnit: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  noRate: {
    marginTop: spacing.sm,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  noRateText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  suggested: {
    borderRadius: radius.md,
    padding: spacing.lg,
    marginVertical: spacing.lg,
  },
  suggestedLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  suggestedValue: {
    fontSize: 36,
    fontWeight: '800',
    marginVertical: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  suggestedSub: {
    fontSize: fontSize.sm,
    opacity: 0.9,
  },
});
