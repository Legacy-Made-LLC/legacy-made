/**
 * OrganDonationForm - Form for "Organ Donation" wish
 *
 * Captures organ donation preferences and registry status.
 * Task: wishes.endOfLife.organDonation
 *
 * Auto-save enabled - changes are saved automatically after 600ms of inactivity.
 */

import type { OrganDonationMetadata } from "@/api/types";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
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
import { generateOrganDonationSchema } from "../schemaGenerators";
import { wishesFormStyles } from "./formStyles";

const formText = {
  owner: {
    decisionLabel: "What are your wishes on organ donation?",
    registryLabel: "Are you on your state's donor registry?",
    registryInfo:
      "Being on the registry helps, but those closest to you will still be asked. Recording your wishes here ensures they know what you want.",
  },
  family: {
    decisionLabel: "What are their wishes on organ donation?",
    registryLabel: "Are they on their state's donor registry?",
    registryInfo:
      "Being on the registry helps, but families are still asked. Their wishes are recorded here so everyone knows what they want.",
  },
};

const decisionOptions = [
  { value: "yes-all", label: "Yes, donate anything that can help" },
  { value: "yes-specific", label: "Yes, but only specific organs" },
  { value: "research-only", label: "For medical research only" },
  { value: "no", label: "No, I don't want to donate" },
  { value: "undecided", label: "I haven't decided" },
];

const registryOptions = [
  { value: "yes", label: "Yes, I'm registered" },
  { value: "no", label: "No, not yet" },
  { value: "unsure", label: "I'm not sure" },
];

interface OrganDonationFormValues {
  decision: string;
  specificOrgans: string;
  onRegistry: string;
  notes: string;
}

export function OrganDonationForm({
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
    | OrganDonationMetadata
    | undefined;

  const defaultValues = useMemo<OrganDonationFormValues>(
    () => ({
      decision: initialMetadata?.decision ?? "",
      specificOrgans: initialMetadata?.specificOrgans ?? "",
      onRegistry: initialMetadata?.onRegistry ?? "",
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
      const metadata: OrganDonationMetadata = {
        decision: values.decision || undefined,
        specificOrgans: values.specificOrgans.trim() || undefined,
        onRegistry: values.onRegistry || undefined,
      };

      return {
        title: "Organ Donation",
        notes: values.notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateOrganDonationSchema(),
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: "Organ Donation",
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

      <form.Field name="decision">
        {(field) => (
          <View
            style={[wishesFormStyles.fieldContainer, { marginTop: spacing.sm }]}
          >
            <Select
              label={t.decisionLabel}
              value={field.state.value}
              onValueChange={(val) => field.handleChange(val)}
              options={decisionOptions}
              placeholder="Select..."
              clearable
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.decision}>
        {(decision) =>
          decision === "yes-specific" ? (
            <form.Field name="specificOrgans">
              {(field) => (
                <View style={wishesFormStyles.fieldContainer}>
                  <TextArea
                    label="Which organs or tissues?"
                    value={field.state.value}
                    onChangeText={(text) => field.handleChange(text)}
                    placeholder="Heart, kidneys, corneas, etc."
                    maxLength={500}
                    disabled={readOnly}
                  />
                </View>
              )}
            </form.Field>
          ) : null
        }
      </form.Subscribe>

      <form.Field name="onRegistry">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <Select
              label={t.registryLabel}
              value={field.state.value}
              onValueChange={(val) => field.handleChange(val)}
              options={registryOptions}
              placeholder="Select..."
              clearable
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.onRegistry}>
        {(onRegistry) =>
          onRegistry === "no" ? (
            <View style={wishesFormStyles.infoCard}>
              <Text style={wishesFormStyles.infoText}>
                {t.registryInfo}
              </Text>
            </View>
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
              placeholder="Any religious, cultural, or personal considerations..."
              maxLength={2000}
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>
    </KeyboardAwareScrollView>
  );
}
