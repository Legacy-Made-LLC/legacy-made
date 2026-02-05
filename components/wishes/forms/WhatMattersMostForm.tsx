/**
 * WhatMattersMostForm - Form for "What Matters Most" wish
 *
 * Uses ReflectionChoices for values selection + free text for additional thoughts.
 * Task: wishes.carePrefs.whatMatters
 */

import type { WhatMattersMostMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { whatMattersMostValues } from "@/constants/wishes";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps } from "../registry";
import { generateWhatMattersMostSchema } from "../schemaGenerators";
import {
  ReflectionChoices,
  ReflectionPrompt,
} from "../shared/ReflectionChoices";
import { wishesFormStyles } from "./formStyles";

export function WhatMattersMostForm({
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
    | WhatMattersMostMetadata
    | undefined;

  const [selectedValues, setSelectedValues] = useState<string[]>(
    initialMetadata?.values ?? [],
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? "What Matters Most" : "Edit What Matters Most",
    });
  }, [isNew, navigation]);

  const handleToggle = useCallback((id: string) => {
    setSelectedValues((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }, []);

  const handleSave = async () => {
    const metadata: WhatMattersMostMetadata = {
      values: selectedValues,
    };

    try {
      await onSave({
        title: "What Matters Most",
        notes: notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateWhatMattersMostSchema(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save your preferences";
      Alert.alert("Error", message);
    }
  };

  const canSave = selectedValues.length > 0 || notes.trim();

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

      <ReflectionChoices
        choices={whatMattersMostValues}
        selected={selectedValues}
        onToggle={handleToggle}
      />

      <View style={wishesFormStyles.notesSection}>
        <TextArea
          label="Anything else you'd want your family to understand?"
          value={notes}
          onChangeText={setNotes}
          placeholder="In your own words, what does a meaningful life look like to you?"
          maxLength={2000}
        />
      </View>

      <View style={wishesFormStyles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            wishesFormStyles.primaryButton,
            pressed && wishesFormStyles.primaryButtonPressed,
            (isSaving || !canSave) && wishesFormStyles.primaryButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving || !canSave}
        >
          <Text
            style={[
              wishesFormStyles.primaryButtonText,
              (isSaving || !canSave) &&
                wishesFormStyles.primaryButtonTextDisabled,
            ]}
          >
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>

    </KeyboardAwareScrollView>
  );
}

