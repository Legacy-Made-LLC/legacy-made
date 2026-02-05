/**
 * LovedOnesKnowForm - Form for "What Loved Ones Should Know" wish
 *
 * Captures gratitude, regrets, wisdom, and memories to share with family.
 * Task: wishes.values.lovedOnesKnow
 */

import type { LovedOnesKnowMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps } from "../registry";
import { generateLovedOnesKnowSchema } from "../schemaGenerators";
import { wishesFormStyles } from "./formStyles";

export function LovedOnesKnowForm({
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
    | LovedOnesKnowMetadata
    | undefined;

  const [gratitude, setGratitude] = useState(initialMetadata?.gratitude ?? "");
  const [regrets, setRegrets] = useState(initialMetadata?.regrets ?? "");
  const [wisdom, setWisdom] = useState(initialMetadata?.wisdom ?? "");
  const [memories, setMemories] = useState(initialMetadata?.memories ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? "What Loved Ones Should Know" : "Edit Your Words",
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    const metadata: LovedOnesKnowMetadata = {
      gratitude: gratitude.trim() || undefined,
      regrets: regrets.trim() || undefined,
      wisdom: wisdom.trim() || undefined,
      memories: memories.trim() || undefined,
    };

    try {
      await onSave({
        title: "What Loved Ones Should Know",
        notes: notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateLovedOnesKnowSchema(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
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

      <Text style={wishesFormStyles.intro}>
        These words are a gift — to you for saying them, and to your family for
        receiving them. Share as much or as little as feels right.
      </Text>

      <View
        style={[wishesFormStyles.fieldContainer, { marginTop: spacing.sm }]}
      >
        <TextArea
          label="Gratitude"
          value={gratitude}
          onChangeText={setGratitude}
          placeholder="What are you most grateful for? Who has made a difference in your life?"
          maxLength={3000}
          minHeight={120}
        />
      </View>

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Regrets or apologies"
          value={regrets}
          onChangeText={setRegrets}
          placeholder="Is there anything you wish you'd done differently? Anyone you'd want to apologize to?"
          maxLength={3000}
          minHeight={120}
        />
      </View>

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Wisdom to share"
          value={wisdom}
          onChangeText={setWisdom}
          placeholder="What lessons would you want to pass on? What do you wish you'd learned sooner?"
          maxLength={3000}
          minHeight={120}
        />
      </View>

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Favorite memories"
          value={memories}
          onChangeText={setMemories}
          placeholder="What moments do you treasure most? What stories do you want remembered?"
          maxLength={3000}
          minHeight={120}
        />
      </View>

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Anything else"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything else you'd want your family to know..."
          maxLength={3000}
          minHeight={100}
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

