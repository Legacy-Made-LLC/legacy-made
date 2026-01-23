/**
 * DocumentForm - Form for creating/editing legal document entries
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
import { FormInput, FormTextArea, documentSchema } from '@/components/forms';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/constants/theme';
import { formStyles } from './formStyles';
import type { EntryFormProps } from '../registry';

const documentTypes = [
  'Will',
  'Trust',
  'Power of Attorney',
  'Healthcare Directive',
  'Birth Certificate',
  'Passport',
  'Other',
] as const;

type DocumentType = (typeof documentTypes)[number];

interface DocumentMetadata {
  documentType: DocumentType;
  location: string;
  holder?: string;
  notes?: string;
}

export function DocumentForm({
  entryId,
  initialData,
  onSave,
  onDelete,
  isSaving,
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;

  const initialMetadata = initialData?.metadata as DocumentMetadata | undefined;

  const defaultValues = useMemo(
    () => ({
      documentName: initialData?.title ?? '',
      documentType: (initialMetadata?.documentType ?? 'Will') as string,
      location: initialMetadata?.location ?? '',
      holder: initialMetadata?.holder ?? '',
      notes: initialMetadata?.notes ?? initialData?.notes ?? '',
    }),
    [initialData, initialMetadata]
  );

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: documentSchema,
    },
    onSubmit: async ({ value }) => {
      const metadata: DocumentMetadata = {
        documentType: value.documentType as DocumentType,
        location: value.location.trim(),
        holder: value.holder.trim() || undefined,
        notes: value.notes.trim() || undefined,
      };

      try {
        await onSave({
          title: value.documentName.trim(),
          notes: value.notes.trim() || undefined,
          metadata: metadata as unknown as Record<string, unknown>,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save document';
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
      title: isNew ? 'Add Document' : 'Edit Document',
    });
  }, [isNew, navigation]);

  const handleDelete = () => {
    if (!onDelete) return;

    const documentName = form.getFieldValue('documentName');
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete ${documentName || 'this document'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to delete document';
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
        <form.Field name="documentName">
          {(field) => (
            <FormInput
              field={field}
              label="Document Name"
              placeholder="e.g., Last Will and Testament"
            />
          )}
        </form.Field>

        <form.Field name="documentType">
          {(field) => (
            <View style={formStyles.fieldContainer}>
              <Text style={formStyles.label}>Document Type</Text>
              <View style={formStyles.typeGrid}>
                {documentTypes.map((type) => (
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

        <form.Field name="location">
          {(field) => (
            <FormInput
              field={field}
              label="Location"
              placeholder="e.g., Safe deposit box at Chase Bank"
            />
          )}
        </form.Field>

        <form.Field name="holder">
          {(field) => (
            <FormInput
              field={field}
              label="Who Has a Copy? (Optional)"
              placeholder="e.g., Attorney David Park"
            />
          )}
        </form.Field>

        <form.Field name="notes">
          {(field) => (
            <FormTextArea
              field={field}
              label="Notes (Optional)"
              placeholder="Any additional details about this document"
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
            <Button title="Delete Document" variant="destructive" onPress={handleDelete} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
