/**
 * AdvanceDirectiveForm - Form for "Advance Directive" wish
 *
 * Tracks directive documents and healthcare proxy information.
 * Task: wishes.carePrefs.advanceDirective
 *
 * Auto-save enabled - changes are saved automatically after 600ms of inactivity.
 * Includes file attachment support for uploading directive documents.
 */

import type { AdvanceDirectiveMetadata } from "@/api/types";
import { FilePicker } from "@/components/forms/FilePicker";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { usePerspective } from "@/contexts/LocaleContext";
import { advanceDirectiveDocTypes } from "@/constants/wishes";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useNavigation } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps, WishSaveData } from "../registry";
import { generateAdvanceDirectiveSchema } from "../schemaGenerators";
import { wishesFormStyles } from "./formStyles";

const formText = {
  owner: {
    hasDirectiveLabel: "Do you have advance directive documents?",
    uploadHelp: "Upload copies of your living will, healthcare power of attorney, or other directive documents.",
    proxyHeader: "Who should make healthcare decisions for you?",
    notesPlaceholder: "Anything else about your directive documents...",
  },
  family: {
    hasDirectiveLabel: "Do they have advance directive documents?",
    uploadHelp: "Copies of their living will, healthcare power of attorney, or other directive documents.",
    proxyHeader: "Who should make healthcare decisions for them?",
    notesPlaceholder: "Anything else about their directive documents...",
  },
};

const hasDirectiveOptions = [
  { value: "yes", label: "Yes, I have documents" },
  { value: "in-progress", label: "Working on it" },
  { value: "no", label: "Not yet" },
];

interface AdvanceDirectiveFormValues {
  hasDirective: string;
  documentTypes: string[];
  location: string;
  proxyName: string;
  proxyPhone: string;
  proxyRelationship: string;
  notes: string;
}

