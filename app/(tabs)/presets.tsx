import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppState } from '@/components/AppStateProvider';
import { Screen } from '@/components/Screen';
import { Button, Card } from '@/components/ui';
import { fontSize, radius, spacing, useTheme } from '@/constants/theme';
import { formatDate, formatMoney } from '@/lib/format';
import type { Preset } from '@/lib/storage';

export default function PresetsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { presets, applyPreset, deletePreset } = useAppState();

  const load = (preset: Preset) => {
    applyPreset(preset);
    router.navigate('/');
  };

  const confirmDelete = (preset: Preset) => {
    Alert.alert('Delete preset?', `"${preset.name}" will be removed from this device.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePreset(preset.id) },
    ]);
  };

  return (
    <Screen title="Presets" subtitle="Tap a preset to load it into the calculator." scroll={false}>
      <FlatList
        data={presets}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Card>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No presets yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
              Set up your numbers in the Calculator and tap "Save as preset" to keep them here, e.g. one
              preset per platform or client type.
            </Text>
            <View style={styles.emptyAction}>
              <Button label="Go to calculator" variant="secondary" onPress={() => router.navigate('/')} />
            </View>
          </Card>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => load(item)}
            accessibilityRole="button"
            accessibilityLabel={`Load preset ${item.name}, ${formatMoney(item.hourlyRate, item.currency)} per hour`}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: pressed ? colors.primarySoft : colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.rowMain}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.date, { color: colors.textSubtle }]}>Saved {formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.rowSide}>
              <Text style={[styles.rate, { color: colors.primary }]} numberOfLines={1}>
                {formatMoney(item.hourlyRate, item.currency)}
                <Text style={[styles.rateUnit, { color: colors.textSubtle }]}>/h</Text>
              </Text>
              <Button label="Delete" variant="danger" compact onPress={() => confirmDelete(item)} />
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  rowMain: {
    flex: 1,
  },
  rowSide: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  date: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  rate: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  rateUnit: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: spacing.lg,
  },
});
