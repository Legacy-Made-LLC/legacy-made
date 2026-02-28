/**
 * PropertyForm - Form for creating/editing property and vehicle entries
 *
 * Uses a segmented control to toggle between Property and Vehicle modes.
 * The form fields adapt contextually based on the selected type.
 * Metadata field keys are unchanged for backwards compatibility.
 */

import type { EntryCompletionStatus, MetadataSchema } from "@/api/types";
import { FormInput, FormTextArea, propertySchema, FilePicker } from "@/components/forms";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { spacing } from "@/constants/theme";
import { toast } from "@/hooks/useToast";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useNavigation } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

/** Top-level type segments */
const TYPE_SEGMENTS = [
  { value: "Property", label: "Property" },
  { value: "Vehicle", label: "Vehicle" },
] as const;

/** Property sub-types shown in the dropdown when "Property" is selected */
const PROPERTY_SUBTYPES = [
  { value: "Primary Home", label: "Primary Home" },
  { value: "Vacation Home", label: "Vacation Home" },
  { value: "Rental Property", label: "Rental Property" },
  { value: "Storage Unit", label: "Storage Unit" },
  { value: "Land", label: "Land" },
  { value: "Other", label: "Other" },
] as const;

const ownershipTypes = ["Own", "Lease", "Rent", "Finance"] as const;

/**
 * All possible responsibilityType values — union of property sub-types + "Vehicle".
 * Used for the metadata schema valueLabels so existing entries display correctly.
 */
const ALL_RESPONSIBILITY_TYPES = [
  ...PROPERTY_SUBTYPES.map((s) => s.value),
  "Vehicle",
] as const;

/** Build the display schema with labels contextual to property vs vehicle */
function buildMetadataSchema(isVehicle: boolean): MetadataSchema {
  return {
    version: 1,
    fields: {
      responsibilityType: {
        label: "Type",
        order: 1,
        valueLabels: Object.fromEntries(
          ALL_RESPONSIBILITY_TYPES.map((t) => [t, t]),
        ),
      },
      ownership: {
        label: "Ownership",
        order: 2,
        valueLabels: Object.fromEntries(ownershipTypes.map((t) => [t, t])),
      },
      addressDescription: {
        label: isVehicle ? "Vehicle Description" : "Address",
        order: 3,
      },
      lienHolder: {
        label: isVehicle ? "Lien Holder" : "Mortgage/Lien Holder",
        order: 4,
      },
      documentsLocation: {
        label: isVehicle ? "Title & Documents Location" : "Where Documents are Stored",
        order: 5,
      },
      keyLocation: {
        label: isVehicle ? "Key Location" : "Key/Access Location",
        order: 6,
      },
      notes: { label: "Notes", order: 7 },
    },
  };
}

type ResponsibilityType = (typeof ALL_RESPONSIBILITY_TYPES)[number];
type OwnershipType = (typeof ownershipTypes)[number];

interface PropertyMetadata {
  responsibilityType: ResponsibilityType;
  ownership?: OwnershipType;
  addressDescription?: string | null;
  lienHolder?: string | null;
  documentsLocation?: string | null;
  keyLocation?: string | null;
  notes?: string | null;
}

/**
 * Derive the top-level segment from the stored responsibilityType.
 * "Vehicle" → Vehicle; anything else → Property.
 */