export function AdvanceDirectiveForm({
  wishId,
  initialData,
  onFormReady,
  registerGetSaveData,
  guidance,
  attachments = [],
  onAttachmentsChange,
  isUploading,
  deletingFileIds,
  onStorageUpgradeRequired,
}: WishFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { perspective } = usePerspective();
  const t = formText[perspective];

  const initialMetadata = initialData?.metadata as
    | AdvanceDirectiveMetadata
    | undefined;

  const defaultValues = useMemo<AdvanceDirectiveFormValues>(
    () => ({
      hasDirective: initialMetadata?.hasDirective ?? "",
      documentTypes: initialMetadata?.documentTypes ?? [],
      location: initialMetadata?.location ?? "",
      proxyName: initialMetadata?.proxyName ?? "",
      proxyPhone: initialMetadata?.proxyPhone ?? "",
      proxyRelationship: initialMetadata?.proxyRelationship ?? "",
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
      const metadata: AdvanceDirectiveMetadata = {
        hasDirective: values.hasDirective || undefined,
        documentTypes:
          values.documentTypes.length > 0 ? values.documentTypes : undefined,
        location: values.location.trim() || undefined,
        proxyName: values.proxyName.trim() || undefined,
        proxyPhone: values.proxyPhone.trim() || undefined,
        proxyRelationship: values.proxyRelationship.trim() || undefined,
      };

      return {
        title: "Advance Directive",
        notes: values.notes.trim() || null,
        // Spread into plain object to satisfy Record<string, unknown> type
        metadata: { ...metadata },
        metadataSchema: generateAdvanceDirectiveSchema(),
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: "Advance Directive",
    });
  }, [navigation]);

  const toggleDocType = useCallback(
    (docType: string) => {
      const currentTypes = form.getFieldValue("documentTypes");
      const newTypes = currentTypes.includes(docType)
        ? currentTypes.filter((t) => t !== docType)
        : [...currentTypes, docType];
      form.setFieldValue("documentTypes", newTypes);
    },
    [form],
  );

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

      <form.Field name="hasDirective">
        {(field) => (
          <View
            style={[wishesFormStyles.fieldContainer, { marginTop: spacing.sm }]}
          >
            <Select
              label={t.hasDirectiveLabel}
              value={field.state.value}
              onValueChange={(val) => field.handleChange(val)}
              options={hasDirectiveOptions}
              placeholder="Select..."
              clearable
            />
          </View>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.hasDirective}>
        {(hasDirective) =>
          hasDirective === "yes" ? (
            <>
              <form.Field name="documentTypes">
                {(field) => (
                  <View style={wishesFormStyles.fieldContainer}>
                    <Text style={wishesFormStyles.label}>
                      What types of documents?
                    </Text>
                    <View style={wishesFormStyles.checkboxGroup}>
                      {advanceDirectiveDocTypes.map((docType) => (
                        <Pressable
                          key={docType}
                          style={[
                            wishesFormStyles.checkboxItem,
                            field.state.value.includes(docType) &&
                              wishesFormStyles.checkboxItemSelected,
                          ]}
                          onPress={() => toggleDocType(docType)}
                        >
                          <View
                            style={[
                              wishesFormStyles.checkboxBox,
                              field.state.value.includes(docType) &&
                                wishesFormStyles.checkboxBoxSelected,
                            ]}
                          >
                            {field.state.value.includes(docType) && (
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color="#fff"
                              />
                            )}
                          </View>
                          <Text style={wishesFormStyles.checkboxText}>
                            {docType}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </form.Field>

              <form.Field name="location">
                {(field) => (
                  <View style={wishesFormStyles.fieldContainer}>
                    <Input
                      label="Where are these stored?"
                      value={field.state.value}
                      onChangeText={(text) => field.handleChange(text)}
                      placeholder="e.g., Filing cabinet, attorney's office, safe"
                    />
                  </View>
                )}
              </form.Field>

              {onAttachmentsChange && (
                <View style={wishesFormStyles.fieldContainer}>
                  <FilePicker
                    label="Upload Documents"
                    value={attachments}
                    onChange={onAttachmentsChange}
                    mode="document"
                    maxFiles={10}
                    allowCamera={true}
                    disabled={isUploading}
                    placeholder="Add directive documents"
                    helpText={t.uploadHelp}
                    onUpgradeRequired={onStorageUpgradeRequired}
                    deletingIds={deletingFileIds}
                    accentColor={colors.featureWishes}
                  />
                </View>
              )}
            </>
          ) : null
        }
      </form.Subscribe>

      <Text style={wishesFormStyles.sectionHeader}>
        {t.proxyHeader}
      </Text>

      <form.Field name="proxyName">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <Input
              label="Healthcare proxy name"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder="Full name"
            />
          </View>
        )}
      </form.Field>

      <View style={wishesFormStyles.fieldRow}>
        <form.Field name="proxyPhone">
          {(field) => (
            <View style={wishesFormStyles.fieldRowItem}>
              <Input
                label="Phone"
                value={field.state.value}
                onChangeText={(text) => field.handleChange(text)}
                placeholder="Best number"
                keyboardType="phone-pad"
              />
            </View>
          )}
        </form.Field>
        <form.Field name="proxyRelationship">
          {(field) => (
            <View style={wishesFormStyles.fieldRowItem}>
              <Input
                label="Relationship"
                value={field.state.value}
                onChangeText={(text) => field.handleChange(text)}
                placeholder="e.g., Spouse, Daughter"
              />
            </View>
          )}
        </form.Field>
      </View>

      <form.Field name="notes">
        {(field) => (
          <View style={wishesFormStyles.fieldContainer}>
            <TextArea
              label="Additional notes"
              value={field.state.value}
              onChangeText={(text) => field.handleChange(text)}
              placeholder={t.notesPlaceholder}
              maxLength={2000}
            />
          </View>
        )}
      </form.Field>
    </KeyboardAwareScrollView>
  );
}
