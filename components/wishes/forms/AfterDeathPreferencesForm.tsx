/**
 * AfterDeathPreferencesForm - Form for "After-Death Preferences" wish
 *
 * Captures burial/cremation preferences and pre-arrangement details.
 * Task: wishes.endOfLife.afterDeath
 *
 * Auto-save enabled - changes are saved automatically after 600ms of inactivity.
 */

import type { AfterDeathMetadata } from "@/api/types";
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
import { generateAfterDeathSchema } from "../schemaGenerators";
import { wishesFormStyles } from "./formStyles";

const formText = {
  owner: {
    dispositionLabel: "What are your wishes for your body?",
    prearrangedLabel: "Have you made any pre-arrangements?",
    notesPlaceholder: "Anything else your family should know...",
  },
  family: {
    dispositionLabel: "What are their wishes for their body?",
    prearrangedLabel: "Have they made any pre-arrangements?",
    notesPlaceholder: "Anything else the family should know...",
  },
};

const dispositionOptions = [
  { value: "burial", label: "Traditional burial" },
  { value: "cremation", label: "Cremation" },
  { value: "green-burial", label: "Green/natural burial" },
  { value: "donation", label: "Whole body donation to science" },
  { value: "flexible", label: "Whatever my family prefers" },
  { value: "other", label: "Other" },
];

const prearrangedOptions = [
  { value: "yes", label: "Yes, it's all arranged" },
  { value: "partial", label: "Partially arranged" },
  { value: "no", label: "Not yet" },
];

interface AfterDeathPreferencesFormValues {
  disposition: string;
  specificWishes: string;
  prearranged: string;
  prearrangedDetails: string;
  notes: string;
}

export function AfterDeathPreferencesForm({
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
    | AfterDeathMetadata
    | undefined;

  const defaultValues = useMemo<AfterDeathPreferencesFormValues>(
    () => ({
      disposition: initialMetadata?.disposition ?? "",
      specificWishes: initialMetadata?.specificWishes ?? "",
      prearranged: initialMetadata?.prearranged ?? "",
      prearrangedDetails: initialMetadata?.prearrangedDetails ?? "",
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
      const metadata: AfterDeathMetadata = {
        disposition: values.disposition || undefined,
        specificWishes: values.specificWishes.trim() || undefined,
        prearranged: values.prearranged || undefined,
        prearrangedDetails: values.prearrangedDetails.trim() || undefined,
      };

      return {
        title: "After-Death Preferences",
        notes: values.notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateAfterDeathSchema(),
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: "After-Death Preferences",
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

      <form.Field name="disposition">
        {(field) => (
          <View
            style={[wishesFormStyles.fieldContainer, { marginTop: spacing.sm }]}
          >
            <Select
              label={t.dispositionLabel}
              value={field.state.value}
              onValueChange={(val) => field.handleChange(val)}
              options={dispositionOptions}
              placeholder="Select..."
              clearable
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.disposition}>
        {(disposition) =>
          disposition && disposition !== "flexible" ? (
            <form.Field name="specificWishes">
              {(field) => (
                <View style={wishesFormStyles.fieldContainer}>
                  <TextArea
                    label="Any specific wishes?"
                    value={field.state.value}
                    onChangeText={(text) => field.handleChange(text)}
                    placeholder="Location preferences, urn/casket style, where ashes should go, etc."
                    maxLength={1500}
                    disabled={readOnly}
                  />
                </View>
              )}
            </form.Field>
          ) : null
        }
      </form.Subscribe>

      <Text style={wishesFormStyles.sectionHeader}>Pre-arrangements</Text>

      <form.Field name="prearranged">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <Select
              label={t.prearrangedLabel}
              value={field.state.value}
              onValueChange={(val) => field.handleChange(val)}
              options={prearrangedOptions}
              placeholder="Select..."
              clearable
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.prearranged}>
        {(prearranged) =>
          prearranged === "yes" || prearranged === "partial" ? (
            <form.Field name="prearrangedDetails">
              {(field) => (
                <View style={wishesFormStyles.fieldContainer}>
                  <TextArea
                    label="Pre-arrangement details"
                    value={field.state.value}
                    onChangeText={(text) => field.handleChange(text)}
                    placeholder="Funeral home name, contract details, what's been paid for..."
                    maxLength={1500}
                    disabled={readOnly}
                  />
                </View>
              )}
            </form.Field>
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
