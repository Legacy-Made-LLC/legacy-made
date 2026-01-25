/**
 * DigitalForm - Form for creating/editing digital access entries
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
import { FormInput, FormTextArea, digitalSchema } from '@/components/forms';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/constants/theme';
import { formStyles } from './formStyles';
import type { EntryFormProps } from '../registry';

const importanceLevels = ['Critical', 'High', 'Medium', 'Low'] as const;

type ImportanceLevel = (typeof importanceLevels)[number];

interface DigitalMetadata {
  service: string;
  username?: string;
  recoveryEmail?: string;
  importance: ImportanceLevel;
  notes?: string;
}

export function DigitalForm({
  entryId,
  initialData,
  onSave,
  onDelete,
  isSaving,
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;

  const initialMetadata = initialData?.metadata as DigitalMetadata | undefined;

  const defaultValues = useMemo(
    () => ({
      accountName: initialData?.title ?? '',
      service: initialMetadata?.service ?? '',
      username: initialMetadata?.username ?? '',
      importance: (initialMetadata?.importance ?? 'Medium') as string,
      accessNotes: initialMetadata?.notes ?? initialData?.notes ?? '',
    }),
    [initialData, initialMetadata]
  );

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: digitalSchema,
    },
    onSubmit: async ({ value }) => {
      const metadata: DigitalMetadata = {
        service: value.service.trim(),
        username: value.username.trim() || undefined,
        importance: value.importance as ImportanceLevel,
        notes: value.accessNotes.trim() || undefined,
      };

      try {
        await onSave({
          title: value.accountName.trim(),
          notes: value.accessNotes.trim() || undefined,
          metadata: metadata as unknown as Record<string, unknown>,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save account';
        Alert.alert('Error', message);
      }
    },
  });

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
            <FormInput field={field} label="Account Name" placeholder="e.g., Primary Email" />
          )}
        </form.Field>

        <form.Field name="service">
          {(field) => (
            <FormInput
              field={field}
              label="Service/Platform"
              placeholder="e.g., Gmail, 1Password, Apple ID"
            />
          )}
        </form.Field>

        <form.Field name="username">
          {(field) => (
            <FormInput
              field={field}
              label="Username/Email (Optional)"
              placeholder="e.g., email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        </form.Field>

        <form.Field name="importance">
          {(field) => (
            <View style={formStyles.fieldContainer}>
              <Text style={formStyles.label}>Importance</Text>
              <View style={formStyles.typeGrid}>
                {importanceLevels.map((level) => (
                  <Pressable
                    key={level}
                    style={[
                      formStyles.typeButton,
                      field.state.value === level && formStyles.typeButtonSelected,
                    ]}
                    onPress={() => field.handleChange(level)}
                  >
                    <Text
                      style={[
                        formStyles.typeButtonText,
                        field.state.value === level && formStyles.typeButtonTextSelected,
                      ]}
                    >
                      {level}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </form.Field>

        <form.Field name="accessNotes">
          {(field) => (
            <FormTextArea
              field={field}
              label="How to Access (Optional)"
              placeholder="Where can the password be found? Don't store the actual password here."
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
