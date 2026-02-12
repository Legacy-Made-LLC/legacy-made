/**
 * FaithPreferencesForm - Form for "Faith & Spiritual Preferences" wish
 *
 * Captures religious/spiritual traditions and related ceremony preferences.
 * Task: wishes.values.faith
 *
 * Auto-save enabled - changes are saved automatically after 600ms of inactivity.
 */

import type { FaithPreferencesMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { faithTraditions } from "@/constants/wishes";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useNavigation } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps, WishSaveData } from "../registry";
import { generateFaithPreferencesSchema } from "../schemaGenerators";
import { wishesFormStyles } from "./formStyles";

interface FaithPreferencesFormValues {
  tradition: string;
  congregation: string;
  leader: string;
  leaderContact: string;
  rituals: string;
  notes: string;
}

export function FaithPreferencesForm({
  wishId,
  initialData,
  onFormReady,
  registerGetSaveData,
  guidance,
}: WishFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const initialMetadata = initialData?.metadata as
    | FaithPreferencesMetadata
    | undefined;

  const defaultValues = useMemo<FaithPreferencesFormValues>(
    () => ({
      tradition: initialMetadata?.tradition ?? "",
      congregation: initialMetadata?.congregation ?? "",
      leader: initialMetadata?.leader ?? "",
      leaderContact: initialMetadata?.leaderContact ?? "",
      rituals: initialMetadata?.rituals ?? "",
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
      const metadata: FaithPreferencesMetadata = {
        tradition: values.tradition || undefined,
        congregation: values.congregation.trim() || undefined,
        leader: values.leader.trim() || undefined,
        leaderContact: values.leaderContact.trim() || undefined,
        rituals: values.rituals.trim() || undefined,
      };

      return {
        title: "Faith & Spiritual Preferences",
        notes: values.notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateFaithPreferencesSchema(),
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: "Faith & Spiritual Preferences",
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

      <form.Field name="tradition">
        {(field) => (
          <View
            style={[wishesFormStyles.fieldContainer, { marginTop: spacing.sm }]}
          >
            <Select
              label="What is your faith or spiritual tradition?"
              value={field.state.value}
              onValueChange={(val) => field.handleChange(val)}
              options={faithTraditions}
              placeholder="Select..."
            />
          </View>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.tradition}>
        {(tradition) =>
          tradition && tradition !== "none" && tradition !== "spiritual" ? (
            <>
              <form.Field name="congregation">
                {(field) => (
                  <View style={wishesFormStyles.fieldContainer}>
                    <Input
                      label="Place of worship"
                      value={field.state.value}
                      onChangeText={(text) => field.handleChange(text)}
                      placeholder="Church, synagogue, mosque, temple name..."
                    />
                  </View>
                )}
              </form.Field>

              <form.Field name="leader">
                {(field) => (
                  <View style={wishesFormStyles.fieldContainer}>
                    <Input
                      label="Religious leader name"
                      value={field.state.value}
                      onChangeText={(text) => field.handleChange(text)}
                      placeholder="Pastor, Rabbi, Imam, Priest, etc."
                    />
                  </View>
                )}
              </form.Field>

              <form.Field name="leaderContact">
                {(field) => (
                  <View style={wishesFormStyles.fieldContainer}>
                    <Input
                      label="Leader's contact info"
                      value={field.state.value}
                      onChangeText={(text) => field.handleChange(text)}
                      placeholder="Phone number or email"
                    />
                  </View>
                )}
              </form.Field>
            </>
          ) : null
        }
      </form.Subscribe>

      <form.Field name="rituals">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Rituals or customs to observe"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder="Prayers, ceremonies, traditions that are important to you..."
              maxLength={2000}
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
              placeholder="Anything else about your spiritual preferences..."
              maxLength={2000}
            />
          </View>
        )}
      </form.Field>
    </KeyboardAwareScrollView>
  );
}
