/**
 * EndOfLifeSettingForm - Form for "End-of-Life Setting" wish
 *
 * Captures preferred location for end-of-life care and atmosphere preferences.
 * Task: wishes.endOfLife.setting
 */

import type { EndOfLifeSettingMetadata } from "@/api/types";
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
import { generateEndOfLifeSettingSchema } from "../schemaGenerators";
import { wishesFormStyles } from "./formStyles";

const settingOptions = [
  { value: "home", label: "At home" },
  { value: "family-home", label: "At a family member's home" },
  { value: "hospice", label: "In a hospice facility" },
  { value: "hospital", label: "In a hospital" },
  { value: "flexible", label: "Wherever makes sense at the time" },
];

export function EndOfLifeSettingForm({
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
    | EndOfLifeSettingMetadata
    | undefined;

  const [preferredSetting, setPreferredSetting] = useState(
    initialMetadata?.preferredSetting ?? "",
  );
  const [settingNotes, setSettingNotes] = useState(
    initialMetadata?.settingNotes ?? "",
  );
  const [visitors, setVisitors] = useState(initialMetadata?.visitors ?? "");
  const [music, setMusic] = useState(initialMetadata?.music ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? "End-of-Life Setting" : "Edit End-of-Life Setting",
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    const metadata: EndOfLifeSettingMetadata = {
      preferredSetting: preferredSetting || undefined,
      settingNotes: settingNotes.trim() || undefined,
      visitors: visitors.trim() || undefined,
      music: music.trim() || undefined,
    };

    try {
      await onSave({
        title: "End-of-Life Setting",
        notes: notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateEndOfLifeSettingSchema(),
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
          label="Where would you want to be?"
          value={preferredSetting}
          onValueChange={setPreferredSetting}
          options={settingOptions}
          placeholder="Select a preference..."
        />
      </View>

      {preferredSetting && preferredSetting !== "flexible" && (
        <View style={wishesFormStyles.fieldContainer}>
          <TextArea
            label="Why this choice?"
            value={settingNotes}
            onChangeText={setSettingNotes}
            placeholder="What makes this setting feel right for you?"
            maxLength={1000}
          />
        </View>
      )}

      <Text style={wishesFormStyles.sectionHeader}>Who should be there?</Text>

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Visitors and presence"
          value={visitors}
          onChangeText={setVisitors}
          placeholder="Who would you want nearby? Anyone you'd prefer not to have there?"
          maxLength={1000}
        />
      </View>

      <Text style={wishesFormStyles.sectionHeader}>Atmosphere</Text>

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Music, readings, or ambiance"
          value={music}
          onChangeText={setMusic}
          placeholder="Any songs, prayers, or atmosphere that would bring comfort?"
          maxLength={1000}
        />
      </View>

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Additional notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything else about your end-of-life setting preferences..."
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

