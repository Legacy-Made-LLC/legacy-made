/**
 * FutureMomentForm - Form for creating/editing a future moment message
 *
 * Used for: messages.future (list-based, auto-save pattern)
 * Fields: occasion, recipient name, message type (video/written/both), written message
 */

import type { FileAttachment, FutureMomentMetadata, MetadataSchema } from "@/api/types";
import { FilePicker, FormInput, FormTextArea } from "@/components/forms";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { colors, spacing } from "@/constants/theme";
import { getLegacySectionByTaskKey, getLegacyTaskByKey } from "@/constants/legacy";
import { toast } from "@/hooks/useToast";
import { setVideoRecordedCallback } from "@/lib/videoRecordingBridge";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LegacyEntryFormProps, LegacyEntrySaveData } from "../registry";
import { legacyFormStyles } from "./formStyles";
import { RecordedVideoPreview } from "./RecordedVideoPreview";

const FUTURE_MOMENT_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    occasion: { label: "Occasion", order: 1 },
    recipientName: { label: "For", order: 2 },
    messageType: {
      label: "Message Type",
      order: 3,
      valueLabels: { video: "Video", written: "Written", both: "Both" },
    },
    writtenMessage: { label: "Message", order: 4 },
    deliveryNote: { label: "Delivery Note", order: 5 },
  },
};

interface FormValues {
  occasion: string;
  recipientName: string;
  messageType: "video" | "written" | "both";
  writtenMessage: string;
  deliveryNote: string;
}

export function FutureMomentForm({
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
    | FutureMomentMetadata
    | undefined;

  const defaultValues = useMemo<FormValues>(
    () => ({
      occasion: initialMetadata?.occasion ?? "",
      recipientName: initialMetadata?.recipientName ?? "",
      messageType: initialMetadata?.messageType ?? "written",
      writtenMessage: initialMetadata?.writtenMessage ?? "",
      deliveryNote: initialMetadata?.deliveryNote ?? "",
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
      const values = form.state.values;
      const metadata: FutureMomentMetadata = {
        occasion: values.occasion.trim(),
        recipientName: values.recipientName.trim() || undefined,
        messageType: values.messageType,
        writtenMessage:
          values.messageType === "written" || values.messageType === "both"
            ? values.writtenMessage.trim() || undefined
            : undefined,
        deliveryNote: values.deliveryNote.trim() || undefined,
      };

      return {
        title: values.occasion.trim() || "Draft",
        notes: null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: FUTURE_MOMENT_SCHEMA,
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: readOnly
        ? "View Moment"
        : isNew
          ? "New Future Moment"
          : "Edit Moment",
    });
  }, [isNew, readOnly, navigation]);

  const handleDelete = () => {
    if (!onDelete) return;
    const occasion = form.getFieldValue("occasion") || "this moment";
    Alert.alert(
      "Delete Moment",
      `Are you sure you want to delete "${occasion}"?`,
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
                err instanceof Error ? err.message : "Failed to delete moment";
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
    router.push(
      `/(app)/legacy/${sectionId}/${taskId}/record` as never,
    );
  }, [router, sectionId, taskId, attachments, onAttachmentsChange]);

  const handleRemoveVideo = useCallback(() => {
    if (onAttachmentsChange) {
      onAttachmentsChange((attachments ?? []).filter((a) => !isRecordedVideo(a)));
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

      <form.Field name="occasion">
        {(field) => (
          <View style={legacyFormStyles.fieldContainer}>
            <FormInput
              field={field}
              label="What's the occasion?"
              placeholder="e.g., Graduation, Wedding, 18th Birthday"
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      <form.Field name="recipientName">
        {(field) => (
          <View style={legacyFormStyles.fieldContainer}>
            <FormInput
              field={field}
              label="Who is it for? (optional)"
              placeholder="Their name"
              disabled={readOnly}
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
            {(messageType === "video" || messageType === "both") && !readOnly && (
              <View style={legacyFormStyles.fieldContainer}>
                {recordedVideo ? (
                  <RecordedVideoPreview
                    video={recordedVideo}
                    onReRecord={handleRecordVideo}
                    onRemove={handleRemoveVideo}
                  />
                ) : (
                  <>
                    <Text style={legacyFormStyles.label}>Record Your Message</Text>
                    <Pressable
                      style={({ pressed }) => [
                        legacyFormStyles.recordVideoButton,
                        pressed && legacyFormStyles.recordVideoButtonPressed,
                      ]}
                      onPress={handleRecordVideo}
                    >
                      <Ionicons name="videocam" size={20} color={colors.surface} />
                      <Text style={legacyFormStyles.recordVideoButtonText}>
                        Record Video
                      </Text>
                    </Pressable>
                    <Text style={legacyFormStyles.recordVideoHint}>
                      Up to 3 minutes. You can retake before saving.
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
                      placeholder="What do you want them to know on this special day?"
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

      <form.Field name="deliveryNote">
        {(field) => (
          <View style={legacyFormStyles.fieldContainer}>
            <FormTextArea
              field={field}
              label="Delivery note (optional)"
              placeholder="Any details about when or how this message should be shared..."
              maxLength={1000}
              disabled={readOnly}
            />
          </View>
        )}
      </form.Field>

      {!readOnly && onAttachmentsChange && (
        <FilePicker
          label="Photos & Files"
          value={supplementalAttachments}
          onChange={(newFiles) => {
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
              Delete Moment
            </Text>
          </Pressable>
        </View>
      )}
    </KeyboardAwareScrollView>
  );
}
