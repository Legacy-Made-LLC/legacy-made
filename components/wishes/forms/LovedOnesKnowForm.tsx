/**
 * LovedOnesKnowForm - Form for "What Loved Ones Should Know" wish
 *
 * Captures gratitude, regrets, wisdom, and memories to share with family.
 * Task: wishes.values.lovedOnesKnow
 *
 * Auto-save enabled - changes are saved automatically after 600ms of inactivity.
 */

import type { LovedOnesKnowMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { usePerspective } from "@/contexts/LocaleContext";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useNavigation } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps, WishSaveData } from "../registry";
import { generateLovedOnesKnowSchema } from "../schemaGenerators";
import { wishesFormStyles } from "./formStyles";

const formText = {
  owner: {
    intro: "These words are a gift \u2014 to you for saying them, and to those closest to you for receiving them. Share as much or as little as feels right.",
    gratitudePlaceholder: "What are you most grateful for? Who has made a difference in your life?",
    regretsPlaceholder: "Is there anything you wish you'd done differently? Anyone you'd want to apologize to?",
    wisdomPlaceholder: "What lessons would you want to pass on? What do you wish you'd learned sooner?",
    memoriesPlaceholder: "What moments do you treasure most? What stories do you want remembered?",
    notesPlaceholder: "Anything else you'd want those closest to you to know...",
  },
  family: {
    intro: "These words are a gift \u2014 to them for sharing, and to those closest to them for receiving them.",
    gratitudePlaceholder: "What they are most grateful for. Who has made a difference in their life.",
    regretsPlaceholder: "Anything they wish they'd done differently. Anyone they'd want to apologize to.",
    wisdomPlaceholder: "Lessons they want to pass on. What they wish they'd learned sooner.",
    memoriesPlaceholder: "Moments they treasure most. Stories they want remembered.",
    notesPlaceholder: "Anything else they want those closest to them to know...",
  },
};

interface LovedOnesKnowFormValues {
  gratitude: string;
  regrets: string;
  wisdom: string;
  memories: string;
  notes: string;
}

export function LovedOnesKnowForm({
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
    | LovedOnesKnowMetadata
    | undefined;

  const defaultValues = useMemo<LovedOnesKnowFormValues>(
    () => ({
      gratitude: initialMetadata?.gratitude ?? "",
      regrets: initialMetadata?.regrets ?? "",
      wisdom: initialMetadata?.wisdom ?? "",
      memories: initialMetadata?.memories ?? "",
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
      const metadata: LovedOnesKnowMetadata = {
        gratitude: values.gratitude.trim() || undefined,
        regrets: values.regrets.trim() || undefined,
        wisdom: values.wisdom.trim() || undefined,
        memories: values.memories.trim() || undefined,
      };

      return {
        title: "What Loved Ones Should Know",
        notes: values.notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateLovedOnesKnowSchema(),
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: "What Loved Ones Should Know",
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

      <Text style={wishesFormStyles.intro}>
        {t.intro}
      </Text>

      <form.Field name="gratitude">
        {(field) => (
          <View
            style={[wishesFormStyles.fieldContainer, { marginTop: spacing.sm }]}
          >
            <TextArea
              label="Gratitude"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder={t.gratitudePlaceholder}
              maxLength={3000}
              minHeight={120}
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Field name="regrets">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Regrets or apologies"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder={t.regretsPlaceholder}
              maxLength={3000}
              minHeight={120}
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Field name="wisdom">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Wisdom to share"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder={t.wisdomPlaceholder}
              maxLength={3000}
              minHeight={120}
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Field name="memories">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Favorite memories"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder={t.memoriesPlaceholder}
              maxLength={3000}
              minHeight={120}
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Field name="notes">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Anything else"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder={t.notesPlaceholder}
              maxLength={3000}
              minHeight={100}
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>
    </KeyboardAwareScrollView>
  );
}
