/**
 * EndOfLifeSettingForm - Form for "End-of-Life Setting" wish
 *
 * Captures preferred location for end-of-life care and atmosphere preferences.
 * Task: wishes.endOfLife.setting
 *
 * Auto-save enabled - changes are saved automatically after 600ms of inactivity.
 */

import type { EndOfLifeSettingMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useNavigation } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps, WishSaveData } from "../registry";
import { generateEndOfLifeSettingSchema } from "../schemaGenerators";
import { wishesFormStyles } from "./formStyles";

const settingOptions = [
  { value: "home", label: "At home" },
  { value: "family-home", label: "At a family member's home" },
  { value: "hospice", label: "In a hospice facility" },
  { value: "hospital", label: "In a hospital" },
  { value: "flexible", label: "Wherever makes sense at the time" },
];

interface EndOfLifeSettingFormValues {
  preferredSetting: string;
  settingNotes: string;
  visitors: string;
  music: string;
  notes: string;
}

export function EndOfLifeSettingForm({
  wishId,
  initialData,
  onFormReady,
  registerGetSaveData,
  guidance,
}: WishFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const initialMetadata = initialData?.metadata as
    | EndOfLifeSettingMetadata
    | undefined;

  const defaultValues = useMemo<EndOfLifeSettingFormValues>(
    () => ({
      preferredSetting: initialMetadata?.preferredSetting ?? "",
      settingNotes: initialMetadata?.settingNotes ?? "",
      visitors: initialMetadata?.visitors ?? "",
      music: initialMetadata?.music ?? "",
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
      const metadata: EndOfLifeSettingMetadata = {
        preferredSetting: values.preferredSetting || undefined,
        settingNotes: values.settingNotes.trim() || undefined,
        visitors: values.visitors.trim() || undefined,
        music: values.music.trim() || undefined,
      };

      return {
        title: "End-of-Life Setting",
        notes: values.notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateEndOfLifeSettingSchema(),
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: "End-of-Life Setting",
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

      <form.Field name="preferredSetting">
        {(field) => (
          <View
            style={[wishesFormStyles.fieldContainer, { marginTop: spacing.sm }]}
          >
            <Select
              label="Where would you want to be?"
              value={field.state.value}
              onValueChange={(val) => field.handleChange(val)}
              options={settingOptions}
              placeholder="Select a preference..."
            />
          </View>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.preferredSetting}>
        {(preferredSetting) =>
          preferredSetting && preferredSetting !== "flexible" ? (
            <form.Field name="settingNotes">
              {(field) => (
                <View style={wishesFormStyles.fieldContainer}>
                  <TextArea
                    label="Why this choice?"
                    value={field.state.value}
                    onChangeText={(text) => field.handleChange(text)}
                    placeholder="What makes this setting feel right for you?"
                    maxLength={1000}
                  />
                </View>
              )}
            </form.Field>
          ) : null
        }
      </form.Subscribe>

      <Text style={wishesFormStyles.sectionHeader}>Who should be there?</Text>

      <form.Field name="visitors">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Visitors and presence"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder="Who would you want nearby? Anyone you'd prefer not to have there?"
              maxLength={1000}
            />
          </View>
        )}
      </form.Field>

      <Text style={wishesFormStyles.sectionHeader}>Atmosphere</Text>

      <form.Field name="music">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Music, readings, or ambiance"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder="Any songs, prayers, or atmosphere that would bring comfort?"
              maxLength={1000}
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
              placeholder="Anything else about your end-of-life setting preferences..."
              maxLength={2000}
            />
          </View>
        )}
      </form.Field>
    </KeyboardAwareScrollView>
  );
}
