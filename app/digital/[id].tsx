import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { useAppContext } from '@/data/store';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { DigitalAccount } from '@/data/types';

const importanceLevels: { value: DigitalAccount['importance']; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function DigitalAccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    getDigitalAccount,
    addDigitalAccount,
    updateDigitalAccount,
    deleteDigitalAccount,
  } = useAppContext();

  const isNew = id === 'new';
  const existing = isNew ? undefined : getDigitalAccount(id);

  const [accountName, setAccountName] = useState(existing?.accountName ?? '');
  const [platform, setPlatform] = useState(existing?.platform ?? '');
  const [username, setUsername] = useState(existing?.username ?? '');
  const [importance, setImportance] = useState<DigitalAccount['importance']>(
    existing?.importance ?? 'medium'
  );
  const [accessNotes, setAccessNotes] = useState(existing?.accessNotes ?? '');

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Account' : 'Edit Account',
    });
  }, [isNew, navigation]);

  const handleSave = () => {
    if (!accountName.trim()) {
      Alert.alert('Required Field', 'Please enter an account name.');
      return;
    }
    if (!platform.trim()) {
      Alert.alert('Required Field', 'Please enter a platform.');
      return;
    }

    const data: Omit<DigitalAccount, 'id'> = {
      accountName: accountName.trim(),
      platform: platform.trim(),
      username: username.trim() || undefined,
      importance,
      accessNotes: accessNotes.trim() || undefined,
    };

    if (isNew) {
      addDigitalAccount(data);
    } else {
      updateDigitalAccount(id, data);
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete ${accountName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDigitalAccount(id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Account Name"
          placeholder="e.g., Primary Email"
          value={accountName}
          onChangeText={setAccountName}
        />

        <Input
          label="Platform"
          placeholder="e.g., Gmail"
          value={platform}
          onChangeText={setPlatform}
        />

        <Input
          label="Username (Optional)"
          placeholder="e.g., firstname.lastname@gmail.com"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Importance</Text>
          <View style={styles.typeGrid}>
            {importanceLevels.map((level) => (
              <Pressable
                key={level.value}
                style={[
                  styles.typeButton,
                  importance === level.value && styles.typeButtonSelected,
                ]}
                onPress={() => setImportance(level.value)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    importance === level.value && styles.typeButtonTextSelected,
                  ]}
                >
                  {level.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TextArea
          label="Access Notes (Optional)"
          placeholder="How can your loved ones access this account?"
          value={accessNotes}
          onChangeText={setAccessNotes}
        />

        <View style={styles.buttonContainer}>
          <Button title="Save" onPress={handleSave} />
        </View>

        {!isNew && (
          <View style={styles.deleteContainer}>
            <Button
              title="Delete Account"
              variant="destructive"
              onPress={handleDelete}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  typeButtonTextSelected: {
    color: colors.surface,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  deleteContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
