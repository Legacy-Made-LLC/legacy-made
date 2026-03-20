/**
 * MessageToPersonForm - Form for creating/editing a message to a specific person
 *
 * Used for: messages.people (list-based, auto-save pattern)
 * Fields: recipient name, relationship (select), message type toggle,
 *         video recording / written message, short description, delivery timing
 */

import type {
  FileAttachment,
  MessageToPersonMetadata,
  MetadataSchema,
} from "@/api/types";
import { FilePicker, FormInput, FormTextArea } from "@/components/forms";
import { RELATIONSHIP_OPTIONS } from "@/components/forms/ContactFormFields";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { Select } from "@/components/ui/Select";
import {
  getLegacySectionByTaskKey,
  getLegacyTaskByKey,
} from "@/constants/legacy";
import { colors, spacing } from "@/constants/theme";
import { toast } from "@/hooks/useToast";
import { setVideoRecordedCallback } from "@/lib/videoRecordingBridge";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LegacyEntryFormProps, LegacyEntrySaveData } from "../registry";
import { legacyFormStyles } from "./formStyles";
import { RecordedVideoPreview } from "./RecordedVideoPreview";

const DELIVERY_TIMING_OPTIONS = [
  { value: "anytime", label: "Anytime after I'm gone" },
  { value: "specific_date", label: "On a specific date" },
  { value: "specific_event", label: "At a specific event" },
  { value: "when_needed", label: "When they need it most" },
];

const MESSAGE_TO_PERSON_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    recipientName: { label: "Recipient", order: 1 },
    recipientRelationship: { label: "Relationship", order: 2 },
    messageType: {
      label: "Message Type",
      order: 3,
      valueLabels: { video: "Video", written: "Written", both: "Both" },
    },
    writtenMessage: { label: "Message", order: 4 },
    shortDescription: { label: "Description", order: 5 },
    deliveryTiming: { label: "Delivery", order: 6 },
    deliveryTimingDetail: { label: "Delivery Detail", order: 7 },
  },
};

interface FormValues {
  recipientName: string;
  recipientRelationship: string;
  messageType: "video" | "written" | "both";
  writtenMessage: string;
  shortDescription: string;
  deliveryTiming: string;
  deliveryTimingDetail: string;
}