function deriveTopLevelType(responsibilityType: string | undefined): "Property" | "Vehicle" {
  return responsibilityType === "Vehicle" ? "Vehicle" : "Property";
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
  onFormReady,
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;
  const completionStatusRef = useRef<EntryCompletionStatus>("complete");

  const initialMetadata = initialData?.metadata as PropertyMetadata | undefined;

  // Track the top-level segment (Property vs Vehicle) as local state,
  // derived from the stored responsibilityType for existing entries.
  const [topLevelType, setTopLevelType] = useState<"Property" | "Vehicle">(
    () => deriveTopLevelType(initialMetadata?.responsibilityType),
  );
  const isVehicle = topLevelType === "Vehicle";

  // Track the last-used property sub-type so switching back from Vehicle
  // restores the previous selection instead of always resetting to "Primary Home".
  const lastPropertySubtypeRef = useRef<string>(
    initialMetadata?.responsibilityType === "Vehicle"
      ? "Primary Home"
      : (initialMetadata?.responsibilityType ?? "Primary Home"),
  );

  const defaultValues = useMemo(
    () => ({
      // The propertyType field stores the responsibilityType value that gets saved.
      // For vehicles: "Vehicle". For properties: the sub-type (e.g. "Primary Home").
      propertyType: (initialMetadata?.responsibilityType ?? "Primary Home") as string,
      ownership: (initialMetadata?.ownership ?? "Own") as string,
      addressDescription: initialMetadata?.addressDescription ?? "",
      lienHolder: initialMetadata?.lienHolder ?? "",
      documentsLocation: initialMetadata?.documentsLocation ?? "",
      keyLocation: initialMetadata?.keyLocation ?? "",
      notes: initialMetadata?.notes ?? initialData?.notes ?? "",
    }),
    [initialData, initialMetadata],
  );

  const submitForm = async (value: typeof defaultValues) => {
    const vehicleEntry = value.propertyType === "Vehicle";

    const metadata: PropertyMetadata = {
      responsibilityType: value.propertyType as ResponsibilityType,
      ownership: value.ownership as OwnershipType,
      addressDescription: value.addressDescription.trim() || null,
      lienHolder: value.lienHolder.trim() || null,
      documentsLocation: value.documentsLocation.trim() || null,
      keyLocation: value.keyLocation.trim() || null,
      notes: value.notes.trim() || null,
    };

    const title = vehicleEntry
      ? value.addressDescription.trim() || "Draft"
      : value.propertyType || "Draft";

    if (toast.isOffline()) return;

    try {
      await onSave({
        title,
        notes: value.notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: buildMetadataSchema(vehicleEntry),
        completionStatus: completionStatusRef.current,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save";
      toast.error({ message });
    }
  };

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: propertySchema,
    },
    onSubmit: async ({ value }) => submitForm(value),
  });

  // Report form instance to parent for unsaved-changes guard
  useEffect(() => {
    onFormReady?.(form);
  }, [form, onFormReady]);

  // Contextual header title
  useEffect(() => {
    const typeLabel = isVehicle ? "Vehicle" : "Property";
    const prefix = readOnly ? "View" : isNew ? "Add" : "Edit";
    navigation.setOptions({ title: `${prefix} ${typeLabel}` });
  }, [isNew, readOnly, isVehicle, navigation]);

  /** Handle top-level segment change */
  const handleTopLevelChange = (segment: string) => {
    if (segment === "Vehicle") {
      // Remember current property sub-type before switching
      const currentValue = form.getFieldValue("propertyType");
      if (currentValue !== "Vehicle") {
        lastPropertySubtypeRef.current = currentValue;
      }
      form.setFieldValue("propertyType", "Vehicle");
      setTopLevelType("Vehicle");
    } else {
      // Restore the last-used property sub-type
      form.setFieldValue("propertyType", lastPropertySubtypeRef.current);
      setTopLevelType("Property");
    }
  };

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

    const typeLabel = isVehicle ? "vehicle" : "property";
    Alert.alert(
      `Delete ${isVehicle ? "Vehicle" : "Property"}`,
      `Are you sure you want to delete this ${typeLabel}?`,
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
                  : `Failed to delete ${typeLabel}`;
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
        {/* Top-level type toggle: Property vs Vehicle */}
        <View style={formStyles.fieldContainer}>
          <SegmentedControl
            options={TYPE_SEGMENTS}
            value={topLevelType}
            onValueChange={handleTopLevelChange}
            disabled={readOnly}
          />
        </View>

        {/* Property sub-type dropdown (only for properties) */}
        {!isVehicle && (
          <form.Field name="propertyType">
            {(field) => (
              <Select
                label="Property Type"
                value={field.state.value}
                onValueChange={(val) => field.handleChange(val)}
                options={PROPERTY_SUBTYPES.map((s) => ({
                  value: s.value,
                  label: s.label,
                }))}
                placeholder="Select property type..."
                disabled={readOnly}
              />
            )}
          </form.Field>
        )}

        {/* Vehicle description (only for vehicles) */}
        {isVehicle && (
          <form.Field name="addressDescription">
            {(field) => (
              <FormInput
                field={field}
                label="Vehicle Description"
                placeholder="e.g., 2021 Honda CR-V"
                disabled={readOnly}
              />
            )}
          </form.Field>
        )}

        {/* Ownership pills */}
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

        {/* Address (only for properties — vehicles use addressDescription above) */}
        {!isVehicle && (
          <form.Field name="addressDescription">
            {(field) => (
              <FormInput
                field={field}
                label="Address"
                placeholder="e.g., 123 Main St, San Francisco, CA"
                disabled={readOnly}
              />
            )}
          </form.Field>
        )}

        <form.Field name="lienHolder">
          {(field) => (
            <FormInput
              field={field}
              label={isVehicle ? "Lien Holder" : "Mortgage/Lien Holder"}
              placeholder={
                isVehicle
                  ? "e.g., Toyota Financial, paid off"
                  : "e.g., Wells Fargo"
              }
              disabled={readOnly}
            />
          )}
        </form.Field>

        <form.Field name="documentsLocation">
          {(field) => (
            <FormInput
              field={field}
              label={isVehicle ? "Title & Documents Location" : "Where Documents are Stored"}
              placeholder="e.g., Filing cabinet, safe deposit box"
              disabled={readOnly}
            />
          )}
        </form.Field>

        <form.Field name="keyLocation">
          {(field) => (
            <FormInput
              field={field}
              label={isVehicle ? "Key Location" : "Key/Access Location"}
              placeholder={
                isVehicle
                  ? "e.g., Key hook by front door, spare in kitchen drawer"
                  : "e.g., Kitchen drawer, with neighbor"
              }
              disabled={readOnly}
            />
          )}
        </form.Field>

        <form.Field name="notes">
          {(field) => (
            <FormTextArea
              field={field}
              label="Notes"
              placeholder={
                isVehicle
                  ? "e.g., Regular maintenance at Honda of SF, parking spot #12"
                  : "e.g., HOA, utilities, alarm codes, etc."
              }
              disabled={readOnly}
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
            helpText={
              isVehicle
                ? "Attach photos of the vehicle, title, or registration"
                : "Attach photos of the property or related documents"
            }
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
              title={`Delete ${isVehicle ? "Vehicle" : "Property"}`}
              variant="destructive"
              onPress={handleDelete}
            />
          </View>
        )}
    </KeyboardAwareScrollView>
  );
}
