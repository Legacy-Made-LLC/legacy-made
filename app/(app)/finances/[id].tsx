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
import type { FinancialAccount } from '@/data/types';

const accountTypes: FinancialAccount['accountType'][] = [
  'Checking',
  'Savings',
  'Retirement',
  'Investment',
  'Credit',
  'Loan',
  'Other',
];

export default function FinanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { getFinance, addFinance, updateFinance, deleteFinance } = useAppContext();

  const isNew = id === 'new';
  const existing = isNew ? undefined : getFinance(id);

  const [accountName, setAccountName] = useState(existing?.accountName ?? '');
  const [institution, setInstitution] = useState(existing?.institution ?? '');
  const [accountType, setAccountType] = useState<FinancialAccount['accountType']>(
    existing?.accountType ?? 'Checking'
  );
  const [accountNumberLast4, setAccountNumberLast4] = useState(existing?.accountNumberLast4 ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Account' : 'Edit Account',
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    if (!accountName.trim()) {
      Alert.alert('Required Field', 'Please enter an account name.');
      return;
    }
    if (!institution.trim()) {
      Alert.alert('Required Field', 'Please enter an institution.');
      return;
    }

    const data: Omit<FinancialAccount, 'id'> = {
      accountName: accountName.trim(),
      institution: institution.trim(),
      accountType,
      accountNumberLast4: accountNumberLast4.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    setIsSaving(true);
    try {
      if (isNew) {
        await addFinance(data);
      } else {
        await updateFinance(id, data);
      }
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save account';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
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
          onPress: async () => {
            try {
              await deleteFinance(id);
              router.back();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to delete account';
              Alert.alert('Error', message);
            }
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
          placeholder="e.g., Primary Checking"
          value={accountName}
          onChangeText={setAccountName}
        />

        <Input
          label="Institution"
          placeholder="e.g., Chase Bank"
          value={institution}
          onChangeText={setInstitution}
        />

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Account Type</Text>
          <View style={styles.typeGrid}>
            {accountTypes.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeButton,
                  accountType === type && styles.typeButtonSelected,
                ]}
                onPress={() => setAccountType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    accountType === type && styles.typeButtonTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Input
          label="Last 4 Digits (Optional)"
          placeholder="e.g., 4521"
          value={accountNumberLast4}
          onChangeText={setAccountNumberLast4}
          keyboardType="number-pad"
          maxLength={4}
        />

        <TextArea
          label="Notes (Optional)"
          placeholder="Any additional details about this account"
          value={notes}
          onChangeText={setNotes}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={isSaving ? 'Saving...' : 'Save'}
            onPress={handleSave}
            disabled={isSaving}
          />
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