export function MessageToPersonForm({
  taskKey,
  entryId,
  initialData,
  registerGetSaveData,
  onDelete,
  attachments,
  onAttachmentsChange,
  isUploading,
  onStorageUpgradeRequired,
  readOnly,
  onFormReady,
  onDiscreteChange,
}: LegacyEntryFormProps) {
  const navigation = useNavigation();
  const router = useRouter();
  const { sectionId, taskId } = useLocalSearchParams<{
    sectionId: string;
    taskId: string;
  }>();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;
  const task = getLegacyTaskByKey(taskKey);
  const section = getLegacySectionByTaskKey(taskKey);

  const initialMetadata = initialData?.metadata as
    | MessageToPersonMetadata
    | undefined;

  const defaultValues = useMemo<FormValues>(
    () => ({
      recipientName: initialMetadata?.recipientName ?? "",
      recipientRelationship: initialMetadata?.recipientRelationship ?? "",
      messageType: initialMetadata?.messageType ?? "video",
      writtenMessage: initialMetadata?.writtenMessage ?? "",
      shortDescription: initialMetadata?.shortDescription ?? "",
      deliveryTiming: initialMetadata?.deliveryTiming ?? "anytime",
      deliveryTimingDetail: initialMetadata?.deliveryTimingDetail ?? "",
    }),
    [initialMetadata],
  );

  const form = useForm({
    defaultValues,
  });

  useEffect(() => {
    onFormReady?.(form);
  }, [form, onFormReady]);

  useEffect(() => {
    const getSaveData = (): LegacyEntrySaveData => {
      const value = form.state.values;

      const metadata: MessageToPersonMetadata = {
        recipientName: value.recipientName.trim(),
        recipientRelationship: value.recipientRelationship || undefined,
        messageType: value.messageType,
        writtenMessage:
          value.messageType === "written" || value.messageType === "both"
            ? value.writtenMessage.trim() || undefined
            : undefined,
        shortDescription: value.shortDescription.trim() || undefined,
        deliveryTiming: value.deliveryTiming || undefined,
        deliveryTimingDetail:
          value.deliveryTiming === "specific_date" ||
          value.deliveryTiming === "specific_event"
            ? value.deliveryTimingDetail.trim() || undefined
            : undefined,
      };

      return {
        title: value.recipientName.trim() || "Draft",
        notes: null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: MESSAGE_TO_PERSON_SCHEMA,
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: readOnly ? "View Message" : isNew ? "New Message" : "Edit Message",
    });
  }, [isNew, readOnly, navigation]);

  const handleDelete = () => {
    if (!onDelete) return;
    const name = form.getFieldValue("recipientName") || "this message";
    Alert.alert(
      "Delete Message",
      `Are you sure you want to delete the message for ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await onDelete();
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Failed to delete message";
              toast.error({ message });
            }
          },
        },
      ],
    );
  };

  // Primary recorded video: any video that isn't explicitly an attachment.
  // Covers role "primary-video" (new) and no role (legacy data).
  const isRecordedVideo = (a: FileAttachment) =>
    a.type === "video" && a.role !== "attachment";

  const recordedVideo = useMemo(
    () => attachments?.find(isRecordedVideo),
    [attachments],
  );

  // Supplemental: everything that is NOT the primary recorded video
  const supplementalAttachments = useMemo(
    () => attachments?.filter((a) => !isRecordedVideo(a)) ?? [],
    [attachments],
  );

  const handleRecordVideo = useCallback(() => {
    setVideoRecordedCallback((attachment: FileAttachment) => {
      if (onAttachmentsChange) {
        const withoutRecorded = (attachments ?? []).filter(
          (a) => !isRecordedVideo(a),
        );
        onAttachmentsChange([...withoutRecorded, attachment]);
      }
    });
    router.push(`/(app)/legacy/${sectionId}/${taskId}/record` as never);
  }, [router, sectionId, taskId, attachments, onAttachmentsChange]);

  const handleRemoveVideo = useCallback(() => {
    if (onAttachmentsChange) {
      onAttachmentsChange(
        (attachments ?? []).filter((a) => !isRecordedVideo(a)),
      );
    }
  }, [attachments, onAttachmentsChange]);

  return (
    <KeyboardAwareScrollView
      style={legacyFormStyles.container}
      contentContainerStyle={[
        legacyFormStyles.content,
        { paddingBottom: insets.bottom + spacing.lg },
      ]}
      bottomOffset={50}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {task?.guidance && task?.triggerText && (
        <ExpandableGuidanceCard
          icon={section?.ionIcon as keyof typeof Ionicons.glyphMap}
          triggerText={task.triggerText}
          heading={task.guidanceHeading}
          detail={task.guidance}
          tips={task.tips}
          pacingNote={task.pacingNote}
          accentColor={colors.featureLegacy}
          accentTint={colors.featureLegacyTint}
          accentDark={colors.featureLegacyDark}
        />
      )}

      <form.Field name="recipientName">
        {(field) => (
          <View style={legacyFormStyles.fieldContainer}>
            <FormInput
              field={field}
              label="Who is this message for?"
              placeholder="Their name"
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Field name="recipientRelationship">
        {(field) => (
          <View style={legacyFormStyles.fieldContainer}>
            <Select
              label="Your relationship"
              value={field.state.value}
              onValueChange={(val) => {
                if (readOnly) return;
                field.handleChange(val);
                onDiscreteChange?.();
              }}
              options={RELATIONSHIP_OPTIONS.map((opt) => ({
                value: opt,
                label: opt,
              }))}
              placeholder="Select..."
              clearable
              disabled={readOnly}
              onBlur={field.handleBlur}
            />
          </View>
        )}
      </form.Field>

      <View style={legacyFormStyles.fieldContainer}>
        <Text style={legacyFormStyles.label}>Message Type</Text>
        <form.Field name="messageType">
          {(field) => (
            <View style={legacyFormStyles.typeGrid}>
              <Pressable
                style={[
                  legacyFormStyles.typeButton,
                  field.state.value === "written" &&
                    legacyFormStyles.typeButtonSelected,
                ]}
                onPress={() => {
                  if (readOnly) return;
                  field.handleChange("written");
                  onDiscreteChange?.();
                }}
                disabled={readOnly}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={
                    field.state.value === "written"
                      ? colors.surface
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    legacyFormStyles.typeButtonText,
                    field.state.value === "written" &&
                      legacyFormStyles.typeButtonTextSelected,
                  ]}
                >
                  Written
                </Text>
              </Pressable>
              <Pressable
                style={[
                  legacyFormStyles.typeButton,
                  field.state.value === "video" &&
                    legacyFormStyles.typeButtonSelected,
                ]}
                onPress={() => {
                  if (readOnly) return;
                  field.handleChange("video");
                  onDiscreteChange?.();
                }}
                disabled={readOnly}
              >
                <Ionicons
                  name="videocam"
                  size={16}
                  color={
                    field.state.value === "video"
                      ? colors.surface
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    legacyFormStyles.typeButtonText,
                    field.state.value === "video" &&
                      legacyFormStyles.typeButtonTextSelected,
                  ]}
                >
                  Video
                </Text>
              </Pressable>
              <Pressable
                style={[
                  legacyFormStyles.typeButton,
                  field.state.value === "both" &&
                    legacyFormStyles.typeButtonSelected,
                ]}
                onPress={() => {
                  if (readOnly) return;
                  field.handleChange("both");
                  onDiscreteChange?.();
                }}
                disabled={readOnly}
              >
                <Text
                  style={[
                    legacyFormStyles.typeButtonText,
                    field.state.value === "both" &&
                      legacyFormStyles.typeButtonTextSelected,
                  ]}
                >
                  Both
                </Text>
              </Pressable>
            </View>
          )}
        </form.Field>
      </View>

      <form.Subscribe selector={(state) => state.values.messageType}>
        {(messageType) => (
          <>
            {(messageType === "video" || messageType === "both") &&
              !readOnly && (
                <View style={legacyFormStyles.fieldContainer}>
                  {recordedVideo ? (
                    <RecordedVideoPreview
                      video={recordedVideo}
                      onReRecord={handleRecordVideo}
                      onRemove={handleRemoveVideo}
                    />
                  ) : (
                    <>
                      <Text style={legacyFormStyles.encouragingText}>
                        {"You don't need to be perfect. Just be yourself."}
                      </Text>
                      <Pressable
                        style={({ pressed }) => [
                          legacyFormStyles.recordVideoButton,
                          pressed && legacyFormStyles.recordVideoButtonPressed,
                        ]}
                        onPress={handleRecordVideo}
                      >
                        <Ionicons
                          name="videocam"
                          size={20}
                          color={colors.surface}
                        />
                        <Text style={legacyFormStyles.recordVideoButtonText}>
                          Record Video
                        </Text>
                      </Pressable>
                      <Text style={legacyFormStyles.recordVideoHint}>
                        Tap to start recording (up to 3 minutes)
                      </Text>
                    </>
                  )}
                </View>
              )}
            {(messageType === "written" || messageType === "both") && (
              <form.Field name="writtenMessage">
                {(field) => (
                  <View style={legacyFormStyles.fieldContainer}>
                    <FormTextArea
                      field={field}
                      label="Your Message"
                      placeholder="Write from the heart — there's no wrong way to say it..."
                      maxLength={5000}
                      disabled={readOnly}
                    />
                  </View>
                )}
              </form.Field>
            )}
          </>
        )}
      </form.Subscribe>

      <form.Field name="shortDescription">
        {(field) => (
          <View style={legacyFormStyles.fieldContainer}>
            <FormInput
              field={field}
              label="Short description (optional)"
              placeholder={"e.g., 'For when you miss me'"}
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Field name="deliveryTiming">
        {(field) => (
          <View style={legacyFormStyles.fieldContainer}>
            <Select
              label="When should they receive this?"
              value={field.state.value}
              onValueChange={(val) => {
                if (readOnly) return;
                field.handleChange(val);
                if (val !== "specific_date" && val !== "specific_event") {
                  form.setFieldValue("deliveryTimingDetail", "");
                }
                onDiscreteChange?.();
              }}
              options={DELIVERY_TIMING_OPTIONS}
              disabled={readOnly}
              onBlur={field.handleBlur}
            />
          </View>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.deliveryTiming}>
        {(timing) =>
          (timing === "specific_date" || timing === "specific_event") && (
            <form.Field name="deliveryTimingDetail">
              {(field) => (
                <View style={legacyFormStyles.fieldContainer}>
                  <FormInput
                    field={field}
                    label={
                      timing === "specific_date" ? "When?" : "Which event?"
                    }
                    placeholder={
                      timing === "specific_date"
                        ? "e.g., When they turn 21, June 2030"
                        : "e.g., Their wedding day, first child"
                    }
                    disabled={readOnly}
                  />
                </View>
              )}
            </form.Field>
          )
        }
      </form.Subscribe>

      {!readOnly && onAttachmentsChange && (
        <FilePicker
          label="Photos & Files"
          value={supplementalAttachments}
          onChange={(newFiles) => {
            // Tag any untagged videos as attachments so they stay in this section
            const tagged = newFiles.map((f) =>
              f.type === "video" && !f.role ? { ...f, role: "attachment" as const } : f,
            );
            const recorded = (attachments ?? []).filter(isRecordedVideo);
            onAttachmentsChange([...recorded, ...tagged]);
          }}
          mode="all"
          maxFiles={10}
          placeholder="Add photos or files"
          showStorageIndicator
          onUpgradeRequired={onStorageUpgradeRequired}
          accentColor={colors.featureLegacy}
        />
      )}

      {!readOnly && !isNew && onDelete && (
        <View style={legacyFormStyles.deleteContainer}>
          <Pressable
            style={({ pressed }) => [
              legacyFormStyles.deleteButton,
              pressed && legacyFormStyles.deleteButtonPressed,
            ]}
            onPress={handleDelete}
          >
            <Text style={legacyFormStyles.deleteButtonText}>
              Delete Message
            </Text>
          </Pressable>
        </View>
      )}
    </KeyboardAwareScrollView>
  );
}
