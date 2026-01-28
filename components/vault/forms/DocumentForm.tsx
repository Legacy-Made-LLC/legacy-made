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
import { FormInput, FormTextArea, documentSchema, FilePicker } from '@/components/forms';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/constants/theme';
import { formStyles } from './formStyles';
import type { EntryFormProps } from '../registry';

const legalDocumentTypes = [
  'Will',
  'Trust',
  'Power of Attorney',
  'Healthcare Directive',
  'Other',
] as const;

const otherDocumentTypes = [
  'Birth Certificate',
  'Passport',
  'Social Security Card',
  'Other',
] as const;

type LegalDocumentType = (typeof legalDocumentTypes)[number];
type OtherDocumentType = (typeof otherDocumentTypes)[number];
type DocumentType = LegalDocumentType | OtherDocumentType;

interface DocumentMetadata {
  documentType: DocumentType;
  location: string;
  holder?: string;
  preparer?: string;
  preparerPhone?: string;
  notes?: string;
}

export function DocumentForm({
  taskKey,
  entryId,
  initialData,
  onSave,
  onDelete,
  isSaving,
  attachments,
  onAttachmentsChange,
  isUploading,
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;

  // Determine which document types to show based on taskKey
  const isLegalDocs = taskKey === 'documents.legal';
  const documentTypes = isLegalDocs ? legalDocumentTypes : otherDocumentTypes;
  const defaultDocType = isLegalDocs ? 'Will' : 'Birth Certificate';

  const initialMetadata = initialData?.metadata as DocumentMetadata | undefined;

  const defaultValues = useMemo(
    () => ({
      documentType: (initialMetadata?.documentType ?? defaultDocType) as string,
      location: initialMetadata?.location ?? '',
      holder: initialMetadata?.holder ?? '',
      preparer: initialMetadata?.preparer ?? '',
      preparerPhone: initialMetadata?.preparerPhone ?? '',
      notes: initialMetadata?.notes ?? initialData?.notes ?? '',
    }),
    [initialData, initialMetadata, defaultDocType]
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
        preparer: value.preparer.trim() || undefined,
        preparerPhone: value.preparerPhone.trim() || undefined,
        notes: value.notes.trim() || undefined,
      };
      // Note: Files are uploaded separately via file API, not stored in metadata

      // Use document type as the title
      const title = value.documentType;

      try {
        await onSave({
          title,
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
    const docLabel = isLegalDocs ? 'Legal Document' : 'Document';
    navigation.setOptions({
      title: isNew ? `Add ${docLabel}` : `Edit ${docLabel}`,
    });
  }, [isNew, isLegalDocs, navigation]);

  const handleDelete = () => {
    if (!onDelete) return;

    const documentType = form.getFieldValue('documentType');
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete ${documentType || 'this document'}?`,
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

        {isLegalDocs && (
          <View style={formStyles.fieldRow}>
            <View style={formStyles.fieldRowItem}>
              <form.Field name="preparer">
                {(field) => (
                  <FormInput
                    field={field}
                    label="Attorney/Preparer"
                    placeholder="e.g., David Park, Esq."
                    containerStyle={{ marginBottom: 0 }}
                  />
                )}
              </form.Field>
            </View>
            <View style={formStyles.fieldRowItem}>
              <form.Field name="preparerPhone">
                {(field) => (
                  <FormInput
                    field={field}
                    label="Phone"
                    placeholder="(555) 123-4567"
                    keyboardType="phone-pad"
                    containerStyle={{ marginBottom: 0 }}
                  />
                )}
              </form.Field>
            </View>
          </View>
        )}

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
              label="Who Has a Copy?"
              placeholder="e.g., Attorney David Park"
            />
          )}
        </form.Field>

        <form.Field name="notes">
          {(field) => (
            <FormTextArea
              field={field}
              label="Notes"
              placeholder="Any additional details about this document"
            />
          )}
        </form.Field>

        {onAttachmentsChange && (
          <FilePicker
            label="Attachments"
            value={attachments ?? []}
            onChange={onAttachmentsChange}
            mode="all"
            maxFiles={5}
            placeholder="Add document scan or photo"
            helpText="Attach scanned copies, photos, or PDF files of this document"
          />
        )}

        <View style={formStyles.buttonContainer}>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => {
              const busy = isSaving || isSubmitting || isUploading;
              const buttonTitle = isUploading
                ? 'Uploading...'
                : busy
                  ? 'Saving...'
                  : 'Save';
              return (
                <Button
                  title={buttonTitle}
                  onPress={() => form.handleSubmit()}
                  disabled={busy || !canSubmit}
                />
              );
            }}
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
