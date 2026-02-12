/**
 * ComfortVsTreatmentForm - Form for "Comfort vs Treatment" wish
 *
 * Dropdown + selects for pain management, alertness, etc.
 * Task: wishes.carePrefs.comfortVsTreatment
 *
 * Auto-save enabled - changes are saved automatically after 600ms of inactivity.
 */

import type { ComfortVsTreatmentMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useNavigation } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps, WishSaveData } from "../registry";
import { generateComfortVsTreatmentSchema } from "../schemaGenerators";
import { wishesFormStyles } from "./formStyles";

const preferenceOptions = [
  {
    value: "comfort-first",
    label: "Prioritize comfort, even if it shortens life",
  },
  { value: "balanced", label: "Balance between comfort and treatment" },
  {
    value: "treatment-first",
    label: "Prioritize treatment, even if uncomfortable",
  },
  { value: "trust-team", label: "I trust my care team to decide" },
];

const painManagementOptions = [
  {
    value: "full-relief",
    label: "Full pain relief, even if it causes drowsiness",
  },
  {
    value: "balanced-relief",
    label: "Balanced — manage pain but keep me somewhat alert",
  },
  {
    value: "minimal-meds",
    label: "Minimal medication — I want to stay as alert as possible",
  },
];

const alertnessOptions = [
  { value: "very", label: "Very important — I want to be conscious and aware" },
  {
    value: "somewhat",
    label: "Somewhat — if possible, but comfort comes first",
  },
  { value: "not", label: "Not important — comfort is all that matters" },
];

interface ComfortVsTreatmentFormValues {
  preference: string;
  painManagement: string;
  alertness: string;
  notes: string;
}

export function ComfortVsTreatmentForm({
  wishId,
  initialData,
  onFormReady,
  registerGetSaveData,
  guidance,
}: WishFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const initialMetadata = initialData?.metadata as
    | ComfortVsTreatmentMetadata
    | undefined;

  const defaultValues = useMemo<ComfortVsTreatmentFormValues>(
    () => ({
      preference: initialMetadata?.preference ?? "",
      painManagement: initialMetadata?.painManagement ?? "",
      alertness: initialMetadata?.alertness ?? "",
      notes: initialData?.notes ?? "",
    }),
    [initialMetadata, initialData?.notes],
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
      const metadata: ComfortVsTreatmentMetadata = {
        preference: values.preference || undefined,
        painManagement: values.painManagement || undefined,
        alertness: values.alertness || undefined,
      };

      return {
        title: "Comfort vs Treatment",
        notes: values.notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateComfortVsTreatmentSchema(),
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: "Comfort vs Treatment",
    });
  }, [navigation]);

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

      <form.Field name="preference">
        {(field) => (
          <View
            style={[wishesFormStyles.fieldContainer, { marginTop: spacing.sm }]}
          >
            <Select
              label="Overall preference"
              value={field.state.value}
              onValueChange={(val) => field.handleChange(val)}
              options={preferenceOptions}
              placeholder="Select..."
              clearable
            />
          </View>
        )}
      </form.Field>

      <form.Field name="painManagement">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <Select
              label="Pain management approach"
              value={field.state.value}
              onValueChange={(val) => field.handleChange(val)}
              options={painManagementOptions}
              placeholder="Select..."
              clearable
            />
          </View>
        )}
      </form.Field>

      <form.Field name="alertness">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <Select
              label="How important is staying alert?"
              value={field.state.value}
              onValueChange={(val) => field.handleChange(val)}
              options={alertnessOptions}
              placeholder="Select..."
              clearable
            />
          </View>
        )}
      </form.Field>

      <form.Field name="notes">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Additional notes"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder="Any other preferences about your care..."
              maxLength={2000}
            />
          </View>
        )}
      </form.Field>
    </KeyboardAwareScrollView>
  );
}
