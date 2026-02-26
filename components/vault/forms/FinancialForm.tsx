/**
 * FinancialForm - Form for creating/editing financial account entries
 */

import type { EntryCompletionStatus, MetadataSchema } from "@/api/types";
import { FormInput, FormTextArea, financialSchema, FilePicker } from "@/components/forms";
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

const accountTypes = [
  "Checking",
  "Savings",
  "Retirement",
  "Investment",
  "Credit",
  "Loan",
  "Other",
] as const;

/** Display schema for financial account metadata */
const FINANCIAL_METADATA_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    institution: { label: "Bank/Institution", order: 1 },
    accountType: {
      label: "Account Type",
      order: 2,
      valueLabels: Object.fromEntries(accountTypes.map((t) => [t, t])),
    },
    accountOwners: { label: "Account Owner(s)", order: 3 },
    accountNumber: { label: "Last 4 Digits", order: 4 },
    notes: { label: "Notes", order: 5 },
  },
};

type AccountType = (typeof accountTypes)[number];

interface FinancialMetadata {
  institution: string;
  accountType: AccountType;
  accountOwners?: string | null;
  accountNumber?: string | null;
  contactInfo?: string | null;
  notes?: string | null;
}

export function FinancialForm({
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
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;
  const completionStatusRef = useRef<EntryCompletionStatus>("complete");

  const initialMetadata = initialData?.metadata as
    | FinancialMetadata
    | undefined;

  const defaultValues = useMemo(
    () => ({
      accountName: initialData?.title ?? "",
      institution: initialMetadata?.institution ?? "",
      accountType: (initialMetadata?.accountType ?? "Checking") as string,
      accountOwners: initialMetadata?.accountOwners ?? "",
      accountNumber: initialMetadata?.accountNumber ?? "",
      notes: initialMetadata?.notes ?? initialData?.notes ?? "",
    }),
    [initialData, initialMetadata],
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
        accountOwners: value.accountOwners.trim() || null,
        accountNumber: value.accountNumber.trim() || null,
        notes: value.notes.trim() || null,
      };

      // Use account name if provided, otherwise generate from institution + type
      const title =
        value.accountName.trim() ||
        `${value.institution.trim()} ${value.accountType}`.trim();

      if (toast.isOffline()) return;

      try {
        await onSave({
          title,
          notes: value.notes.trim() || null,
          metadata: metadata as unknown as Record<string, unknown>,
          metadataSchema: FINANCIAL_METADATA_SCHEMA,
          completionStatus: completionStatusRef.current,
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
      title: readOnly ? "View Account" : isNew ? "Add Account" : "Edit Account",
    });
  }, [isNew, readOnly, navigation]);

  const handleSaveWithStatus = (status: EntryCompletionStatus) => {
    completionStatusRef.current = status;
    form.handleSubmit();
  };

  const handleDelete = () => {
    if (!onDelete) return;

    const accountName = form.getFieldValue("accountName");
    Alert.alert(
      "Delete Account",
      `Are you sure you want to delete ${accountName || "this account"}?`,
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
                err instanceof Error ? err.message : "Failed to delete account";
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
        <form.Field name="institution">
          {(field) => (
            <FormInput
              field={field}
              label="Bank/Institution"
              placeholder="e.g., Chase Bank"
              disabled={readOnly}
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

        <form.Field name="accountName">
          {(field) => (
            <FormInput
              field={field}
              label="Account Name"
              placeholder="e.g., Primary Checking"
              disabled={readOnly}
            />
          )}
        </form.Field>

        <form.Field name="accountOwners">
          {(field) => (
            <FormInput
              field={field}
              label="Account Owner(s)"
              placeholder="e.g., John & Jane Doe"
              disabled={readOnly}
            />
          )}
        </form.Field>

        <form.Field name="accountNumber">
          {(field) => (
            <FormInput
              field={field}
              label="Last 4 Digits"
              placeholder="e.g., 4521"
              keyboardType="number-pad"
              maxLength={4}
              disabled={readOnly}
            />
          )}
        </form.Field>

        <form.Field name="notes">
          {(field) => (
            <FormTextArea
              field={field}
              label="Notes"
              placeholder="Any additional details about this account"
              disabled={readOnly}
            />
          )}
        </form.Field>

        {!readOnly && onAttachmentsChange && (
          <FilePicker
            label="Statements & Documents"
            value={attachments ?? []}
            onChange={onAttachmentsChange}
            mode="all"
            maxFiles={5}
            placeholder="Add statements or documents"
            helpText="Attach account statements, debit cards, or other documents"
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
              title="Delete Account"
              variant="destructive"
              onPress={handleDelete}
            />
          </View>
        )}
    </KeyboardAwareScrollView>
  );
}
