import Constants from 'expo-constants';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button, Card, SectionTitle } from '@/components/ui';
import { fontSize, radius, spacing, useTheme } from '@/constants/theme';

const PRIVACY_URL = 'https://elwessdev.github.io/PriceMyHour/privacy-policy.html';

export default function AboutScreen() {
  const { colors } = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const openPrivacy = async () => {
    try {
      await Linking.openURL(PRIVACY_URL);
    } catch {
      Alert.alert('Could not open link', PRIVACY_URL);
    }
  };

  return (
    <Screen title="About">
      <Card style={styles.appCard}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoText}>$/h</Text>
        </View>
        <Text style={[styles.appName, { color: colors.text }]}>RateWise</Text>
        <Text style={[styles.tagline, { color: colors.textMuted }]}>Freelance rate calculator</Text>
        <Text style={[styles.version, { color: colors.textSubtle }]}>Version {version}</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Work out the hourly rate and project price you need after fees, taxes and expenses.
        </Text>
      </Card>

      <Card>
        <SectionTitle>Privacy</SectionTitle>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Everything you enter stays on this device. No accounts, no tracking, no ads and no internet
          connection required.
        </Text>
        <View style={styles.action}>
          <Button label="Privacy policy" variant="secondary" onPress={openPrivacy} />
        </View>
      </Card>

      <View style={[styles.disclaimer, { backgroundColor: colors.cardBorder }]}>
        <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
          Estimates only. Not financial or tax advice.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  appCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  appName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  tagline: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  version: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  description: {
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.md,
  },
  body: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  action: {
    marginTop: spacing.lg,
  },
  disclaimer: {
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  disclaimerText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});
