/**
 * ComfortVsTreatmentForm - Form for "Comfort vs Treatment" wish
 *
 * Dropdown + selects for pain management, alertness, etc.
 * Task: wishes.carePrefs.comfortVsTreatment
 */

import type { ComfortVsTreatmentMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps } from "../registry";
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

export function ComfortVsTreatmentForm({
  wishId,
  initialData,
  onSave,
  isSaving,
  guidance,
}: WishFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !wishId;

  const initialMetadata = initialData?.metadata as
    | ComfortVsTreatmentMetadata
    | undefined;

  const [preference, setPreference] = useState(
    initialMetadata?.preference ?? "",
  );
  const [painManagement, setPainManagement] = useState(
    initialMetadata?.painManagement ?? "",
  );
  const [alertness, setAlertness] = useState(initialMetadata?.alertness ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? "Comfort vs Treatment" : "Edit Comfort vs Treatment",
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    const metadata: ComfortVsTreatmentMetadata = {
      preference: preference || undefined,
      painManagement: painManagement || undefined,
      alertness: alertness || undefined,
    };

    try {
      await onSave({
        title: "Comfort vs Treatment",
        notes: notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateComfortVsTreatmentSchema(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save your preferences";
      Alert.alert("Error", message);
    }
  };

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

      <View
        style={[wishesFormStyles.fieldContainer, { marginTop: spacing.sm }]}
      >
        <Select
          label="Overall preference"
          value={preference}
          onValueChange={setPreference}
          options={preferenceOptions}
          placeholder="Select..."
        />
      </View>

      <View style={wishesFormStyles.fieldContainer}>
        <Select
          label="Pain management approach"
          value={painManagement}
          onValueChange={setPainManagement}
          options={painManagementOptions}
          placeholder="Select..."
        />
      </View>

      <View style={wishesFormStyles.fieldContainer}>
        <Select
          label="How important is staying alert?"
          value={alertness}
          onValueChange={setAlertness}
          options={alertnessOptions}
          placeholder="Select..."
        />
      </View>

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Additional notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any other preferences about your care..."
          maxLength={2000}
        />
      </View>

      <View style={wishesFormStyles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            wishesFormStyles.primaryButton,
            pressed && wishesFormStyles.primaryButtonPressed,
            isSaving && wishesFormStyles.primaryButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text
            style={[
              wishesFormStyles.primaryButtonText,
              isSaving && wishesFormStyles.primaryButtonTextDisabled,
            ]}
          >
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>

    </KeyboardAwareScrollView>
  );
}

