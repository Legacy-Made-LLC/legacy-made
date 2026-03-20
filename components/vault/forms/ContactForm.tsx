/**
 * ContactForm - Form for creating/editing contact entries
 *
 * Used for: contacts.primary, contacts.backup, people
 * Auto-save enabled — the orchestrator handles saving via registerGetSaveData.
 */

import type { MetadataSchema } from "@/api/types";
import { contactSchemaWithRequiredPhone, FilePicker } from "@/components/forms";
import { ContactFormFieldsWithForm } from "@/components/forms/ContactFormFields";
import { colors, spacing, typography } from "@/constants/theme";
import { usePerspective } from "@/contexts/LocaleContext";
import { toast } from "@/hooks/useToast";
import { Ionicons } from "@expo/vector-icons";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useNavigation } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { EntryFormProps, EntrySaveData } from "../registry";

const formText = {
  owner: {
    photoHelp: "Adding a photo helps others identify who to contact",
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
  registerGetSaveData,
  onDelete,
  attachments,
  onAttachmentsChange,
  isUploading,
  onStorageUpgradeRequired,
  readOnly,
  onFormReady,
  onDiscreteChange,
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { perspective } = usePerspective();
  const t = formText[perspective];
  const isNew = !entryId;

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

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: contactSchemaWithRequiredPhone,
    },
  });

  // Report form instance to parent for auto-save subscription
  useEffect(() => {
    onFormReady?.(form);
  }, [form, onFormReady]);

  // Register getSaveData function with orchestrator
  useEffect(() => {
    const getSaveData = (): EntrySaveData => {
      const value = form.state.values;
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

      return {
        title,
        notes: value.reason.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: CONTACT_METADATA_SCHEMA,
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData, showPriorityToggle]);

  useEffect(() => {
    navigation.setOptions({
      title: readOnly ? "View Contact" : isNew ? "Add Contact" : "Edit Contact",
    });
  }, [isNew, readOnly, navigation]);

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
        onDiscreteChange={onDiscreteChange}
      />

      {showPriorityToggle && (
        <form.Field name="isPrimary">
          {(field: {
            state: { value: boolean };
            handleChange: (v: boolean) => void;
          }) => {
            const isSelected = field.state.value;
            return (
              <Pressable
                style={[
                  styles.priorityCard,
                  isSelected && styles.priorityCardSelected,
                ]}
                onPress={() => {
                  if (readOnly) return;
                  field.handleChange(!isSelected);
                  onDiscreteChange?.();
                }}
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
                    <Text
                      style={[
                        styles.priorityLabel,
                        isSelected && styles.priorityLabelSelected,
                      ]}
                    >
                      Contact first
                    </Text>
                  </View>
                  <View
                    style={[styles.radio, isSelected && styles.radioSelected]}
                  >
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
  content: {
    paddingHorizontal: spacing.lg,
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
