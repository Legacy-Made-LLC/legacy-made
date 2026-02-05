/**
 * FaithPreferencesForm - Form for "Faith & Spiritual Preferences" wish
 *
 * Captures religious/spiritual traditions and related ceremony preferences.
 * Task: wishes.values.faith
 */

import type { FaithPreferencesMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { faithTraditions } from "@/constants/wishes";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps } from "../registry";
import { generateFaithPreferencesSchema } from "../schemaGenerators";
import { wishesFormStyles } from "./formStyles";

export function FaithPreferencesForm({
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
    | FaithPreferencesMetadata
    | undefined;

  const [tradition, setTradition] = useState(initialMetadata?.tradition ?? "");
  const [congregation, setCongregation] = useState(
    initialMetadata?.congregation ?? "",
  );
  const [leader, setLeader] = useState(initialMetadata?.leader ?? "");
  const [leaderContact, setLeaderContact] = useState(
    initialMetadata?.leaderContact ?? "",
  );
  const [rituals, setRituals] = useState(initialMetadata?.rituals ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? "Faith & Spiritual Preferences" : "Edit Faith Preferences",
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    const metadata: FaithPreferencesMetadata = {
      tradition: tradition || undefined,
      congregation: congregation.trim() || undefined,
      leader: leader.trim() || undefined,
      leaderContact: leaderContact.trim() || undefined,
      rituals: rituals.trim() || undefined,
    };

    try {
      await onSave({
        title: "Faith & Spiritual Preferences",
        notes: notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateFaithPreferencesSchema(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save your preferences";
      Alert.alert("Error", message);
    }
  };

  const showCongregationFields =
    tradition && tradition !== "none" && tradition !== "spiritual";

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
          label="What is your faith or spiritual tradition?"
          value={tradition}
          onValueChange={setTradition}
          options={faithTraditions}
          placeholder="Select..."
        />
      </View>

      {showCongregationFields && (
        <>
          <View style={wishesFormStyles.fieldContainer}>
            <Input
              label="Place of worship"
              value={congregation}
              onChangeText={setCongregation}
              placeholder="Church, synagogue, mosque, temple name..."
            />
          </View>

          <View style={wishesFormStyles.fieldContainer}>
            <Input
              label="Religious leader name"
              value={leader}
              onChangeText={setLeader}
              placeholder="Pastor, Rabbi, Imam, Priest, etc."
            />
          </View>

          <View style={wishesFormStyles.fieldContainer}>
            <Input
              label="Leader's contact info"
              value={leaderContact}
              onChangeText={setLeaderContact}
              placeholder="Phone number or email"
            />
          </View>
        </>
      )}

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Rituals or customs to observe"
          value={rituals}
          onChangeText={setRituals}
          placeholder="Prayers, ceremonies, traditions that are important to you..."
          maxLength={2000}
        />
      </View>

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Additional notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything else about your spiritual preferences..."
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

