/**
 * WhatMattersMostForm - Form for "What Matters Most" wish
 *
 * Uses ReflectionChoices for values selection + free text for additional thoughts.
 * Task: wishes.carePrefs.whatMatters
 *
 * Auto-save enabled - changes are saved automatically after 600ms of inactivity.
 */

import type { WhatMattersMostMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { whatMattersMostValues } from "@/constants/wishes";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useNavigation } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps, WishSaveData } from "../registry";
import { generateWhatMattersMostSchema } from "../schemaGenerators";
import {
  ReflectionChoices,
  ReflectionPrompt,
} from "../shared/ReflectionChoices";
import { wishesFormStyles } from "./formStyles";

interface WhatMattersMostFormValues {
  selectedValues: string[];
  notes: string;
}

export function WhatMattersMostForm({
  wishId,
  initialData,
  onFormReady,
  registerGetSaveData,
  guidance,
}: WishFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Extract initial values from initialData
  const initialMetadata = initialData?.metadata as
    | WhatMattersMostMetadata
    | undefined;

  const defaultValues = useMemo<WhatMattersMostFormValues>(
    () => ({
      selectedValues: initialMetadata?.values ?? [],
      notes: initialData?.notes ?? "",
    }),
    [initialMetadata, initialData?.notes]
  );

  const form = useForm({
    defaultValues,
  });

  // Register form with parent for auto-save
  useEffect(() => {
    onFormReady?.(form);
  }, [form, onFormReady]);

  // Register getSaveData function with parent
  useEffect(() => {
    const getSaveData = (): WishSaveData => {
      const values = form.state.values;
      const metadata: WhatMattersMostMetadata = {
        values: values.selectedValues,
      };

      return {
        title: "What Matters Most",
        notes: values.notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateWhatMattersMostSchema(),
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: "What Matters Most",
    });
  }, [navigation]);

  const handleToggle = useCallback(
    (id: string) => {
      const currentValues = form.getFieldValue("selectedValues");
      const newValues = currentValues.includes(id)
        ? currentValues.filter((v) => v !== id)
        : [...currentValues, id];
      form.setFieldValue("selectedValues", newValues);
    },
    [form]
  );

  return (
    <KeyboardAwareScrollView
      style={wishesFormStyles.container}
      contentContainerStyle={[
        wishesFormStyles.content,
        { paddingBottom: insets.bottom + spacing.lg },
      ]}
      bottomOffset={20}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {guidance && (
        <ExpandableGuidanceCard
          icon={guidance.icon as keyof typeof Ionicons.glyphMap}
          triggerText={guidance.triggerText}
          heading={guidance.heading}
          detail={guidance.detail}
          tips={guidance.tips}
          pacingNote={guidance.pacingNote}
          accentColor={colors.featureWishes}
          accentTint={colors.featureWishesTint}
          accentDark={colors.featureWishesDark}
        />
      )}

      <ReflectionPrompt
        question="Select anything that resonates with you:"
        context="You can choose as many or as few as feel right."
      />

      <form.Field name="selectedValues">
        {(field) => (
          <ReflectionChoices
            choices={whatMattersMostValues}
            selected={field.state.value}
            onToggle={handleToggle}
          />
        )}
      </form.Field>

      <form.Field name="notes">
        {(field) => (
          <TextArea
            label="Anything else you'd want your family to understand?"
            value={field.state.value}
            onChangeText={(text) => field.handleChange(text)}
            placeholder="In your own words, what does a meaningful life look like to you?"
            maxLength={2000}
            containerStyle={wishesFormStyles.notesSection}
          />
        )}
      </form.Field>
    </KeyboardAwareScrollView>
  );
}
