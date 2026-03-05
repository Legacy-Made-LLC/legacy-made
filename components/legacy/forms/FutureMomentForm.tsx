/**
 * FutureMomentForm - Form for creating/editing a future moment message
 *
 * Used for: messages.future (list-based, save/cancel pattern)
 * Fields: occasion, recipient name, message type (video/written/both), written message
 */

import type { EntryCompletionStatus, FileAttachment, FutureMomentMetadata, MetadataSchema } from "@/api/types";
import { FilePicker, FormInput, FormTextArea } from "@/components/forms";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { colors, spacing } from "@/constants/theme";
import { getLegacySectionByTaskKey, getLegacyTaskByKey } from "@/constants/legacy";
import { toast } from "@/hooks/useToast";
import { setVideoRecordedCallback } from "@/lib/videoRecordingBridge";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LegacyEntryFormProps } from "../registry";
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
  onSave,
  onDelete,
  isSaving,
  attachments,
  onAttachmentsChange,
  isUploading,
  onStorageUpgradeRequired,
  readOnly,
  onFormReady,
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
  const completionStatusRef = useRef<EntryCompletionStatus>("complete");

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

  const submitForm = async (value: FormValues) => {
    const metadata: FutureMomentMetadata = {
      occasion: value.occasion.trim(),
      recipientName: value.recipientName.trim() || undefined,
      messageType: value.messageType,
      writtenMessage:
        value.messageType === "written" || value.messageType === "both"
          ? value.writtenMessage.trim() || undefined
          : undefined,
      deliveryNote: value.deliveryNote.trim() || undefined,
    };

    try {
      await onSave({
        title: value.occasion.trim() || "Draft",
        notes: null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: FUTURE_MOMENT_SCHEMA,
        completionStatus: completionStatusRef.current,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save moment";
      toast.error({ message });
    }
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await submitForm(value);
    },
  });

  useEffect(() => {
    onFormReady?.(form);
  }, [form, onFormReady]);

  useEffect(() => {
    navigation.setOptions({
      title: readOnly
        ? "View Moment"
        : isNew
          ? "New Future Moment"
          : "Edit Moment",
    });
  }, [isNew, readOnly, navigation]);

  const handleSaveWithStatus = async (status: EntryCompletionStatus) => {
    completionStatusRef.current = status;
    if (status === "draft") {
      await submitForm(form.state.values);
    } else {
      form.handleSubmit();
    }
  };

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

  const recordedVideo = useMemo(
    () => attachments?.find((a) => a.type === "video"),
    [attachments],
  );

  const nonVideoAttachments = useMemo(
    () => attachments?.filter((a) => a.type !== "video") ?? [],
    [attachments],
  );

  const handleRecordVideo = useCallback(() => {
    setVideoRecordedCallback((attachment: FileAttachment) => {
      if (onAttachmentsChange) {
        const withoutVideo = (attachments ?? []).filter((a) => a.type !== "video");
        onAttachmentsChange([...withoutVideo, attachment]);
      }
    });
    router.push(
      `/(app)/legacy/${sectionId}/${taskId}/record` as never,
    );
  }, [router, sectionId, taskId, attachments, onAttachmentsChange]);

  const handleRemoveVideo = useCallback(() => {
    if (onAttachmentsChange) {
      onAttachmentsChange((attachments ?? []).filter((a) => a.type !== "video"));
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
                onPress={() => !readOnly && field.handleChange("written")}
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
                onPress={() => !readOnly && field.handleChange("video")}
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
                onPress={() => !readOnly && field.handleChange("both")}
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
          value={nonVideoAttachments}
          onChange={(newFiles) => {
            const video = (attachments ?? []).filter((a) => a.type === "video");
            onAttachmentsChange([...video, ...newFiles]);
          }}
          mode="all"
          maxFiles={10}
          placeholder="Add photos or files"
          showStorageIndicator
          onUpgradeRequired={onStorageUpgradeRequired}
        />
      )}

      {!readOnly && (
        <View style={legacyFormStyles.buttonContainer}>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => {
              const busy = isSaving || isSubmitting || isUploading;
              const buttonTitle = isUploading
                ? "Uploading..."
                : busy
                  ? "Saving..."
                  : "Finish & Save";
              return (
                <>
                  <Pressable
                    style={({ pressed }) => [
                      legacyFormStyles.primaryButton,
                      pressed && legacyFormStyles.primaryButtonPressed,
                      (busy || !canSubmit) && legacyFormStyles.primaryButtonDisabled,
                    ]}
                    onPress={() => handleSaveWithStatus("complete")}
                    disabled={busy || !canSubmit}
                  >
                    <Text
                      style={[
                        legacyFormStyles.primaryButtonText,
                        (busy || !canSubmit) && legacyFormStyles.primaryButtonTextDisabled,
                      ]}
                    >
                      {buttonTitle}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleSaveWithStatus("draft")}
                    disabled={busy}
                    style={legacyFormStyles.draftLinkContainer}
                  >
                    <Text style={legacyFormStyles.draftLinkText}>Save as Draft</Text>
                  </Pressable>
                </>
              );
            }}
          </form.Subscribe>
        </View>
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
