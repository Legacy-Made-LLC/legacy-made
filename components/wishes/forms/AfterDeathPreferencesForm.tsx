/**
 * AfterDeathPreferencesForm - Form for "After-Death Preferences" wish
 *
 * Captures burial/cremation preferences and pre-arrangement details.
 * Task: wishes.endOfLife.afterDeath
 */

import type { AfterDeathMetadata } from "@/api/types";
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
import { wishesFormStyles } from "./formStyles";
import { generateAfterDeathSchema } from "../schemaGenerators";

const dispositionOptions = [
  { value: "burial", label: "Traditional burial" },
  { value: "cremation", label: "Cremation" },
  { value: "green-burial", label: "Green/natural burial" },
  { value: "donation", label: "Whole body donation to science" },
  { value: "flexible", label: "Whatever my family prefers" },
  { value: "other", label: "Other" },
];

const prearrangedOptions = [
  { value: "yes", label: "Yes, it's all arranged" },
  { value: "partial", label: "Partially arranged" },
  { value: "no", label: "Not yet" },
];

export function AfterDeathPreferencesForm({
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
    | AfterDeathMetadata
    | undefined;

  const [disposition, setDisposition] = useState(
    initialMetadata?.disposition ?? "",
  );
  const [specificWishes, setSpecificWishes] = useState(
    initialMetadata?.specificWishes ?? "",
  );
  const [prearranged, setPrearranged] = useState(
    initialMetadata?.prearranged ?? "",
  );
  const [prearrangedDetails, setPrearrangedDetails] = useState(
    initialMetadata?.prearrangedDetails ?? "",
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? "After-Death Preferences" : "Edit After-Death Preferences",
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    const metadata: AfterDeathMetadata = {
      disposition: disposition || undefined,
      specificWishes: specificWishes.trim() || undefined,
      prearranged: prearranged || undefined,
      prearrangedDetails: prearrangedDetails.trim() || undefined,
    };

    try {
      await onSave({
        title: "After-Death Preferences",
        notes: notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateAfterDeathSchema(),
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
          label="What are your wishes for your body?"
          value={disposition}
          onValueChange={setDisposition}
          options={dispositionOptions}
          placeholder="Select..."
        />
      </View>

      {disposition && disposition !== "flexible" && (
        <View style={wishesFormStyles.fieldContainer}>
          <TextArea
            label="Any specific wishes?"
            value={specificWishes}
            onChangeText={setSpecificWishes}
            placeholder="Location preferences, urn/casket style, where ashes should go, etc."
            maxLength={1500}
          />
        </View>
      )}

      <Text style={wishesFormStyles.sectionHeader}>Pre-arrangements</Text>

      <View style={wishesFormStyles.fieldContainer}>
        <Select
          label="Have you made any pre-arrangements?"
          value={prearranged}
          onValueChange={setPrearranged}
          options={prearrangedOptions}
          placeholder="Select..."
        />
      </View>

      {(prearranged === "yes" || prearranged === "partial") && (
        <View style={wishesFormStyles.fieldContainer}>
          <TextArea
            label="Pre-arrangement details"
            value={prearrangedDetails}
            onChangeText={setPrearrangedDetails}
            placeholder="Funeral home name, contract details, what's been paid for..."
            maxLength={1500}
          />
        </View>
      )}

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Additional notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything else your family should know..."
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

