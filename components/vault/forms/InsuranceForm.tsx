/**
 * InsuranceForm - Form for creating/editing insurance policy entries
 */

import type { EntryCompletionStatus, MetadataSchema } from "@/api/types";
import { FormInput, FormTextArea, insuranceSchema, FilePicker } from "@/components/forms";
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

const policyTypes = [
  "Life",
  "Health",
  "Home",
  "Auto",
  "Disability",
  "Other",
] as const;

/** Display schema for insurance policy metadata */
const INSURANCE_METADATA_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    provider: { label: "Insurance Provider", order: 1 },
    policyType: {
      label: "Policy Type",
      order: 2,
      valueLabels: Object.fromEntries(policyTypes.map((t) => [t, t])),
    },
    policyNumber: { label: "Policy #", order: 3 },
    coverageDetails: { label: "Coverage", order: 4 },
    beneficiaries: { label: "Beneficiaries", order: 5 },
    agentName: { label: "Agent Name", order: 6 },
    agentPhone: { label: "Agent Phone", order: 7 },
  },
};

type PolicyType = (typeof policyTypes)[number];

interface InsuranceMetadata {
  provider: string;
  policyType: PolicyType;
  policyNumber?: string | null;
  contactInfo?: string | null;
  coverageDetails?: string | null;
  beneficiaries?: string | null;
  agentName?: string | null;
  agentPhone?: string | null;
}

export function InsuranceForm({
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

  const initialMetadata = initialData?.metadata as
    | InsuranceMetadata
    | undefined;

  const defaultValues = useMemo(
    () => ({
      provider: initialMetadata?.provider ?? "",
      policyType: (initialMetadata?.policyType ?? "Life") as string,
      policyNumber: initialMetadata?.policyNumber ?? "",
      coverageDetails: initialMetadata?.coverageDetails ?? "",
      beneficiaries: initialMetadata?.beneficiaries ?? "",
      agentName: initialMetadata?.agentName ?? "",
      agentPhone: initialMetadata?.agentPhone ?? "",
      notes: initialData?.notes ?? "",
    }),
    [initialData, initialMetadata],
  );

  const submitForm = async (value: typeof defaultValues) => {
    const metadata: InsuranceMetadata = {
      provider: value.provider.trim(),
      policyType: value.policyType as PolicyType,
      policyNumber: value.policyNumber.trim() || null,
      coverageDetails: value.coverageDetails.trim() || null,
      beneficiaries: value.beneficiaries.trim() || null,
      agentName: value.agentName.trim() || null,
      agentPhone: value.agentPhone.trim() || null,
    };

    const title =
      `${value.provider.trim()} ${value.policyType}`.trim() || "Draft";

    if (toast.isOffline()) return;

    try {
      await onSave({
        title,
        notes: value.notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: INSURANCE_METADATA_SCHEMA,
        completionStatus: completionStatusRef.current,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save policy";
      toast.error({ message });
    }
  };

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: insuranceSchema,
    },
    onSubmit: async ({ value }) => submitForm(value),
  });

  // Report form instance to parent for unsaved-changes guard
  useEffect(() => {
    onFormReady?.(form);
  }, [form, onFormReady]);

  useEffect(() => {
    navigation.setOptions({
      title: readOnly ? "View Policy" : isNew ? "Add Policy" : "Edit Policy",
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

    const provider = form.getFieldValue("provider");
    const policyType = form.getFieldValue("policyType");
    const name = provider ? `${provider} ${policyType}`.trim() : "this policy";
    Alert.alert("Delete Policy", `Are you sure you want to delete ${name}?`, [
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
              err instanceof Error ? err.message : "Failed to delete policy";
            toast.error({ message });
          }
        },
      },
    ]);
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
        <form.Field name="provider">
          {(field) => (
            <FormInput
              field={field}
              label="Insurance Provider"
              placeholder="e.g., State Farm, MetLife, etc."
              disabled={readOnly}
            />
          )}
        </form.Field>

        <form.Field name="policyType">
          {(field) => (
            <View style={formStyles.fieldContainer}>
              <Text style={formStyles.label}>Policy Type</Text>
              <View style={formStyles.typeGrid}>
                {policyTypes.map((type) => (
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

        <View style={formStyles.fieldRow}>
          <View style={formStyles.fieldRowItem}>
            <form.Field name="policyNumber">
              {(field) => (
                <FormInput
                  field={field}
                  label="Policy #"
                  placeholder="e.g., LF-2847592"
                  containerStyle={{ marginBottom: 0 }}
                  disabled={readOnly}
                />
              )}
            </form.Field>
          </View>
          <View style={formStyles.fieldRowItem}>
            <form.Field name="coverageDetails">
              {(field) => (
                <FormInput
                  field={field}
                  label="Coverage"
                  placeholder="e.g., $500,000"
                  containerStyle={{ marginBottom: 0 }}
                  disabled={readOnly}
                />
              )}
            </form.Field>
          </View>
        </View>

        <form.Field name="beneficiaries">
          {(field) => (
            <FormInput
              field={field}
              label="Beneficiaries"
              placeholder="e.g., Jane Doe, John Doe"
              disabled={readOnly}
            />
          )}
        </form.Field>

        <View style={formStyles.fieldRow}>
          <View style={formStyles.fieldRowItem}>
            <form.Field name="agentName">
              {(field) => (
                <FormInput
                  field={field}
                  label="Agent Name"
                  placeholder="e.g., John Smith"
                  containerStyle={{ marginBottom: 0 }}
                  disabled={readOnly}
                />
              )}
            </form.Field>
          </View>
          <View style={formStyles.fieldRowItem}>
            <form.Field name="agentPhone">
              {(field) => (
                <FormInput
                  field={field}
                  label="Agent Phone"
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                  containerStyle={{ marginBottom: 0 }}
                  disabled={readOnly}
                />
              )}
            </form.Field>
          </View>
        </View>

        <form.Field name="notes">
          {(field) => (
            <FormTextArea
              field={field}
              label="Notes"
              placeholder="i.e. physical location, contact information, etc."
              disabled={readOnly}
            />
          )}
        </form.Field>

        {!readOnly && onAttachmentsChange && (
          <FilePicker
            label="Policy Documents"
            value={attachments ?? []}
            onChange={onAttachmentsChange}
            mode="all"
            maxFiles={5}
            placeholder="Add policy documents or ID cards"
            helpText="Attach scans of insurance cards, policy documents, or related files"
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
                    disabled={busy}
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
              title="Delete Policy"
              variant="destructive"
              onPress={handleDelete}
            />
          </View>
        )}
    </KeyboardAwareScrollView>
  );
}
