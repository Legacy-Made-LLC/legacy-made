/**
 * InsuranceForm - Form for creating/editing insurance policy entries
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
import { FormInput, FormTextArea, insuranceSchema } from '@/components/forms';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/constants/theme';
import { formStyles } from './formStyles';
import type { EntryFormProps } from '../registry';

const policyTypes = ['Life', 'Health', 'Home', 'Auto', 'Disability', 'Other'] as const;

type PolicyType = (typeof policyTypes)[number];

interface InsuranceMetadata {
  provider: string;
  policyType: PolicyType;
  policyNumber?: string;
  contactInfo?: string;
  coverageDetails?: string;
}

export function InsuranceForm({
  entryId,
  initialData,
  onSave,
  onDelete,
  isSaving,
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;

  const initialMetadata = initialData?.metadata as InsuranceMetadata | undefined;

  const defaultValues = useMemo(
    () => ({
      policyName: initialData?.title ?? '',
      provider: initialMetadata?.provider ?? '',
      policyType: (initialMetadata?.policyType ?? 'Life') as string,
      policyNumber: initialMetadata?.policyNumber ?? '',
      coverageDetails: initialMetadata?.coverageDetails ?? '',
      notes: initialData?.notes ?? '',
    }),
    [initialData, initialMetadata]
  );

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: insuranceSchema,
    },
    onSubmit: async ({ value }) => {
      const metadata: InsuranceMetadata = {
        provider: value.provider.trim(),
        policyType: value.policyType as PolicyType,
        policyNumber: value.policyNumber.trim() || undefined,
        coverageDetails: value.coverageDetails.trim() || undefined,
      };

      try {
        await onSave({
          title: value.policyName.trim(),
          notes: value.notes.trim() || undefined,
          metadata: metadata as unknown as Record<string, unknown>,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save policy';
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
      title: isNew ? 'Add Policy' : 'Edit Policy',
    });
  }, [isNew, navigation]);

  const handleDelete = () => {
    if (!onDelete) return;

    const policyName = form.getFieldValue('policyName');
    Alert.alert('Delete Policy', `Are you sure you want to delete ${policyName || 'this policy'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await onDelete();
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete policy';
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
        <form.Field name="policyName">
          {(field) => (
            <FormInput field={field} label="Policy Name" placeholder="e.g., Life Insurance" />
          )}
        </form.Field>

        <form.Field name="provider">
          {(field) => (
            <FormInput field={field} label="Provider" placeholder="e.g., Northwestern Mutual" />
          )}
        </form.Field>

        <form.Field name="policyType">
          {(field) => (
            <View style={formStyles.fieldContainer}>
              <Text style={formStyles.label}>Policy Type</Text>
              <View style={formStyles.typeGrid}>
                {policyTypes.map((type) => (
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

        <form.Field name="policyNumber">
          {(field) => (
            <FormInput field={field} label="Policy Number (Optional)" placeholder="e.g., LF-2847592" />
          )}
        </form.Field>

        <form.Field name="coverageDetails">
          {(field) => (
            <FormInput
              field={field}
              label="Coverage Amount (Optional)"
              placeholder="e.g., $500,000"
            />
          )}
        </form.Field>

        <form.Field name="notes">
          {(field) => (
            <FormTextArea
              field={field}
              label="Notes (Optional)"
              placeholder="Any additional details about this policy"
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
            <Button title="Delete Policy" variant="destructive" onPress={handleDelete} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
