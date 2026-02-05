/**
 * AdvanceDirectiveForm - Form for "Advance Directive" wish
 *
 * Tracks directive documents and healthcare proxy information.
 * Task: wishes.carePrefs.advanceDirective
 */

import type { AdvanceDirectiveMetadata } from "@/api/types";
import { FilePicker } from "@/components/forms/FilePicker";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { colors, spacing } from "@/constants/theme";
import { advanceDirectiveDocTypes } from "@/constants/wishes";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WishFormProps } from "../registry";
import { wishesFormStyles } from "./formStyles";
import { generateAdvanceDirectiveSchema } from "../schemaGenerators";

const hasDirectiveOptions = [
  { value: "yes", label: "Yes, I have documents" },
  { value: "in-progress", label: "Working on it" },
  { value: "no", label: "Not yet" },
];

export function AdvanceDirectiveForm({
  wishId,
  initialData,
  onSave,
  isSaving,
  guidance,
  attachments = [],
  onAttachmentsChange,
  isUploading,
  onStorageUpgradeRequired,
}: WishFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !wishId;

  const initialMetadata = initialData?.metadata as
    | AdvanceDirectiveMetadata
    | undefined;

  const [hasDirective, setHasDirective] = useState(
    initialMetadata?.hasDirective ?? "",
  );
  const [documentTypes, setDocumentTypes] = useState<string[]>(
    initialMetadata?.documentTypes ?? [],
  );
  const [location, setLocation] = useState(initialMetadata?.location ?? "");
  const [proxyName, setProxyName] = useState(initialMetadata?.proxyName ?? "");
  const [proxyPhone, setProxyPhone] = useState(
    initialMetadata?.proxyPhone ?? "",
  );
  const [proxyRelationship, setProxyRelationship] = useState(
    initialMetadata?.proxyRelationship ?? "",
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? "Advance Directive" : "Edit Advance Directive",
    });
  }, [isNew, navigation]);

  const toggleDocType = (docType: string) => {
    setDocumentTypes((prev) =>
      prev.includes(docType)
        ? prev.filter((t) => t !== docType)
        : [...prev, docType],
    );
  };

  const handleSave = async () => {
    const metadata: AdvanceDirectiveMetadata = {
      hasDirective: hasDirective || undefined,
      documentTypes: documentTypes.length > 0 ? documentTypes : undefined,
      location: location.trim() || undefined,
      proxyName: proxyName.trim() || undefined,
      proxyPhone: proxyPhone.trim() || undefined,
      proxyRelationship: proxyRelationship.trim() || undefined,
    };

    try {
      await onSave({
        title: "Advance Directive",
        notes: notes.trim() || null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: generateAdvanceDirectiveSchema(),
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
        <Select
          label="Do you have advance directive documents?"
          value={hasDirective}
          onValueChange={setHasDirective}
          options={hasDirectiveOptions}
          placeholder="Select..."
        />
      </View>

      {hasDirective === "yes" && (
        <>
          <View style={wishesFormStyles.fieldContainer}>
            <Text style={wishesFormStyles.label}>What types of documents?</Text>
            <View style={wishesFormStyles.checkboxGroup}>
              {advanceDirectiveDocTypes.map((docType) => (
                <Pressable
                  key={docType}
                  style={[
                    wishesFormStyles.checkboxItem,
                    documentTypes.includes(docType) &&
                      wishesFormStyles.checkboxItemSelected,
                  ]}
                  onPress={() => toggleDocType(docType)}
                >
                  <View
                    style={[
                      wishesFormStyles.checkboxBox,
                      documentTypes.includes(docType) &&
                        wishesFormStyles.checkboxBoxSelected,
                    ]}
                  >
                    {documentTypes.includes(docType) && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <Text style={wishesFormStyles.checkboxText}>{docType}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={wishesFormStyles.fieldContainer}>
            <Input
              label="Where are these stored?"
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Filing cabinet, attorney's office, safe"
            />
          </View>

          {onAttachmentsChange && (
            <View style={wishesFormStyles.fieldContainer}>
              <FilePicker
                label="Upload Documents"
                value={attachments}
                onChange={onAttachmentsChange}
                mode="document"
                maxFiles={10}
                allowCamera={true}
                disabled={isSaving || isUploading}
                placeholder="Add directive documents"
                helpText="Upload copies of your living will, healthcare power of attorney, or other directive documents."
                onUpgradeRequired={onStorageUpgradeRequired}
              />
            </View>
          )}
        </>
      )}

      <Text style={wishesFormStyles.sectionHeader}>
        Who should make healthcare decisions for you?
      </Text>

      <View style={wishesFormStyles.fieldContainer}>
        <Input
          label="Healthcare proxy name"
          value={proxyName}
          onChangeText={setProxyName}
          placeholder="Full name"
        />
      </View>

      <View style={wishesFormStyles.fieldRow}>
        <View style={wishesFormStyles.fieldRowItem}>
          <Input
            label="Phone"
            value={proxyPhone}
            onChangeText={setProxyPhone}
            placeholder="Best number"
            keyboardType="phone-pad"
          />
        </View>
        <View style={wishesFormStyles.fieldRowItem}>
          <Input
            label="Relationship"
            value={proxyRelationship}
            onChangeText={setProxyRelationship}
            placeholder="e.g., Spouse, Daughter"
          />
        </View>
      </View>

      <View style={wishesFormStyles.fieldContainer}>
        <TextArea
          label="Additional notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything else about your directive documents..."
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

