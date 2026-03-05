/**
 * RecordedVideoPreview - Inline preview of a recorded video
 *
 * Replaces the "Record Video" button after a video is recorded.
 * Shows a thumbnail with play overlay, plus re-record and remove actions.
 * Tapping the thumbnail opens the full video player.
 */

import type { FileAttachment } from "@/api/types";
import { FilePreviewModal } from "@/components/forms/FilePreviewModal";
import { colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface RecordedVideoPreviewProps {
  /** The video file attachment */
  video: FileAttachment;
  /** Called when user taps "Re-record" */
  onReRecord: () => void;
  /** Called when user taps "Remove" */
  onRemove: () => void;
}

export function RecordedVideoPreview({
  video,
  onReRecord,
  onRemove,
}: RecordedVideoPreviewProps) {
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);

  const isUploading = video.uploadStatus === "uploading";
  const hasError = video.uploadStatus === "error";

  return (
    <>
      <View style={styles.container}>
        {/* Thumbnail with play overlay */}
        <Pressable
          style={styles.thumbnailContainer}
          onPress={() => setPreviewFile(video)}
          accessibilityLabel="Play recorded video"
          accessibilityRole="button"
        >
          {video.thumbnailUri ? (
            <Image
              source={{ uri: video.thumbnailUri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Ionicons name="videocam" size={32} color={colors.textTertiary} />
            </View>
          )}
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={24} color="white" />
            </View>
          </View>
          {video.duration != null && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {formatDuration(video.duration)}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Status indicators */}
        {isUploading && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>Uploading video...</Text>
          </View>
        )}
        {hasError && (
          <View style={styles.statusContainer}>
            <Text style={styles.errorText}>
              {video.errorMessage ?? "Upload failed"}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={onReRecord}
            accessibilityLabel="Re-record video"
          >
            <Ionicons name="refresh" size={16} color={colors.featureLegacy} />
            <Text style={styles.actionButtonText}>Re-record</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={onRemove}
            accessibilityLabel="Remove video"
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={[styles.actionButtonText, styles.removeText]}>
              Remove
            </Text>
          </Pressable>
        </View>
      </View>

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  thumbnailContainer: {
    aspectRatio: 16 / 9,
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 3, // Optical centering for play icon
  },
  durationBadge: {
    position: "absolute",
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily.medium,
    color: "white",
    fontVariant: ["tabular-nums"],
  },
  statusContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.medium,
    color: colors.featureLegacy,
  },
  removeText: {
    color: colors.error,
  },
});
