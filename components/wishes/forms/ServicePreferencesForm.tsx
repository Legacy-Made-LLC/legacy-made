/**
 * ServicePreferencesForm - Form for "Service or Remembrance" wish
 *
 * Captures memorial service preferences including type, tone, and special requests.
 * Task: wishes.endOfLife.service
 *
 * Auto-save enabled - changes are saved automatically after 600ms of inactivity.
 */

import type { ServicePreferencesMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
import { generateServicePreferencesSchema } from "../schemaGenerators";
import { wishesFormStyles } from "./formStyles";

const formText = {
  owner: {
    serviceTypeLabel: "What type of service would you want?",
    readingsPlaceholder: "Scripture, poems, or passages that matter to you",
    speakersPlaceholder: "Anyone you'd want to give a eulogy or share memories?",
    notesPlaceholder: "Any other wishes for how you want to be remembered...",
  },
  family: {
    serviceTypeLabel: "What type of service would they want?",
    readingsPlaceholder: "Scripture, poems, or passages that matter to them",
    speakersPlaceholder: "Anyone they'd want to give a eulogy or share memories?",
    notesPlaceholder: "Any other wishes for how they want to be remembered...",
  },
};

const serviceTypeOptions = [
  { value: "traditional-funeral", label: "Traditional funeral service" },
  { value: "celebration-of-life", label: "Celebration of life" },
  { value: "memorial", label: "Memorial service (no body present)" },
  { value: "graveside", label: "Graveside service only" },
  { value: "private", label: "Private family gathering" },
  { value: "none", label: "No service" },
  { value: "flexible", label: "Whatever my family wants" },
];

const toneOptions = [
  { value: "solemn", label: "Solemn and traditional" },
  { value: "warm", label: "Warm and personal" },
  { value: "celebratory", label: "Celebratory — a real party" },
  { value: "religious", label: "Religious/spiritual focus" },
  { value: "mixed", label: "Mix of mourning and celebration" },
];

interface ServicePreferencesFormValues {
  serviceType: string;
  tone: string;
  location: string;
  music: string;
  readings: string;
  speakers: string;
  avoidances: string;
  notes: string;
}

export function ServicePreferencesForm({
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
    | ServicePreferencesMetadata
    | undefined;

  const defaultValues = useMemo<ServicePreferencesFormValues>(
    () => ({
      serviceType: initialMetadata?.serviceType ?? "",
      tone: initialMetadata?.tone ?? "",
      location: initialMetadata?.location ?? "",
      music: initialMetadata?.music ?? "",
      readings: initialMetadata?.readings ?? "",
      speakers: initialMetadata?.speakers ?? "",
      avoidances: initialMetadata?.avoidances ?? "",
      notes: initialData?.notes ?? "",
    }),
    [initialMetadata, initialData?.notes],
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
      const metadata: ServicePreferencesMetadata = {
        serviceType: values.serviceType || undefined,
        tone: values.tone || undefined,
        location: values.location.trim() || undefined,
        music: values.music.trim() || undefined,
        readings: values.readings.trim() || undefined,
        speakers: values.speakers.trim() || undefined,
        avoidances: values.avoidances.trim() || undefined,
      };

      return {
        title: "Service or Remembrance",
        notes: values.notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateServicePreferencesSchema(),
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: "Service Preferences",
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

      <form.Field name="serviceType">
        {(field) => (
          <View
            style={[wishesFormStyles.fieldContainer, { marginTop: spacing.sm }]}
          >
            <Select
              label={t.serviceTypeLabel}
              value={field.state.value}
              onValueChange={(val) => field.handleChange(val)}
              options={serviceTypeOptions}
              placeholder="Select..."
              clearable
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.serviceType}>
        {(serviceType) =>
          serviceType && serviceType !== "none" ? (
            <>
              <form.Field name="tone">
                {(field) => (
                  <View style={wishesFormStyles.fieldContainer}>
                    <Select
                      label="What tone feels right?"
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val)}
                      options={toneOptions}
                      placeholder="Select..."
                      clearable
                      disabled={readOnly}
                    />
                  </View>
                )}
              </form.Field>

              <form.Field name="location">
                {(field) => (
                  <View style={wishesFormStyles.fieldContainer}>
                    <Input
                      label="Where should it be held?"
                      value={field.state.value}
                      onChangeText={(text) => field.handleChange(text)}
                      placeholder="Church, funeral home, park, favorite restaurant..."
                      disabled={readOnly}
                    />
                  </View>
                )}
              </form.Field>

              <Text style={wishesFormStyles.sectionHeader}>
                Personal touches
              </Text>

              <form.Field name="music">
                {(field) => (
                  <View style={wishesFormStyles.fieldContainer}>
                    <TextArea
                      label="Music or songs"
                      value={field.state.value}
                      onChangeText={(text) => field.handleChange(text)}
                      placeholder="Any songs that should be played? Music to avoid?"
                      maxLength={1000}
                      disabled={readOnly}
                    />
                  </View>
                )}
              </form.Field>

              <form.Field name="readings">
                {(field) => (
                  <View style={wishesFormStyles.fieldContainer}>
                    <TextArea
                      label="Readings or poems"
                      value={field.state.value}
                      onChangeText={(text) => field.handleChange(text)}
                      placeholder={t.readingsPlaceholder}
                      maxLength={1000}
                      disabled={readOnly}
                    />
                  </View>
                )}
              </form.Field>

              <form.Field name="speakers">
                {(field) => (
                  <View style={wishesFormStyles.fieldContainer}>
                    <TextArea
                      label="Who should speak?"
                      value={field.state.value}
                      onChangeText={(text) => field.handleChange(text)}
                      placeholder={t.speakersPlaceholder}
                      maxLength={1000}
                      disabled={readOnly}
                    />
                  </View>
                )}
              </form.Field>

              <form.Field name="avoidances">
                {(field) => (
                  <View style={wishesFormStyles.fieldContainer}>
                    <TextArea
                      label="Anything to avoid?"
                      value={field.state.value}
                      onChangeText={(text) => field.handleChange(text)}
                      placeholder="Open casket? Certain songs? Anything that would feel wrong?"
                      maxLength={1000}
                      disabled={readOnly}
                    />
                  </View>
                )}
              </form.Field>
            </>
          ) : null
        }
      </form.Subscribe>

      <form.Field name="notes">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Additional notes"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder={t.notesPlaceholder}
              maxLength={2000}
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>
    </KeyboardAwareScrollView>
  );
}
