/**
 * FinancialForm - Form for creating/editing financial account entries
 */

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/constants/theme';
import { formStyles } from './formStyles';
import type { EntryFormProps } from '../registry';

const accountTypes = [
  'Checking',
  'Savings',
  'Retirement',
  'Investment',
  'Credit',
  'Loan',
  'Other',
] as const;

type AccountType = (typeof accountTypes)[number];

interface FinancialMetadata {
  institution: string;
  accountType: AccountType;
  accountNumber?: string;
  contactInfo?: string;
  notes?: string;
}

export function FinancialForm({
  taskKey,
  entryId,
  initialData,
  onSave,
  onDelete,
  onCancel,
  isSaving,
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;

  const initialMetadata = initialData?.metadata as FinancialMetadata | undefined;

  const [accountName, setAccountName] = useState(initialData?.title ?? '');
  const [institution, setInstitution] = useState(initialMetadata?.institution ?? '');
  const [accountType, setAccountType] = useState<AccountType>(
    initialMetadata?.accountType ?? 'Checking'
  );
  const [accountNumber, setAccountNumber] = useState(initialMetadata?.accountNumber ?? '');
  const [notes, setNotes] = useState(initialMetadata?.notes ?? initialData?.notes ?? '');

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

    const metadata: FinancialMetadata = {
      institution: institution.trim(),
      accountType,
      accountNumber: accountNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      await onSave({
        title: accountName.trim(),
        notes: notes.trim() || undefined,
        metadata: metadata as unknown as Record<string, unknown>,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save account';
      Alert.alert('Error', message);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete ${accountName || 'this account'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete();
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
      style={formStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={formStyles.scrollView}
        contentContainerStyle={[formStyles.content, { paddingBottom: insets.bottom + spacing.lg }]}
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

        <View style={formStyles.fieldContainer}>
          <Text style={formStyles.label}>Account Type</Text>
          <View style={formStyles.typeGrid}>
            {accountTypes.map((type) => (
              <Pressable
                key={type}
                style={[
                  formStyles.typeButton,
                  accountType === type && formStyles.typeButtonSelected,
                ]}
                onPress={() => setAccountType(type)}
              >
                <Text
                  style={[
                    formStyles.typeButtonText,
                    accountType === type && formStyles.typeButtonTextSelected,
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
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="number-pad"
          maxLength={4}
        />

        <TextArea
          label="Notes (Optional)"
          placeholder="Any additional details about this account"
          value={notes}
          onChangeText={setNotes}
        />

        <View style={formStyles.buttonContainer}>
          <Button
            title={isSaving ? 'Saving...' : 'Save'}
            onPress={handleSave}
            disabled={isSaving}
          />
        </View>

        {!isNew && onDelete && (
          <View style={formStyles.deleteContainer}>
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
