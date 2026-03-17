/**
 * Video Recording Screen
 *
 * Full-screen camera view for recording video messages.
 * Presented as a modal with:
 * - Camera preview
 * - Timer (up to 3 minutes)
 * - Record/stop controls
 * - Front/back camera toggle
 * - Preview with retake/use options
 *
 * Returns the recorded video URI via router params.
 */

import { colors, spacing, typography } from "@/constants/theme";
import { useVideoRecorder } from "@/hooks/useVideoRecorder";
import {
  clearVideoRecordedCallback,
  emitVideoRecorded,
} from "@/lib/videoRecordingBridge";
import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MAX_DURATION_SECONDS = 180;

export default function VideoRecordingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    state,
    hasPermissions,
    isCheckingPermissions,
    facing,
    timerDisplay,
    elapsedSeconds,
    videoUri,
    startRecording,
    stopRecording,
    toggleFacing,
    retake,
    requestPermissions,
    cameraRef,
  } = useVideoRecorder({ maxDurationSeconds: MAX_DURATION_SECONDS });

  // Request permissions on mount
  useEffect(() => {
    if (!hasPermissions && !isCheckingPermissions) {
      requestPermissions();
    }
  }, [hasPermissions, isCheckingPermissions, requestPermissions]);

  const handleClose = useCallback(() => {
    if (state === "recording") {
      stopRecording();
    }
    clearVideoRecordedCallback();
    router.back();
  }, [state, stopRecording, router]);

  const handleUseVideo = useCallback(async () => {
    if (!videoUri) return;
    await emitVideoRecorded(videoUri);
    router.back();
  }, [videoUri, router]);

  // Video preview player
  const [isPlaying, setIsPlaying] = useState(false);
  const previewPlayer = useVideoPlayer(videoUri ?? "", (player) => {
    player.loop = true;
  });

  // Update player source when videoUri becomes available
  useEffect(() => {
    if (videoUri && previewPlayer) {
      const updateVideoUri = async () => {
        previewPlayer.replaceAsync(videoUri);
        previewPlayer.loop = true;
        previewPlayer.play();
        setIsPlaying(true);
      };
      updateVideoUri();
    }
  }, [videoUri, previewPlayer]);

  const togglePlayback = useCallback(() => {
    if (!previewPlayer) return;
    if (isPlaying) {
      previewPlayer.pause();
      setIsPlaying(false);
    } else {
      previewPlayer.play();
      setIsPlaying(true);
    }
  }, [previewPlayer, isPlaying]);

  // Timer progress (0 to 1)
  const progress = elapsedSeconds / MAX_DURATION_SECONDS;

  if (isCheckingPermissions) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centered}>
          <Text style={styles.permissionText}>Checking permissions...</Text>
        </View>
      </View>
    );
  }

  if (!hasPermissions) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color="white" />
        </Pressable>
        <View style={styles.centered}>
          <Ionicons
            name="videocam-off-outline"
            size={48}
            color={colors.textTertiary}
          />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            To record video messages, please allow camera and microphone access
            in your device settings.
          </Text>
          <Pressable
            style={styles.permissionButton}
            onPress={requestPermissions}
          >
            <Text style={styles.permissionButtonText}>Grant Access</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Preview state - show recorded video
  if (state === "preview" && videoUri) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <VideoView
          player={previewPlayer}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
        {/* Tap to play/pause */}
        <Pressable
          style={styles.playPauseTouchArea}
          onPress={togglePlayback}
          accessibilityLabel={isPlaying ? "Pause video" : "Play video"}
          accessibilityRole="button"
        >
          {!isPlaying && (
            <View style={styles.playPauseIcon}>
              <Ionicons name="play" size={36} color="white" />
            </View>
          )}
        </Pressable>
        <View style={[styles.overlay, { paddingTop: insets.top + spacing.md }]}>
          <Text style={styles.previewLabel}>Preview</Text>
        </View>
        <View
          style={[
            styles.previewControls,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
        >
          <Pressable style={styles.retakeButton} onPress={retake}>
            <Ionicons name="refresh" size={22} color="white" />
            <Text style={styles.retakeText}>Retake</Text>
          </Pressable>
          <Pressable style={styles.useVideoButton} onPress={handleUseVideo}>
            <Ionicons name="checkmark" size={22} color="white" />
            <Text style={styles.useVideoText}>Use Video</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Recording / idle state - show camera
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="video"
      />

      {/* Top controls overlay */}
      <View
        style={[styles.topControls, { paddingTop: insets.top + spacing.sm }]}
      >
        <Pressable
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={12}
        >
          <Ionicons name="close" size={28} color="white" />
        </Pressable>

        {state === "recording" && (
          <View style={styles.timerContainer}>
            <View style={styles.recordingDot} />
            <Text style={styles.timerText}>{timerDisplay}</Text>
          </View>
        )}

        <Pressable
          style={styles.flipButton}
          onPress={toggleFacing}
          hitSlop={12}
          disabled={state === "recording"}
        >
          <Ionicons
            name="camera-reverse-outline"
            size={26}
            color={state === "recording" ? "rgba(255,255,255,0.3)" : "white"}
          />
        </Pressable>
      </View>

      {/* Bottom controls */}
      <View
        style={[
          styles.bottomControls,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        {state === "idle" && (
          <Text style={styles.instructionText}>
            Tap to start recording (up to 3 minutes)
          </Text>
        )}

        {state === "recording" && (
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBar, { width: `${progress * 100}%` }]}
            />
          </View>
        )}

        <Pressable
          style={[
            styles.recordButton,
            state === "recording" && styles.recordButtonRecording,
          ]}
          onPress={state === "idle" ? startRecording : stopRecording}
        >
          <View
            style={[
              styles.recordButtonInner,
              state === "recording" && styles.recordButtonInnerRecording,
            ]}
          />
        </Pressable>

        {state === "recording" && (
          <Text style={styles.stopHint}>Tap to stop</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  // Permission states
  permissionTitle: {
    fontSize: typography.sizes.titleLarge,
    fontFamily: typography.fontFamily.semibold,
    color: "white",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  permissionText: {
    fontSize: typography.sizes.body,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  permissionButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.featureLegacy,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 26,
  },
  permissionButtonText: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.semibold,
    color: "white",
  },
  // Top controls
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  flipButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: spacing.sm,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  timerText: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.medium,
    color: "white",
    fontVariant: ["tabular-nums"],
  },
  // Bottom controls
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  instructionText: {
    fontSize: typography.sizes.bodySmall,
    color: "rgba(255,255,255,0.8)",
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  progressBarContainer: {
    width: "60%",
    height: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 1.5,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FF3B30",
    borderRadius: 1.5,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  recordButtonRecording: {
    borderColor: "rgba(255,255,255,0.5)",
  },
  recordButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF3B30",
  },
  recordButtonInnerRecording: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  stopHint: {
    fontSize: typography.sizes.caption,
    color: "rgba(255,255,255,0.6)",
    marginTop: spacing.xs,
  },
  // Play/pause overlay
  playPauseTouchArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 120,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  playPauseIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 4, // Optical centering for play icon
  },
  // Preview controls
  previewLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.medium,
    color: "white",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  previewControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 26,
  },
  retakeText: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.medium,
    color: "white",
  },
  useVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.featureLegacy,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 26,
  },
  useVideoText: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.semibold,
    color: "white",
  },
});
