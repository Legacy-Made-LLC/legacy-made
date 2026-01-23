/**
 * FinancialForm - Form for creating/editing financial account entries
 */

import React, { useEffect, useMemo } from 'react';
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
import { revalidateLogic, useForm } from '@tanstack/react-form';
import { FormInput, FormTextArea, financialSchema } from '@/components/forms';
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
  entryId,
  initialData,
  onSave,
  onDelete,
  isSaving,
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;

  const initialMetadata = initialData?.metadata as FinancialMetadata | undefined;

  const defaultValues = useMemo(
    () => ({
      accountName: initialData?.title ?? '',
      institution: initialMetadata?.institution ?? '',
      accountType: (initialMetadata?.accountType ?? 'Checking') as string,
      accountNumber: initialMetadata?.accountNumber ?? '',
      notes: initialMetadata?.notes ?? initialData?.notes ?? '',
    }),
    [initialData, initialMetadata]
  );

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: financialSchema,
    },
    onSubmit: async ({ value }) => {
      const metadata: FinancialMetadata = {
        institution: value.institution.trim(),
        accountType: value.accountType as AccountType,
        accountNumber: value.accountNumber.trim() || undefined,
        notes: value.notes.trim() || undefined,
      };

      try {
        await onSave({
          title: value.accountName.trim(),
          notes: value.notes.trim() || undefined,
          metadata: metadata as unknown as Record<string, unknown>,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save account';
        Alert.alert('Error', message);
      }
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Account' : 'Edit Account',
    });
  }, [isNew, navigation]);

  const handleDelete = () => {
    if (!onDelete) return;

    const accountName = form.getFieldValue('accountName');
    Alert.alert('Delete Account', `Are you sure you want to delete ${accountName || 'this account'}?`, [
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
    ]);
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
        <form.Field name="accountName">
          {(field) => (
            <FormInput
              field={field}
              label="Account Name"
              placeholder="e.g., Primary Checking"
            />
          )}
        </form.Field>

        <form.Field name="institution">
          {(field) => (
            <FormInput
              field={field}
              label="Institution"
              placeholder="e.g., Chase Bank"
            />
          )}
        </form.Field>

        <form.Field name="accountType">
          {(field) => (
            <View style={formStyles.fieldContainer}>
              <Text style={formStyles.label}>Account Type</Text>
              <View style={formStyles.typeGrid}>
                {accountTypes.map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      formStyles.typeButton,
                      field.state.value === type && formStyles.typeButtonSelected,
                    ]}
                    onPress={() => field.handleChange(type)}
                  >
                    <Text
                      style={[
                        formStyles.typeButtonText,
                        field.state.value === type && formStyles.typeButtonTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </form.Field>

        <form.Field name="accountNumber">
          {(field) => (
            <FormInput
              field={field}
              label="Last 4 Digits (Optional)"
              placeholder="e.g., 4521"
              keyboardType="number-pad"
              maxLength={4}
            />
          )}
        </form.Field>

        <form.Field name="notes">
          {(field) => (
            <FormTextArea
              field={field}
              label="Notes (Optional)"
              placeholder="Any additional details about this account"
            />
          )}
        </form.Field>

        <View style={formStyles.buttonContainer}>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                title={isSaving || isSubmitting ? 'Saving...' : 'Save'}
                onPress={() => form.handleSubmit()}
                disabled={isSaving || isSubmitting || !canSubmit}
              />
            )}
          </form.Subscribe>
        </View>

        {!isNew && onDelete && (
          <View style={formStyles.deleteContainer}>
            <Button title="Delete Account" variant="destructive" onPress={handleDelete} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
