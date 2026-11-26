import type { ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontSize, spacing, useTheme } from '@/constants/theme';

interface ScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Set false for screens that render their own list (e.g. FlatList). */
  scroll?: boolean;
}

/**
 * Common screen shell: safe area, themed background, scrolling, keyboard
 * avoidance and "tap outside to dismiss the keyboard".
 */
export function Screen({ title, subtitle, children, scroll = true }: ScreenProps) {
  const { colors } = useTheme();

  const header = (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textSubtle }]}>{subtitle}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Pressable onPress={Keyboard.dismiss} accessible={false} style={styles.flexGrow}>
              {header}
              {children}
            </Pressable>
          </ScrollView>
        ) : (
          <Pressable onPress={Keyboard.dismiss} accessible={false} style={[styles.flex, styles.contentNoScroll]}>
            {header}
            {children}
          </Pressable>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  contentNoScroll: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
});
