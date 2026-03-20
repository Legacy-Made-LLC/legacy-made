/**
 * FinancialForm - Form for creating/editing financial account entries
 *
 * Auto-save enabled — the orchestrator handles saving via registerGetSaveData.
 */

import type { MetadataSchema } from "@/api/types";
import { FormInput, FormTextArea, financialSchema, FilePicker } from "@/components/forms";
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
import type { EntryFormProps, EntrySaveData } from "../registry";
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
    accountTypes: {
      label: "Account Types",
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
  accountTypes: AccountType[];
  /** @deprecated Use accountTypes instead. Kept for backward compatibility with existing entries. */
  accountType?: AccountType;
  accountOwners?: string | null;
  accountNumber?: string | null;
  contactInfo?: string | null;
  notes?: string | null;
}

export function FinancialForm({
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
  const isNew = !entryId;

  const initialMetadata = initialData?.metadata as
    | FinancialMetadata
    | undefined;

  // Migrate legacy single accountType to accountTypes array
  const initialAccountTypes: string[] =
    initialMetadata?.accountTypes ??
    (initialMetadata?.accountType ? [initialMetadata.accountType] : []);

  const defaultValues = useMemo(
    () => ({
      accountName: initialData?.title ?? "",
      institution: initialMetadata?.institution ?? "",
      accountTypes: initialAccountTypes,
      accountOwners: initialMetadata?.accountOwners ?? "",
      accountNumber: initialMetadata?.accountNumber ?? "",
      notes: initialMetadata?.notes ?? initialData?.notes ?? "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialData, initialMetadata],
  );

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: financialSchema,
    },
  });

  // Report form instance to parent for unsaved-changes guard
  useEffect(() => {
    onFormReady?.(form);
  }, [form, onFormReady]);

  // Register getSaveData for auto-save orchestrator
  useEffect(() => {
    const getSaveData = (): EntrySaveData | null => {
      const value = form.state.values;
      const selectedTypes = value.accountTypes as AccountType[];
      const metadata: FinancialMetadata = {
        institution: value.institution.trim(),
        accountTypes: selectedTypes.length > 0 ? selectedTypes : ["Other"],
        accountOwners: value.accountOwners.trim() || null,
        accountNumber: value.accountNumber.trim() || null,
        notes: value.notes.trim() || null,
      };

      const typesLabel = selectedTypes.join(", ");
      const title =
        value.accountName.trim() ||
        `${value.institution.trim()} ${typesLabel}`.trim() ||
        "Draft";

      return {
        title,
        notes: value.notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: FINANCIAL_METADATA_SCHEMA,
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: readOnly ? "View Account" : isNew ? "Add Account" : "Edit Account",
    });
  }, [isNew, readOnly, navigation]);

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
      bottomOffset={50}
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

        <form.Field name="accountTypes">
          {(field) => {
            const selected = field.state.value as string[];
            const toggleType = (type: string) => {
              if (readOnly) return;
              const updated = selected.includes(type)
                ? selected.filter((t) => t !== type)
                : [...selected, type];
              field.handleChange(updated);
              onDiscreteChange?.();
            };
            return (
              <View style={formStyles.fieldContainer}>
                <Text style={formStyles.label}>Account Types</Text>
                <View style={formStyles.typeGrid}>
                  {accountTypes.map((type) => (
                    <Pressable
                      key={type}
                      style={[
                        formStyles.typeButton,
                        selected.includes(type) &&
                          formStyles.typeButtonSelected,
                      ]}
                      onPress={() => toggleType(type)}
                    >
                      <Text
                        style={[
                          formStyles.typeButtonText,
                          selected.includes(type) &&
                            formStyles.typeButtonTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          }}
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
