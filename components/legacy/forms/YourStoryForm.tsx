/**
 * YourStoryForm - Singleton form for "Your Story" legacy message
 *
 * Used for: messages.story (singleton, auto-save pattern like wishes)
 * Captures a personal life story via written text or video.
 * Auto-save enabled - changes are saved automatically.
 */

import type { FileAttachment, MetadataSchema, YourStoryMetadata } from "@/api/types";
import { FilePicker, FormTextArea } from "@/components/forms";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { colors, spacing } from "@/constants/theme";
import { setVideoRecordedCallback } from "@/lib/videoRecordingBridge";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LegacySaveData, LegacySingletonFormProps } from "../registry";
import { legacyFormStyles } from "./formStyles";
import { RecordedVideoPreview } from "./RecordedVideoPreview";

const YOUR_STORY_SCHEMA: MetadataSchema = {
  version: 1,
  fields: {
    messageType: {
      label: "Story Type",
      order: 1,
      valueLabels: { video: "Video", written: "Written", both: "Both" },
    },
    writtenStory: { label: "Your Story", order: 2 },
  },
};

const INSPIRATION_QUESTIONS = [
  "What shaped you into who you are?",
  "What are you most proud of?",
  "What do you hope is remembered about you?",
  "What was the happiest time of your life?",
  "What advice would you give to those you leave behind?",
];

interface FormValues {
  messageType: "video" | "written" | "both";
  writtenStory: string;
}

export function YourStoryForm({
  taskKey,
  initialData,
  onFormReady,
  registerGetSaveData,
  guidance,
  attachments,
  onAttachmentsChange,
  isUploading,
  onStorageUpgradeRequired,
  readOnly,
}: LegacySingletonFormProps) {
  const navigation = useNavigation();
  const router = useRouter();
  const { sectionId, taskId } = useLocalSearchParams<{
    sectionId: string;
    taskId: string;
  }>();
  const insets = useSafeAreaInsets();

  // Inspiration section animation
  const inspirationProgress = useSharedValue(0);
  const inspirationChevron = useSharedValue(0);
  const inspirationContentHeight = useSharedValue(0);
  const inspirationIsExpanded = useSharedValue(false);

  const handleInspirationToggle = useCallback(() => {
    const expanding = !inspirationIsExpanded.value;
    inspirationIsExpanded.value = expanding;
    inspirationProgress.value = withTiming(expanding ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
    inspirationChevron.value = withTiming(expanding ? 90 : 0, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [inspirationProgress, inspirationChevron, inspirationIsExpanded]);

  const onInspirationContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      if (height > 0) {
        inspirationContentHeight.value = height;
      }
    },
    [inspirationContentHeight],
  );

  const inspirationBodyStyle = useAnimatedStyle(() => ({
    height: interpolate(
      inspirationProgress.value,
      [0, 1],
      [0, inspirationContentHeight.value],
      Extrapolation.CLAMP,
    ),
    opacity: inspirationProgress.value,
    overflow: "hidden" as const,
  }));

  const inspirationChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${inspirationChevron.value}deg` }],
  }));

  const initialMetadata = initialData?.metadata as
    | YourStoryMetadata
    | undefined;

  const defaultValues = useMemo<FormValues>(
    () => ({
      messageType: initialMetadata?.messageType ?? "written",
      writtenStory: initialMetadata?.writtenStory ?? "",
    }),
    [initialMetadata],
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
    const getSaveData = (): LegacySaveData => {
      const values = form.state.values;
      const metadata: YourStoryMetadata = {
        messageType: values.messageType,
        writtenStory: values.writtenStory.trim() || undefined,
      };

      return {
        title: "Your Story",
        notes: null,
        metadata: metadata as unknown as Record<string, unknown>,
        metadataSchema: YOUR_STORY_SCHEMA,
      };
    };

    registerGetSaveData?.(getSaveData);
  }, [form, registerGetSaveData]);

  useEffect(() => {
    navigation.setOptions({
      title: "Your Story",
    });
  }, [navigation]);

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
      {guidance && (
        <ExpandableGuidanceCard
          icon={guidance.icon as keyof typeof Ionicons.glyphMap}
          triggerText={guidance.triggerText}
          heading={guidance.heading}
          detail={guidance.detail}
          tips={guidance.tips}
          pacingNote={guidance.pacingNote}
          accentColor={colors.featureLegacy}
          accentTint={colors.featureLegacyTint}
          accentDark={colors.featureLegacyDark}
        />
      )}

      <View style={legacyFormStyles.fieldContainer}>
        <Text style={legacyFormStyles.label}>How would you like to share?</Text>
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
                    <Text style={legacyFormStyles.label}>Record Your Story</Text>
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
                      Up to 3 minutes. Share your story in your own words.
                    </Text>
                  </>
                )}
              </View>
            )}
            {(messageType === "written" || messageType === "both") && (
              <form.Field name="writtenStory">
                {(field) => (
                  <View style={legacyFormStyles.fieldContainer}>
                    <FormTextArea
                      field={field}
                      label="Your Story"
                      placeholder="Share who you are, what matters to you, and what you want your loved ones to remember..."
                      maxLength={10000}
                      disabled={readOnly}
                    />
                  </View>
                )}
              </form.Field>
            )}
          </>
        )}
      </form.Subscribe>

      <View style={legacyFormStyles.inspirationContainer}>
        <Pressable
          style={legacyFormStyles.inspirationTrigger}
          onPress={handleInspirationToggle}
          accessibilityRole="button"
          accessibilityLabel="Need inspiration? Some questions to consider"
        >
          <Animated.View style={inspirationChevronStyle}>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={colors.featureLegacyDark}
            />
          </Animated.View>
          <Text style={legacyFormStyles.inspirationTriggerText}>
            Need inspiration? Some questions to consider...
          </Text>
        </Pressable>
        <Animated.View style={inspirationBodyStyle}>
          <View
            onLayout={onInspirationContentLayout}
            style={legacyFormStyles.inspirationContent}
          >
            {INSPIRATION_QUESTIONS.map((question) => (
              <View key={question} style={legacyFormStyles.inspirationItem}>
                <Text style={legacyFormStyles.inspirationBullet}>
                  {"\u2022"}
                </Text>
                <Text style={legacyFormStyles.inspirationText}>
                  {question}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      {!readOnly && onAttachmentsChange && (
        <FilePicker
          label="Life Photos"
          value={supplementalAttachments}
          onChange={(newFiles) => {
            const tagged = newFiles.map((f) =>
              f.type === "video" && !f.role ? { ...f, role: "attachment" as const } : f,
            );
            const recorded = (attachments ?? []).filter(isRecordedVideo);
            onAttachmentsChange([...recorded, ...tagged]);
          }}
          mode="all"
          maxFiles={20}
          placeholder="Add photos that tell your story"
          showStorageIndicator
          onUpgradeRequired={onStorageUpgradeRequired}
        />
      )}
    </KeyboardAwareScrollView>
  );
}
