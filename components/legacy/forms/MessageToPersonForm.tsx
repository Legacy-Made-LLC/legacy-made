/**
 * MessageToPersonForm - Form for creating/editing a message to a specific person
 *
 * Used for: messages.people (list-based, save/cancel pattern)
 * Fields: recipient name, relationship (select), message type toggle,
 *         video recording / written message, short description, delivery timing
 */

import type { EntryCompletionStatus, FileAttachment, MessageToPersonMetadata, MetadataSchema } from "@/api/types";
import { FilePicker, FormInput, FormTextArea } from "@/components/forms";
import { RELATIONSHIP_OPTIONS } from "@/components/forms/ContactFormFields";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { Select } from "@/components/ui/Select";
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
  },
};

interface FormValues {
  recipientName: string;
  recipientRelationship: string;
  messageType: "video" | "written" | "both";
  writtenMessage: string;
  shortDescription: string;
  deliveryTiming: string;
}

export function MessageToPersonForm({
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
    }),
    [initialMetadata],
  );

  const submitForm = async (value: FormValues) => {
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
    };

    if (toast.isOffline()) return;

    try {
      await onSave({
        title: value.recipientName.trim() || "Draft",
        notes: null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: MESSAGE_TO_PERSON_SCHEMA,
        completionStatus: completionStatusRef.current,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save message";
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
        ? "View Message"
        : isNew
          ? "New Message"
          : "Edit Message",
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
            if (toast.isOffline()) return;
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
        // Remove any existing video, then add the new one
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
              onValueChange={(val) => !readOnly && field.handleChange(val)}
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
                      <Ionicons name="videocam" size={20} color={colors.surface} />
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
              onValueChange={(val) => !readOnly && field.handleChange(val)}
              options={DELIVERY_TIMING_OPTIONS}
              disabled={readOnly}
              onBlur={field.handleBlur}
            />
          </View>
        )}
      </form.Field>

      {!readOnly && onAttachmentsChange && (
        <FilePicker
          label="Photos & Files"
          value={nonVideoAttachments}
          onChange={(newFiles) => {
            // Merge non-video changes back with the recorded video
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
              Delete Message
            </Text>
          </Pressable>
        </View>
      )}
    </KeyboardAwareScrollView>
  );
}
