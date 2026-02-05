/**
 * HardSituationsForm - Form for "Hard Situations" wish
 *
 * Captures guidance for handling conflicts and difficult decisions.
 * Task: wishes.values.hardSituations
 */

import type { HardSituationsMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps } from "../registry";
import { generateHardSituationsSchema } from "../schemaGenerators";
import { wishesFormStyles } from "./formStyles";

export function HardSituationsForm({
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
    | HardSituationsMetadata
    | undefined;

  const [decisionMaker, setDecisionMaker] = useState(
    initialMetadata?.decisionMaker ?? "",
  );
  const [disagreements, setDisagreements] = useState(
    initialMetadata?.disagreements ?? "",
  );
  const [conflictGuidance, setConflictGuidance] = useState(
    initialMetadata?.conflictGuidance ?? "",
  );
  const [grace, setGrace] = useState(initialMetadata?.grace ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? "Hard Situations" : "Edit Hard Situations",
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    const metadata: HardSituationsMetadata = {
      decisionMaker: decisionMaker.trim() || undefined,
      disagreements: disagreements.trim() || undefined,
      conflictGuidance: conflictGuidance.trim() || undefined,
      grace: grace.trim() || undefined,
    };

    try {
      await onSave({
        title: "Hard Situations",
        notes: notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateHardSituationsSchema(),
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

      <View
        style={[wishesFormStyles.fieldContainer, { marginTop: spacing.sm }]}
      >
        <Input
          label="Who should make decisions if people disagree?"
          value={decisionMaker}
          onChangeText={setDecisionMaker}
          placeholder="Name of the person you trust most"
        />
      </View>

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Why this person?"
          value={disagreements}
          onChangeText={setDisagreements}
          placeholder="What makes them the right choice? This explanation can help others accept their leadership."
          maxLength={1500}
        />
      </View>

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="How should disagreements be handled?"
          value={conflictGuidance}
          onChangeText={setConflictGuidance}
          placeholder="Should the designated person have final say? Should there be a family vote? What matters more — consensus or action?"
          maxLength={2000}
        />
      </View>

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Grace to extend"
          value={grace}
          onChangeText={setGrace}
          placeholder="Are there any relationships that need healing? Forgiveness to offer? Permission to let go of old hurts?"
          maxLength={2000}
        />
      </View>

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Additional guidance"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything else that might help during difficult moments..."
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
