/**
 * QualityOfLifeForm - Form for "Quality of Life" wish
 *
 * Uses ReflectionChoices for condition selection where user
 * would not want aggressive treatment.
 * Task: wishes.carePrefs.qualityOfLife
 *
 * Auto-save enabled - changes are saved automatically after 600ms of inactivity.
 */

import type { QualityOfLifeMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { usePerspective } from "@/contexts/LocaleContext";
import { qualityOfLifeConditions } from "@/constants/wishes";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useNavigation } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps, WishSaveData } from "../registry";
import { generateQualityOfLifeSchema } from "../schemaGenerators";
import {
  ReflectionChoices,
  ReflectionPrompt,
} from "../shared/ReflectionChoices";
import { wishesFormStyles } from "./formStyles";

const formText = {
  owner: {
    question: "I would not want aggressive treatment if I were...",
    context: "Select any that feel true for you. Leave blank if you're not sure.",
  },
  family: {
    question: "They would not want aggressive treatment if they were...",
    context: "These are the conditions they selected. Left blank if unsure.",
  },
};

interface QualityOfLifeFormValues {
  selectedConditions: string[];
  notes: string;
}

export function QualityOfLifeForm({
  wishId,
  initialData,
  onFormReady,
  registerGetSaveData,
  guidance,
}: WishFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { perspective } = usePerspective();
  const t = formText[perspective];

  const initialMetadata = initialData?.metadata as
    | QualityOfLifeMetadata
    | undefined;

  const defaultValues = useMemo<QualityOfLifeFormValues>(
    () => ({
      selectedConditions: initialMetadata?.conditions ?? [],
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
      const metadata: QualityOfLifeMetadata = {
        conditions: values.selectedConditions,
      };

      return {
        title: "Quality of Life",
        notes: values.notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateQualityOfLifeSchema(),
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: "Quality of Life",
    });
  }, [navigation]);

  const handleToggle = useCallback(
    (id: string) => {
      const currentValues = form.getFieldValue("selectedConditions");
      const newValues = currentValues.includes(id)
        ? currentValues.filter((v) => v !== id)
        : [...currentValues, id];
      form.setFieldValue("selectedConditions", newValues);
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
        question={t.question}
        context={t.context}
      />

      <form.Field name="selectedConditions">
        {(field) => (
          <ReflectionChoices
            choices={qualityOfLifeConditions}
            selected={field.state.value}
            onToggle={handleToggle}
          />
        )}
      </form.Field>

      <form.Field name="notes">
        {(field) => (
          <TextArea
            label="Anything to add or clarify?"
            value={field.state.value}
            onChangeText={(text) => field.handleChange(text)}
            placeholder="Any nuances, exceptions, or additional context..."
            maxLength={2000}
            containerStyle={wishesFormStyles.notesSection}
          />
        )}
      </form.Field>
    </KeyboardAwareScrollView>
  );
}
