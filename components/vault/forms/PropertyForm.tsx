/**
 * PropertyForm - Form for creating/editing property and vehicle entries
 */

import type { MetadataSchema } from "@/api/types";
import { FormInput, FormTextArea, propertySchema, FilePicker } from "@/components/forms";
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

const propertyTypes = [
  "Primary Home",
  "Vacation Home",
  "Rental Property",
  "Vehicle",
  "Storage Unit",
  "Land",
  "Other",
] as const;
const ownershipTypes = ["Own", "Lease", "Rent", "Finance"] as const;

/** Display schema for property metadata */
const PROPERTY_METADATA_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    responsibilityType: {
      label: "Property Type",
      order: 1,
      valueLabels: Object.fromEntries(propertyTypes.map((t) => [t, t])),
    },
    ownership: {
      label: "Ownership",
      order: 2,
      valueLabels: Object.fromEntries(ownershipTypes.map((t) => [t, t])),
    },
    addressDescription: { label: "Address/Description", order: 3 },
    lienHolder: { label: "Mortgage/Lien Holder", order: 4 },
    documentsLocation: { label: "Where Documents are Stored", order: 5 },
    keyLocation: { label: "Key/Access Location", order: 6 },
    notes: { label: "Notes", order: 7 },
  },
};

type PropertyType = (typeof propertyTypes)[number];
type OwnershipType = (typeof ownershipTypes)[number];

interface PropertyMetadata {
  responsibilityType: PropertyType;
  ownership?: OwnershipType;
  addressDescription?: string | null;
  lienHolder?: string | null;
  documentsLocation?: string | null;
  keyLocation?: string | null;
  notes?: string | null;
}

export function PropertyForm({
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

  const initialMetadata = initialData?.metadata as PropertyMetadata | undefined;

  const defaultValues = useMemo(
    () => ({
      propertyType: (initialMetadata?.responsibilityType ??
        "Primary Home") as string,
      ownership: (initialMetadata?.ownership ?? "Own") as string,
      addressDescription: initialMetadata?.addressDescription ?? "",
      lienHolder: initialMetadata?.lienHolder ?? "",
      documentsLocation: initialMetadata?.documentsLocation ?? "",
      keyLocation: initialMetadata?.keyLocation ?? "",
      notes: initialMetadata?.notes ?? initialData?.notes ?? "",
    }),
    [initialData, initialMetadata],
  );

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: propertySchema,
    },
    onSubmit: async ({ value }) => {
      const metadata: PropertyMetadata = {
        responsibilityType: value.propertyType as PropertyType,
        ownership: value.ownership as OwnershipType,
        addressDescription: value.addressDescription.trim() || null,
        lienHolder: value.lienHolder.trim() || null,
        documentsLocation: value.documentsLocation.trim() || null,
        keyLocation: value.keyLocation.trim() || null,
        notes: value.notes.trim() || null,
      };

      // Generate title from type
      const title = value.propertyType;

      if (toast.isOffline()) return;

      try {
        await onSave({
          title,
          notes: value.notes.trim() || null,
          metadata: metadata as unknown as Record<string, unknown>,
          metadataSchema: PROPERTY_METADATA_SCHEMA,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save property";
        toast.error({ message });
      }
    },
  });

  useEffect(() => {
    navigation.setOptions({
      title: readOnly ? "View Property" : isNew ? "Add Property" : "Edit Property",
    });
  }, [isNew, readOnly, navigation]);

  const handleDelete = () => {
    if (!onDelete) return;

    const propertyType = form.getFieldValue("propertyType");
    Alert.alert(
      "Delete Property",
      `Are you sure you want to delete this ${propertyType || "item"}?`,
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
                  : "Failed to delete property";
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
        <form.Field name="propertyType">
          {(field) => (
            <View style={formStyles.fieldContainer}>
              <Text style={formStyles.label}>Property Type</Text>
              <View style={formStyles.typeGrid}>
                {propertyTypes.map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      formStyles.typeButton,
                      field.state.value === type &&
                        formStyles.typeButtonSelected,
                    ]}
                    onPress={() => field.handleChange(type)}
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

        <form.Field name="ownership">
          {(field) => (
            <View style={formStyles.fieldContainer}>
              <Text style={formStyles.label}>Ownership</Text>
              <View style={formStyles.typeGrid}>
                {ownershipTypes.map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      formStyles.typeButton,
                      field.state.value === type &&
                        formStyles.typeButtonSelected,
                    ]}
                    onPress={() => field.handleChange(type)}
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

        <form.Field name="addressDescription">
          {(field) => (
            <FormInput
              field={field}
              label="Address/Description"
              placeholder="e.g., 123 Main St or 2021 Honda CR-V"
            />
          )}
        </form.Field>

        <form.Field name="lienHolder">
          {(field) => (
            <FormInput
              field={field}
              label="Mortgage/Lien Holder"
              placeholder="e.g., Wells Fargo, Toyota Financial"
            />
          )}
        </form.Field>

        <form.Field name="documentsLocation">
          {(field) => (
            <FormInput
              field={field}
              label="Where Documents are Stored"
              placeholder="e.g., Filing cabinet, safe deposit box"
            />
          )}
        </form.Field>

        <form.Field name="keyLocation">
          {(field) => (
            <FormInput
              field={field}
              label="Key/Access Location"
              placeholder="e.g., Kitchen drawer, with neighbor"
            />
          )}
        </form.Field>

        <form.Field name="notes">
          {(field) => (
            <FormTextArea
              field={field}
              label="Notes"
              placeholder="e.g. HOA, utilities, alarm codes, etc."
            />
          )}
        </form.Field>

        {!readOnly && onAttachmentsChange && (
          <FilePicker
            label="Photos & Documents"
            value={attachments ?? []}
            onChange={onAttachmentsChange}
            mode="all"
            maxFiles={10}
            placeholder="Add photos or documents"
            helpText="Attach photos of the property, vehicle, or related documents"
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
        )}

        {!readOnly && !isNew && onDelete && (
          <View style={formStyles.deleteContainer}>
            <Button
              title="Delete Property"
              variant="destructive"
              onPress={handleDelete}
            />
          </View>
        )}
    </KeyboardAwareScrollView>
  );
}
