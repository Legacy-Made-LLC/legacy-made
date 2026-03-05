/**
 * ContactForm - Form for creating/editing contact entries
 *
 * Used for: contacts.primary, contacts.backup, people
 */

import type { EntryCompletionStatus, MetadataSchema } from "@/api/types";
import { contactSchemaWithRequiredPhone, FilePicker } from "@/components/forms";
import { ContactFormFieldsWithForm } from "@/components/forms/ContactFormFields";
import { colors, spacing, typography } from "@/constants/theme";
import { usePerspective } from "@/contexts/LocaleContext";
import { toast } from "@/hooks/useToast";
import { Ionicons } from "@expo/vector-icons";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useNavigation } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { EntryFormProps } from "../registry";

const formText = {
  owner: {
    photoHelp: "Adding a photo helps your family identify who to contact",
  },
  family: {
    photoHelp: "A photo helps identify who to contact",
  },
};

/** Display schema for contact metadata */
export const CONTACT_METADATA_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    firstName: { label: "First Name", order: 1 },
    lastName: { label: "Last Name", order: 2 },
    relationship: { label: "Relationship", order: 3 },
    phone: { label: "Phone", order: 4 },
    email: { label: "Email", order: 5 },
    reason: { label: "Why This Person?", order: 6 },
    isPrimary: {
      label: "Contact First",
      order: 7,
      valueLabels: { true: "Yes", false: "No" },
    },
  },
};

interface ContactMetadata {
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email?: string | null;
  reason?: string | null;
  isPrimary?: boolean;
}

interface ContactFormValues {
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email: string;
  reason: string;
  isPrimary: boolean;
}

export function ContactForm({
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
  const { perspective } = usePerspective();
  const t = formText[perspective];
  const isNew = !entryId;
  const completionStatusRef = useRef<EntryCompletionStatus>("complete");

  // Extract initial values from initialData
  const initialMetadata = initialData?.metadata as unknown as
    | ContactMetadata
    | undefined;

  const showPriorityToggle = taskKey === "contacts.primary";

  const defaultValues = useMemo<ContactFormValues>(
    () => ({
      firstName: initialMetadata?.firstName ?? "",
      lastName: initialMetadata?.lastName ?? "",
      relationship: initialMetadata?.relationship ?? "",
      phone: initialMetadata?.phone ?? "",
      email: initialMetadata?.email ?? "",
      reason: initialMetadata?.reason ?? initialData?.notes ?? "",
      isPrimary: initialMetadata?.isPrimary ?? false,
    }),
    [initialMetadata, initialData?.notes],
  );

  const submitForm = async (value: ContactFormValues) => {
    const title =
      `${value.firstName.trim()} ${value.lastName.trim()}`.trim() || "Draft";
    const metadata: ContactMetadata = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      relationship: value.relationship.trim(),
      phone: value.phone.trim(),
      email: value.email.trim() || null,
      reason: value.reason.trim() || null,
      isPrimary: showPriorityToggle ? value.isPrimary : false,
    };

    try {
      await onSave({
        title,
        notes: value.reason.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: CONTACT_METADATA_SCHEMA,
        completionStatus: completionStatusRef.current,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save contact";
      toast.error({ message });
    }
  };

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: contactSchemaWithRequiredPhone,
    },
    onSubmit: async ({ value }) => submitForm(value),
  });

  // Report form instance to parent for unsaved-changes guard
  useEffect(() => {
    onFormReady?.(form);
  }, [form, onFormReady]);

  useEffect(() => {
    navigation.setOptions({
      title: readOnly ? "View Contact" : isNew ? "Add Contact" : "Edit Contact",
    });
  }, [isNew, readOnly, navigation]);

  const handleSaveWithStatus = async (status: EntryCompletionStatus) => {
    completionStatusRef.current = status;
    if (status === "draft") {
      await submitForm(form.state.values);
    } else {
      form.handleSubmit();
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    const firstName = form.getFieldValue("firstName");
    const lastName = form.getFieldValue("lastName");
    const name = `${firstName} ${lastName}`.trim() || "this contact";
    Alert.alert("Delete Contact", `Are you sure you want to delete ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await onDelete();
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Failed to delete contact";
            toast.error({ message });
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.lg },
      ]}
      bottomOffset={50}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
        <ContactFormFieldsWithForm
          form={form}
          showReasonField={true}
          phoneRequired={true}
          disabled={readOnly}
        />

        {showPriorityToggle && (
          <form.Field name="isPrimary">
            {(field: { state: { value: boolean }; handleChange: (v: boolean) => void }) => {
              const isSelected = field.state.value;
              return (
                <Pressable
                  style={[
                    styles.priorityCard,
                    isSelected && styles.priorityCardSelected,
                  ]}
                  onPress={() => !readOnly && field.handleChange(!isSelected)}
                  disabled={readOnly}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel="Mark as first contact"
                >
                  <View style={styles.priorityHeader}>
                    <View style={styles.priorityLeft}>
                      <Ionicons
                        name={isSelected ? "star" : "star-outline"}
                        size={20}
                        color={isSelected ? colors.primary : colors.textTertiary}
                      />
                      <Text style={[styles.priorityLabel, isSelected && styles.priorityLabelSelected]}>
                        Contact first
                      </Text>
                    </View>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <Text style={styles.priorityDescription}>
                    This person should be reached out to before others
                  </Text>
                </Pressable>
              );
            }}
          </form.Field>
        )}

        {!readOnly && onAttachmentsChange && (
          <FilePicker
            label="Photo"
            value={attachments ?? []}
            onChange={onAttachmentsChange}
            mode="image"
            maxFiles={1}
            placeholder="Add a photo of this person"
            helpText={t.photoHelp}
            showStorageIndicator
            onUpgradeRequired={onStorageUpgradeRequired}
          />
        )}

        {!readOnly && (
        <View style={styles.buttonContainer}>
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
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.primaryButtonPressed,
                      (busy || !canSubmit) && styles.primaryButtonDisabled,
                    ]}
                    onPress={() => handleSaveWithStatus("complete")}
                    disabled={busy || !canSubmit}
                  >
                    <Text
                      style={[
                        styles.primaryButtonText,
                        busy && styles.primaryButtonTextDisabled,
                      ]}
                    >
                      {buttonTitle}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleSaveWithStatus("draft")}
                    disabled={busy}
                    style={styles.draftLinkContainer}
                  >
                    <Text style={styles.draftLinkText}>Save as Draft</Text>
                  </Pressable>
                </>
              );
            }}
          </form.Subscribe>
        </View>
        )}

        {!readOnly && !isNew && onDelete && (
          <View style={styles.deleteContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deleteButtonPressed,
              ]}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Delete Contact</Text>
            </Pressable>
          </View>
        )}
    </KeyboardAwareScrollView>
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
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonDisabled: {
    backgroundColor: colors.border,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
  primaryButtonTextDisabled: {
    color: colors.textTertiary,
  },
  draftLinkContainer: {
    marginTop: spacing.sm,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  draftLinkText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
  },
  deleteContainer: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  deleteButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  deleteButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    color: colors.error,
  },
  priorityCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  priorityCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.featureInformationTint,
  },
  priorityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  priorityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  priorityLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  priorityLabelSelected: {
    color: colors.featureInformationDark,
  },
  priorityDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
    paddingLeft: 28,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
});
