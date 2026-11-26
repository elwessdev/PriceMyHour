import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { fontSize, radius, spacing, useTheme } from '@/constants/theme';
import { Button } from './ui';

interface SavePresetModalProps {
  visible: boolean;
  defaultName: string;
  onCancel: () => void;
  onSave: (name: string) => void;
}

export function SavePresetModal({ visible, defaultName, onCancel, onSave }: SavePresetModalProps) {
  const { colors } = useTheme();
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (visible) setName(defaultName);
  }, [visible, defaultName]);

  const submit = () => onSave(name.trim() || defaultName);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Close">
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => undefined}
            accessible={false}
          >
            <Text style={[styles.title, { color: colors.text }]}>Save as preset</Text>
            <Text style={[styles.label, { color: colors.textSubtle }]}>Preset name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={40}
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={submit}
              placeholder="e.g. Web design – Upwork"
              placeholderTextColor={colors.textSubtle}
              selectionColor={colors.primary}
              accessibilityLabel="Preset name"
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
              ]}
            />
            <View style={styles.actions}>
              <View style={styles.flex}>
                <Button label="Cancel" variant="secondary" onPress={onCancel} />
              </View>
              <View style={styles.flex}>
                <Button label="Save" onPress={submit} />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
    fontSize: fontSize.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
