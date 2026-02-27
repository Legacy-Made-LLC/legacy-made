/**
 * DocumentForm - Form for creating/editing legal document entries
 */

import type { EntryCompletionStatus, MetadataSchema } from "@/api/types";
import {
  FormInput,
  FormTextArea,
  documentSchema,
  FilePicker,
} from "@/components/forms";
import { Button } from "@/components/ui/Button";
import { spacing } from "@/constants/theme";
import { toast } from "@/hooks/useToast";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useNavigation } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { EntryFormProps } from "../registry";
import { formStyles } from "./formStyles";

const legalDocumentTypes = [
  "Will",
  "Trust",
  "Power of Attorney",
  "Healthcare Directive",
  "Other",
] as const;

const otherDocumentTypes = [
  "Birth Certificate",
  "Passport",
  "Social Security Card",
  "Other",
] as const;

/** Display schema for document metadata */
const DOCUMENT_METADATA_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    documentType: {
      label: "Document Type",
      order: 1,
      valueLabels: Object.fromEntries([
        ...legalDocumentTypes.map((t) => [t, t]),
        ...otherDocumentTypes.map((t) => [t, t]),
      ]),
    },
    location: { label: "Location", order: 2 },
    holder: { label: "Who Has a Copy?", order: 3 },
    preparer: { label: "Attorney/Preparer", order: 4 },
    preparerPhone: { label: "Phone", order: 5 },
    notes: { label: "Notes", order: 6 },
  },
};

type LegalDocumentType = (typeof legalDocumentTypes)[number];
type OtherDocumentType = (typeof otherDocumentTypes)[number];
type DocumentType = LegalDocumentType | OtherDocumentType;

interface DocumentMetadata {
  documentType: DocumentType;
  location: string;
  holder?: string | null;
  preparer?: string | null;
  preparerPhone?: string | null;
  notes?: string | null;
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
  onStorageUpgradeRequired,
  readOnly,
  onFormReady,
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;
  const completionStatusRef = useRef<EntryCompletionStatus>("complete");

  // Determine which document types to show based on taskKey
  const isLegalDocs = taskKey === "documents.legal";
  const documentTypes = isLegalDocs ? legalDocumentTypes : otherDocumentTypes;
  const defaultDocType = isLegalDocs ? "Will" : "Birth Certificate";

  const initialMetadata = initialData?.metadata as DocumentMetadata | undefined;

  const defaultValues = useMemo(
    () => ({
      documentType: (initialMetadata?.documentType ?? defaultDocType) as string,
      location: initialMetadata?.location ?? "",
      holder: initialMetadata?.holder ?? "",
      preparer: initialMetadata?.preparer ?? "",
      preparerPhone: initialMetadata?.preparerPhone ?? "",
      notes: initialMetadata?.notes ?? initialData?.notes ?? "",
    }),
    [initialData, initialMetadata, defaultDocType],
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
        holder: value.holder.trim() || null,
        preparer: value.preparer.trim() || null,
        preparerPhone: value.preparerPhone.trim() || null,
        notes: value.notes.trim() || null,
      };
      // Note: Files are uploaded separately via file API, not stored in metadata

      // Use document type as the title
      const title = value.documentType;

      if (toast.isOffline()) return;

      try {
        await onSave({
          title,
          notes: value.notes.trim() || null,
          metadata: metadata as unknown as Record<string, unknown>,
          metadataSchema: DOCUMENT_METADATA_SCHEMA,
          completionStatus: completionStatusRef.current,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save document";
        toast.error({ message });
      }
    },
  });

  // Report form instance to parent for unsaved-changes guard
  useEffect(() => {
    onFormReady?.(form);
  }, [form, onFormReady]);

  useEffect(() => {
    const docLabel = isLegalDocs ? "Legal Document" : "Document";
    navigation.setOptions({
      title: readOnly ? `View ${docLabel}` : isNew ? `Add ${docLabel}` : `Edit ${docLabel}`,
    });
  }, [isNew, readOnly, isLegalDocs, navigation]);

  const handleSaveWithStatus = (status: EntryCompletionStatus) => {
    completionStatusRef.current = status;
    form.handleSubmit();
  };

  const handleDelete = () => {
    if (!onDelete) return;

    const documentType = form.getFieldValue("documentType");
    Alert.alert(
      "Delete Document",
      `Are you sure you want to delete ${documentType || "this document"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (toast.isOffline()) return;
            try {
              await onDelete();
            } catch (err) {
              const message =
                err instanceof Error
                  ? err.message
                  : "Failed to delete document";
              toast.error({ message });
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAwareScrollView
      style={formStyles.container}
      contentContainerStyle={[
        formStyles.content,
        { paddingBottom: insets.bottom + spacing.lg },
      ]}
      bottomOffset={50}
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
                      field.state.value === type &&
                        formStyles.typeButtonSelected,
                    ]}
                    onPress={readOnly ? undefined : () => field.handleChange(type)}
                  >
                    <Text
                      style={[
                        formStyles.typeButtonText,
                        field.state.value === type &&
                          formStyles.typeButtonTextSelected,
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
                    disabled={readOnly}
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
                    disabled={readOnly}
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
              disabled={readOnly}
            />
          )}
        </form.Field>

        <form.Field name="holder">
          {(field) => (
            <FormInput
              field={field}
              label="Who Has a Copy?"
              placeholder="e.g., Attorney David Park"
              disabled={readOnly}
            />
          )}
        </form.Field>

        <form.Field name="notes">
          {(field) => (
            <FormTextArea
              field={field}
              label="Notes"
              placeholder="Any additional details about this document"
              disabled={readOnly}
            />
          )}
        </form.Field>

        {!readOnly && onAttachmentsChange && (
          <FilePicker
            label="Attachments"
            value={attachments ?? []}
            onChange={onAttachmentsChange}
            mode="all"
            maxFiles={5}
            placeholder="Add document scan or photo"
            helpText="Attach scanned copies, photos, or PDF files of this document"
            showStorageIndicator
            onUpgradeRequired={onStorageUpgradeRequired}
          />
        )}

        {!readOnly && (
        <View style={formStyles.buttonContainer}>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => {
              const busy = isSaving || isSubmitting || isUploading;
              const buttonTitle = isUploading
                ? "Uploading..."
                : busy
                  ? "Saving..."
                  : "Finish & Save";
              return (
                <>
                  <Button
                    title={buttonTitle}
                    onPress={() => handleSaveWithStatus("complete")}
                    disabled={busy || !canSubmit}
                  />
                  <Pressable
                    onPress={() => handleSaveWithStatus("draft")}
                    disabled={busy || !canSubmit}
                    style={formStyles.draftLinkContainer}
                  >
                    <Text style={formStyles.draftLinkText}>Save as Draft</Text>
                  </Pressable>
                </>
              );
            }}
          </form.Subscribe>
        </View>
        )}

        {!readOnly && !isNew && onDelete && (
          <View style={formStyles.deleteContainer}>
            <Button
              title="Delete Document"
              variant="destructive"
              onPress={handleDelete}
            />
          </View>
        )}
    </KeyboardAwareScrollView>
  );
}
