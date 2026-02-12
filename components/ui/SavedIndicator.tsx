/**
 * SavedIndicator - Floating auto-save error indicator
 *
 * Only surfaces UI when an auto-save fails. Success/saving states are silent
 * to keep the experience calm and unobtrusive.
 *
 * Behavior:
 * - idle/pending/saving/saved: Hidden
 * - error: Fades in, persists until tapped to dismiss
 */

import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AutoSaveStatus } from "@/hooks/useAutoSave";

const FADE_DURATION = 200;

interface SavedIndicatorProps {
  /** Current auto-save status */
  status: AutoSaveStatus;
  /** Error message to display when status is "error" */
  errorMessage?: string;
  /** Callback when error is dismissed */
  onDismissError?: () => void;
  /** Accent color for the indicator (unused, kept for API compatibility) */
  accentColor?: string;
}

export function SavedIndicator({
  status,
  errorMessage,
  onDismissError,
}: SavedIndicatorProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);

  const shouldShow = status === "error";

  useEffect(() => {
    opacity.value = withTiming(shouldShow ? 1 : 0, {
      duration: FADE_DURATION,
      easing: shouldShow ? Easing.out(Easing.ease) : Easing.in(Easing.ease),
    });
  }, [shouldShow, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value > 0.5 ? "auto" : "none",
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + spacing.md },
        animatedStyle,
      ]}
    >
      <Pressable
        style={[styles.pill, styles.errorPill]}
        onPress={onDismissError}
      >
        <Ionicons
          name="alert-circle"
          size={16}
          color={colors.error}
          style={styles.icon}
        />
        <Text style={styles.errorText} numberOfLines={1}>
          {errorMessage || "Failed to save"}
        </Text>
        <Text style={styles.tapToDismiss}>Tap to dismiss</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  errorPill: {
    borderColor: colors.error,
    maxWidth: "90%",
  },
  icon: {
    marginRight: spacing.xs,
  },
  errorText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    flexShrink: 1,
  },
  tapToDismiss: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily.regular,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
});
