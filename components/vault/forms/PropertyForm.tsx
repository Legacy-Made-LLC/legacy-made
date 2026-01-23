/**
 * PropertyForm - Form for creating/editing property and vehicle entries
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
import { FormInput, FormTextArea, propertySchema } from '@/components/forms';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/constants/theme';
import { formStyles } from './formStyles';
import type { EntryFormProps } from '../registry';

const propertyTypes = ['Real Estate', 'Vehicle', 'Storage Unit', 'Recurring Bill', 'Other'] as const;

type PropertyType = (typeof propertyTypes)[number];

interface PropertyMetadata {
  responsibilityType: PropertyType;
  provider?: string;
  accountInfo?: string;
  frequency?: string;
  notes?: string;
}

export function PropertyForm({
  entryId,
  initialData,
  onSave,
  onDelete,
  isSaving,
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;

  const initialMetadata = initialData?.metadata as PropertyMetadata | undefined;

  const defaultValues = useMemo(
    () => ({
      itemName: initialData?.title ?? '',
      propertyType: (initialMetadata?.responsibilityType ?? 'Real Estate') as string,
      accountInfo: initialMetadata?.accountInfo ?? '',
      notes: initialMetadata?.notes ?? initialData?.notes ?? '',
    }),
    [initialData, initialMetadata]
  );

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: propertySchema,
    },
    onSubmit: async ({ value }) => {
      const metadata: PropertyMetadata = {
        responsibilityType: value.propertyType as PropertyType,
        accountInfo: value.accountInfo.trim() || undefined,
        notes: value.notes.trim() || undefined,
      };

      try {
        await onSave({
          title: value.itemName.trim(),
          notes: value.notes.trim() || undefined,
          metadata: metadata as unknown as Record<string, unknown>,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save property';
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
      title: isNew ? 'Add Property' : 'Edit Property',
    });
  }, [isNew, navigation]);

  const handleDelete = () => {
    if (!onDelete) return;

    const itemName = form.getFieldValue('itemName');
    Alert.alert('Delete Property', `Are you sure you want to delete ${itemName || 'this item'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await onDelete();
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete property';
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
        <form.Field name="itemName">
          {(field) => (
            <FormInput
              field={field}
              label="Name"
              placeholder="e.g., Primary Residence, Honda CR-V"
            />
          )}
        </form.Field>

        <form.Field name="propertyType">
          {(field) => (
            <View style={formStyles.fieldContainer}>
              <Text style={formStyles.label}>Type</Text>
              <View style={formStyles.typeGrid}>
                {propertyTypes.map((type) => (
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

        <form.Field name="accountInfo">
          {(field) => (
            <FormInput
              field={field}
              label="Details (Optional)"
              placeholder="e.g., Address, license plate, account number"
            />
          )}
        </form.Field>

        <form.Field name="notes">
          {(field) => (
            <FormTextArea field={field} label="Notes (Optional)" placeholder="Any additional details" />
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
            <Button title="Delete Property" variant="destructive" onPress={handleDelete} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
