/**
 * OrganDonationForm - Form for "Organ Donation" wish
 *
 * Captures organ donation preferences and registry status.
 * Task: wishes.endOfLife.organDonation
 */

import type { OrganDonationMetadata } from "@/api/types";
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
import { generateOrganDonationSchema } from "../schemaGenerators";
import { wishesFormStyles } from "./formStyles";

const decisionOptions = [
  { value: "yes-all", label: "Yes, donate anything that can help" },
  { value: "yes-specific", label: "Yes, but only specific organs" },
  { value: "research-only", label: "For medical research only" },
  { value: "no", label: "No, I don't want to donate" },
  { value: "undecided", label: "I haven't decided" },
];

const registryOptions = [
  { value: "yes", label: "Yes, I'm registered" },
  { value: "no", label: "No, not yet" },
  { value: "unsure", label: "I'm not sure" },
];

export function OrganDonationForm({
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
    | OrganDonationMetadata
    | undefined;

  const [decision, setDecision] = useState(initialMetadata?.decision ?? "");
  const [specificOrgans, setSpecificOrgans] = useState(
    initialMetadata?.specificOrgans ?? "",
  );
  const [onRegistry, setOnRegistry] = useState(
    initialMetadata?.onRegistry ?? "",
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? "Organ Donation" : "Edit Organ Donation",
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    const metadata: OrganDonationMetadata = {
      decision: decision || undefined,
      specificOrgans: specificOrgans.trim() || undefined,
      onRegistry: onRegistry || undefined,
    };

    try {
      await onSave({
        title: "Organ Donation",
        notes: notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateOrganDonationSchema(),
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
          label="What are your wishes on organ donation?"
          value={decision}
          onValueChange={setDecision}
          options={decisionOptions}
          placeholder="Select..."
        />
      </View>

      {decision === "yes-specific" && (
        <View style={wishesFormStyles.fieldContainer}>
          <TextArea
            label="Which organs or tissues?"
            value={specificOrgans}
            onChangeText={setSpecificOrgans}
            placeholder="Heart, kidneys, corneas, etc."
            maxLength={500}
          />
        </View>
      )}

      <View style={wishesFormStyles.fieldContainer}>
        <Select
          label="Are you on your state's donor registry?"
          value={onRegistry}
          onValueChange={setOnRegistry}
          options={registryOptions}
          placeholder="Select..."
        />
      </View>

      {onRegistry === "no" && (
        <View style={wishesFormStyles.infoCard}>
          <Text style={wishesFormStyles.infoText}>
            Being on the registry helps, but your family will still be asked.
            Recording your wishes here ensures they know what you want.
          </Text>
        </View>
      )}

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Additional notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any religious, cultural, or personal considerations..."
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
