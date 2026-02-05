/**
 * ServicePreferencesForm - Form for "Service or Remembrance" wish
 *
 * Captures memorial service preferences including type, tone, and special requests.
 * Task: wishes.endOfLife.service
 */

import type { ServicePreferencesMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { Input } from "@/components/ui/Input";
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
import { generateServicePreferencesSchema } from "../schemaGenerators";

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

export function ServicePreferencesForm({
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
    | ServicePreferencesMetadata
    | undefined;

  const [serviceType, setServiceType] = useState(
    initialMetadata?.serviceType ?? "",
  );
  const [tone, setTone] = useState(initialMetadata?.tone ?? "");
  const [location, setLocation] = useState(initialMetadata?.location ?? "");
  const [music, setMusic] = useState(initialMetadata?.music ?? "");
  const [readings, setReadings] = useState(initialMetadata?.readings ?? "");
  const [speakers, setSpeakers] = useState(initialMetadata?.speakers ?? "");
  const [avoidances, setAvoidances] = useState(
    initialMetadata?.avoidances ?? "",
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? "Service Preferences" : "Edit Service Preferences",
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    const metadata: ServicePreferencesMetadata = {
      serviceType: serviceType || undefined,
      tone: tone || undefined,
      location: location.trim() || undefined,
      music: music.trim() || undefined,
      readings: readings.trim() || undefined,
      speakers: speakers.trim() || undefined,
      avoidances: avoidances.trim() || undefined,
    };

    try {
      await onSave({
        title: "Service or Remembrance",
        notes: notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateServicePreferencesSchema(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save your preferences";
      Alert.alert("Error", message);
    }
  };

  const showServiceDetails = serviceType && serviceType !== "none";

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
          label="What type of service would you want?"
          value={serviceType}
          onValueChange={setServiceType}
          options={serviceTypeOptions}
          placeholder="Select..."
        />
      </View>

      {showServiceDetails && (
        <>
          <View style={wishesFormStyles.fieldContainer}>
            <Select
              label="What tone feels right?"
              value={tone}
              onValueChange={setTone}
              options={toneOptions}
              placeholder="Select..."
            />
          </View>

          <View style={wishesFormStyles.fieldContainer}>
            <Input
              label="Where should it be held?"
              value={location}
              onChangeText={setLocation}
              placeholder="Church, funeral home, park, favorite restaurant..."
            />
          </View>

          <Text style={wishesFormStyles.sectionHeader}>Personal touches</Text>

          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Music or songs"
              value={music}
              onChangeText={setMusic}
              placeholder="Any songs that should be played? Music to avoid?"
              maxLength={1000}
            />
          </View>

          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Readings or poems"
              value={readings}
              onChangeText={setReadings}
              placeholder="Scripture, poems, or passages that matter to you"
              maxLength={1000}
            />
          </View>

          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Who should speak?"
              value={speakers}
              onChangeText={setSpeakers}
              placeholder="Anyone you'd want to give a eulogy or share memories?"
              maxLength={1000}
            />
          </View>

          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Anything to avoid?"
              value={avoidances}
              onChangeText={setAvoidances}
              placeholder="Open casket? Certain songs? Anything that would feel wrong?"
              maxLength={1000}
            />
          </View>
        </>
      )}

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Additional notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any other wishes for how you want to be remembered..."
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

