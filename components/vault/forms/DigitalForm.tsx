/**
 * DigitalForm - Form for creating/editing digital access entries
 */

import type { MetadataSchema } from "@/api/types";
import {
  FormInput,
  FormTextArea,
  digitalSchema,
  digitalSocialSchema,
  FilePicker,
} from "@/components/forms";
import { Button } from "@/components/ui/Button";
import { spacing } from "@/constants/theme";
import { toast } from "@/hooks/useToast";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useNavigation } from "expo-router";
import React, { useEffect, useMemo } from "react";
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

const importanceLevels = ["Critical", "High", "Medium", "Low"] as const;

/** Display schema for digital account metadata */
const DIGITAL_METADATA_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    service: { label: "Service/Platform", order: 1 },
    username: { label: "Username/Email", order: 2 },
    importance: {
      label: "Importance",
      order: 3,
      valueLabels: Object.fromEntries(importanceLevels.map((l) => [l, l])),
    },
    notes: { label: "How to Access", order: 4 },
  },
};

type ImportanceLevel = (typeof importanceLevels)[number];

interface DigitalMetadata {
  service: string;
  username?: string | null;
  recoveryEmail?: string | null;
  importance: ImportanceLevel;
  notes?: string | null;
}

// Get display labels based on task type
function getLabels(taskKey: string) {
  switch (taskKey) {
    case "digital.email":
      return {
        addTitle: "Add Email Account",
        editTitle: "Edit Email Account",
        deleteTitle: "Delete Email Account",
        namePlaceholder: "e.g., Primary Email, Work Email",
        servicePlaceholder: "e.g., Gmail, Outlook, Yahoo",
      };
    case "digital.passwords":
      return {
        addTitle: "Add Password Info",
        editTitle: "Edit Password Info",
        deleteTitle: "Delete Password Info",
        namePlaceholder: "e.g., Password Manager, Browser Passwords",
        servicePlaceholder: "e.g., 1Password, LastPass, iCloud Keychain",
      };
    case "digital.devices":
      return {
        addTitle: "Add Device",
        editTitle: "Edit Device",
        deleteTitle: "Delete Device",
        namePlaceholder: "e.g., iPhone, MacBook, iPad",
        servicePlaceholder: "e.g., Apple, Samsung, Dell",
      };
    case "digital.social":
      return {
        addTitle: "Add Social Account",
        editTitle: "Edit Social Account",
        deleteTitle: "Delete Social Account",
        namePlaceholder: "e.g., Facebook, Instagram, LinkedIn",
        servicePlaceholder: "e.g., Facebook, Instagram, Twitter/X",
      };
    default:
      return {
        addTitle: "Add Account",
        editTitle: "Edit Account",
        deleteTitle: "Delete Account",
        namePlaceholder: "e.g., Primary Email",
        servicePlaceholder: "e.g., Gmail, 1Password, Apple ID",
      };
  }
}

export function DigitalForm({
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
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;
  const isSocial = taskKey === "digital.social";
  const labels = getLabels(taskKey);

  const initialMetadata = initialData?.metadata as DigitalMetadata | undefined;

  const defaultValues = useMemo(
    () => ({
      accountName: initialData?.title ?? "",
      service: initialMetadata?.service ?? "",
      username: initialMetadata?.username ?? "",
      importance: (initialMetadata?.importance ?? "Medium") as string,
      accessNotes: initialMetadata?.notes ?? initialData?.notes ?? "",
    }),
    [initialData, initialMetadata],
  );

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: isSocial ? digitalSocialSchema : digitalSchema,
    },
    onSubmit: async ({ value }) => {
      const metadata: DigitalMetadata = {
        service: value.service.trim(),
        username: value.username.trim() || null,
        importance: value.importance as ImportanceLevel,
        notes: value.accessNotes.trim() || null,
      };

      // For social accounts, use the service/platform as the title
      const title = isSocial
        ? value.service.trim()
        : value.accountName.trim();

      if (toast.isOffline()) return;

      try {
        await onSave({
          title,
          notes: value.accessNotes.trim() || null,
          metadata: metadata as unknown as Record<string, unknown>,
          metadataSchema: DIGITAL_METADATA_SCHEMA,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save account";
        toast.error({ message });
      }
    },
  });

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? labels.addTitle : labels.editTitle,
    });
  }, [isNew, labels.addTitle, labels.editTitle, navigation]);

  const handleDelete = () => {
    if (!onDelete) return;

    const displayName = isSocial
      ? form.getFieldValue("service")
      : form.getFieldValue("accountName");
    Alert.alert(
      labels.deleteTitle,
      `Are you sure you want to delete ${displayName || "this item"}?`,
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
                err instanceof Error ? err.message : "Failed to delete";
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
      bottomOffset={20}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
        {!isSocial && (
          <form.Field name="accountName">
            {(field) => (
              <FormInput
                field={field}
                label="Name"
                placeholder={labels.namePlaceholder}
              />
            )}
          </form.Field>
        )}

        <form.Field name="service">
          {(field) => (
            <FormInput
              field={field}
              label="Service/Platform"
              placeholder={labels.servicePlaceholder}
            />
          )}
        </form.Field>

        <form.Field name="username">
          {(field) => (
            <FormInput
              field={field}
              label="Username/Email"
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
                      field.state.value === level &&
                        formStyles.typeButtonSelected,
                    ]}
                    onPress={() => field.handleChange(level)}
                  >
                    <Text
                      style={[
                        formStyles.typeButtonText,
                        field.state.value === level &&
                          formStyles.typeButtonTextSelected,
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
              label="How to Access"
              placeholder="Where can the password be found? Don't store the actual password here."
            />
          )}
        </form.Field>

        {onAttachmentsChange && (
          <FilePicker
            label="Screenshots & Documents"
            value={attachments ?? []}
            onChange={onAttachmentsChange}
            mode="all"
            maxFiles={5}
            placeholder="Add screenshots or documents"
            helpText="Attach screenshots of recovery codes, QR codes, or other helpful documents"
            showStorageIndicator
            onUpgradeRequired={onStorageUpgradeRequired}
          />
        )}

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
                  : "Save";
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
            <Button
              title={labels.deleteTitle}
              variant="destructive"
              onPress={handleDelete}
            />
          </View>
        )}
    </KeyboardAwareScrollView>
  );
}
