/**
 * PetForm - Form for creating/editing pet entries
 */

import type { MetadataSchema } from "@/api/types";
import {
  formatPhoneNumber,
  FormInput,
  FormTextArea,
  petSchema,
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

const speciesTypes = ["Dog", "Cat", "Bird", "Fish", "Other"] as const;

/** Display schema for pet metadata */
const PET_METADATA_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    species: {
      label: "Species",
      order: 1,
      valueLabels: Object.fromEntries(speciesTypes.map((t) => [t, t])),
    },
    breed: { label: "Breed/Description", order: 2 },
    veterinarian: { label: "Veterinarian", order: 3 },
    vetPhone: { label: "Vet Phone", order: 4 },
    designatedCaretaker: { label: "Who Will Care for Them?", order: 5 },
    careInstructions: { label: "Care Instructions", order: 6 },
  },
};

type SpeciesType = (typeof speciesTypes)[number];

interface PetMetadata {
  species: SpeciesType;
  breed?: string | null;
  veterinarian?: string | null;
  vetPhone?: string | null;
  careInstructions?: string | null;
  designatedCaretaker?: string | null;
}

export function PetForm({
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

  const initialMetadata = initialData?.metadata as PetMetadata | undefined;

  const defaultValues = useMemo(
    () => ({
      name: initialData?.title ?? "",
      species: (initialMetadata?.species ?? "Dog") as string,
      breed: initialMetadata?.breed ?? "",
      veterinarian: initialMetadata?.veterinarian ?? "",
      vetPhone: initialMetadata?.vetPhone ?? "",
      designatedCaretaker: initialMetadata?.designatedCaretaker ?? "",
      careInstructions:
        initialMetadata?.careInstructions ?? initialData?.notes ?? "",
    }),
    [initialData, initialMetadata],
  );

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: petSchema,
    },
    onSubmit: async ({ value }) => {
      const metadata: PetMetadata = {
        species: value.species as SpeciesType,
        breed: value.breed.trim() || null,
        veterinarian: value.veterinarian.trim() || null,
        vetPhone: value.vetPhone.trim() || null,
        designatedCaretaker: value.designatedCaretaker.trim() || null,
        careInstructions: value.careInstructions.trim() || null,
      };

      if (toast.isOffline()) return;

      try {
        await onSave({
          title: value.name.trim(),
          notes: value.careInstructions.trim() || null,
          metadata: metadata as unknown as Record<string, unknown>,
          metadataSchema: PET_METADATA_SCHEMA,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save pet";
        toast.error({ message });
      }
    },
  });

  useEffect(() => {
    navigation.setOptions({
      title: readOnly ? "View Pet" : isNew ? "Add Pet" : "Edit Pet",
    });
  }, [isNew, readOnly, navigation]);

  const handleDelete = () => {
    if (!onDelete) return;

    const name = form.getFieldValue("name");
    Alert.alert(
      "Delete Pet",
      `Are you sure you want to delete ${name || "this pet"}?`,
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
                err instanceof Error ? err.message : "Failed to delete pet";
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
        <form.Field name="name">
          {(field) => (
            <FormInput
              field={field}
              label="Pet Name"
              placeholder="e.g., Luna"
              autoCapitalize="words"
            />
          )}
        </form.Field>

        <form.Field name="species">
          {(field) => (
            <View style={formStyles.fieldContainer}>
              <Text style={formStyles.label}>Species</Text>
              <View style={formStyles.typeGrid}>
                {speciesTypes.map((type) => (
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

        <form.Field name="breed">
          {(field) => (
            <FormInput
              field={field}
              label="Breed/Description"
              placeholder="e.g., Golden Retriever, orange tabby"
            />
          )}
        </form.Field>

        <View style={formStyles.fieldRow}>
          <View style={formStyles.fieldRowItem}>
            <form.Field name="veterinarian">
              {(field) => (
                <FormInput
                  field={field}
                  label="Veterinarian"
                  placeholder="e.g., Bay Area Pet Hospital"
                  containerStyle={{ marginBottom: 0 }}
                />
              )}
            </form.Field>
          </View>
          <View style={formStyles.fieldRowItem}>
            <form.Field name="vetPhone">
              {(field) => (
                <FormInput
                  field={field}
                  label="Phone"
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                  onValueChange={(text) =>
                    field.handleChange(formatPhoneNumber(text))
                  }
                  containerStyle={{ marginBottom: 0 }}
                />
              )}
            </form.Field>
          </View>
        </View>

        <form.Field name="designatedCaretaker">
          {(field) => (
            <FormInput
              field={field}
              label="Who Will Care for Them?"
              placeholder="e.g., Margaret Chen"
            />
          )}
        </form.Field>

        <form.Field name="careInstructions">
          {(field) => (
            <FormTextArea
              field={field}
              label="Care Instructions"
              placeholder="Special diet, medications, routines, etc."
            />
          )}
        </form.Field>

        {!readOnly && onAttachmentsChange && (
          <FilePicker
            label="Photos & Records"
            value={attachments ?? []}
            onChange={onAttachmentsChange}
            mode="all"
            maxFiles={10}
            placeholder="Add photos or vet records"
            helpText="Attach photos of your pet, vaccination records, or other documents"
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
              title="Delete Pet"
              variant="destructive"
              onPress={handleDelete}
            />
          </View>
        )}
    </KeyboardAwareScrollView>
  );
}
