/**
 * QualityOfLifeForm - Form for "Quality of Life" wish
 *
 * Uses ReflectionChoices for condition selection where user
 * would not want aggressive treatment.
 * Task: wishes.carePrefs.qualityOfLife
 */

import type { QualityOfLifeMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { qualityOfLifeConditions } from "@/constants/wishes";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps } from "../registry";
import { generateQualityOfLifeSchema } from "../schemaGenerators";
import {
  ReflectionChoices,
  ReflectionPrompt,
} from "../shared/ReflectionChoices";
import { wishesFormStyles } from "./formStyles";

export function QualityOfLifeForm({
  wishId,
  initialData,
  onSave,
  isSaving,
  guidance,
}: WishFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !wishId;

  // Extract initial values from initialData
  const initialMetadata = initialData?.metadata as
    | QualityOfLifeMetadata
    | undefined;

  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    initialMetadata?.conditions ?? []
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? "Quality of Life" : "Edit Quality of Life",
    });
  }, [isNew, navigation]);

  const handleToggle = useCallback((id: string) => {
    setSelectedConditions((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }, []);

  const handleSave = async () => {
    const metadata: QualityOfLifeMetadata = {
      conditions: selectedConditions,
    };

    try {
      await onSave({
        title: "Quality of Life",
        notes: notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateQualityOfLifeSchema(),
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

      <ReflectionPrompt
        question="I would not want aggressive treatment if I were..."
        context="Select any that feel true for you. Leave blank if you're not sure."
      />

      <ReflectionChoices
        choices={qualityOfLifeConditions}
        selected={selectedConditions}
        onToggle={handleToggle}
      />

      <View style={wishesFormStyles.notesSection}>
        <TextArea
          label="Anything to add or clarify?"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any nuances, exceptions, or additional context..."
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

