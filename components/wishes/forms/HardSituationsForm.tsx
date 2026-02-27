/**
 * HardSituationsForm - Form for "Hard Situations" wish
 *
 * Captures guidance for handling conflicts and difficult decisions.
 * Task: wishes.values.hardSituations
 *
 * Auto-save enabled - changes are saved automatically after 600ms of inactivity.
 */

import type { HardSituationsMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { usePerspective } from "@/contexts/LocaleContext";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useNavigation } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps, WishSaveData } from "../registry";
import { generateHardSituationsSchema } from "../schemaGenerators";
import { wishesFormStyles } from "./formStyles";

const formText = {
  owner: {
    decisionMakerPlaceholder: "Name of the person you trust most",
  },
  family: {
    decisionMakerPlaceholder: "Name of the person they trust most",
  },
};

interface HardSituationsFormValues {
  decisionMaker: string;
  disagreements: string;
  conflictGuidance: string;
  grace: string;
  notes: string;
}

export function HardSituationsForm({
  wishId,
  initialData,
  onFormReady,
  registerGetSaveData,
  guidance,
  readOnly,
}: WishFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { perspective } = usePerspective();
  const t = formText[perspective];

  const initialMetadata = initialData?.metadata as
    | HardSituationsMetadata
    | undefined;

  const defaultValues = useMemo<HardSituationsFormValues>(
    () => ({
      decisionMaker: initialMetadata?.decisionMaker ?? "",
      disagreements: initialMetadata?.disagreements ?? "",
      conflictGuidance: initialMetadata?.conflictGuidance ?? "",
      grace: initialMetadata?.grace ?? "",
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
      const metadata: HardSituationsMetadata = {
        decisionMaker: values.decisionMaker.trim() || undefined,
        disagreements: values.disagreements.trim() || undefined,
        conflictGuidance: values.conflictGuidance.trim() || undefined,
        grace: values.grace.trim() || undefined,
      };

      return {
        title: "Hard Situations",
        notes: values.notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateHardSituationsSchema(),
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: "Hard Situations",
    });
  }, [navigation]);

  return (
    <KeyboardAwareScrollView
      style={wishesFormStyles.container}
      contentContainerStyle={[
        wishesFormStyles.content,
        { paddingBottom: insets.bottom + spacing.lg },
      ]}
      bottomOffset={50}
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

      <form.Field name="decisionMaker">
        {(field) => (
          <View
            style={[wishesFormStyles.fieldContainer, { marginTop: spacing.sm }]}
          >
            <Input
              label="Who should make decisions if people disagree?"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder={t.decisionMakerPlaceholder}
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Field name="disagreements">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Why this person?"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder="What makes them the right choice? This explanation can help others accept their leadership."
              maxLength={1500}
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Field name="conflictGuidance">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="How should disagreements be handled?"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder="Should the designated person have final say? Should there be a family vote? What matters more — consensus or action?"
              maxLength={2000}
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Field name="grace">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Grace to extend"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder="Are there any relationships that need healing? Forgiveness to offer? Permission to let go of old hurts?"
              maxLength={2000}
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Field name="notes">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Additional guidance"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder="Anything else that might help during difficult moments..."
              maxLength={2000}
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>
    </KeyboardAwareScrollView>
  );
}
