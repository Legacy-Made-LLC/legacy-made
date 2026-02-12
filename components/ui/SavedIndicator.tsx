/**
 * SavedIndicator - Floating auto-save status indicator
 *
 * Shows the current auto-save status as a floating pill at the bottom of the screen.
 * Uses Reanimated for smooth fade animations.
 *
 * Behavior:
 * - idle/pending: Hidden
 * - saving: Shows "Saving..." (only if visible > 300ms to avoid flicker)
 * - saved: Fade in, hold 1.5s, fade out
 * - error: Persists until tapped to dismiss
 */

import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AutoSaveStatus } from "@/hooks/useAutoSave";

// Animation configuration
const FADE_DURATION = 200;
const SAVING_SHOW_DELAY = 300; // Don't show "Saving..." until after this delay

interface SavedIndicatorProps {
  /** Current auto-save status */
  status: AutoSaveStatus;
  /** Error message to display when status is "error" */
  errorMessage?: string;
  /** Callback when error is dismissed */
  onDismissError?: () => void;
  /** Accent color for the indicator (default: featureWishes) */
  accentColor?: string;
}

export function SavedIndicator({
  status,
  errorMessage,
  onDismissError,
  accentColor = colors.featureWishes,
}: SavedIndicatorProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const savingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track if we should show saving indicator (after delay)
  const [showSaving, setShowSaving] = React.useState(false);

  // Handle saving delay to prevent flicker
  useEffect(() => {
    if (status === "saving") {
      savingTimerRef.current = setTimeout(() => {
        setShowSaving(true);
      }, SAVING_SHOW_DELAY);
    } else {
      if (savingTimerRef.current) {
        clearTimeout(savingTimerRef.current);
        savingTimerRef.current = null;
      }
      setShowSaving(false);
    }

    return () => {
      if (savingTimerRef.current) {
        clearTimeout(savingTimerRef.current);
      }
    };
  }, [status]);

  // Determine visibility based on status
  const shouldShow =
    status === "saved" ||
    status === "error" ||
    (status === "saving" && showSaving);

  // Animate opacity based on visibility
  useEffect(() => {
    if (shouldShow) {
      opacity.value = withTiming(1, {
        duration: FADE_DURATION,
        easing: Easing.out(Easing.ease),
      });
    } else {
      opacity.value = withDelay(
        status === "idle" ? 0 : FADE_DURATION,
        withTiming(0, {
          duration: FADE_DURATION,
          easing: Easing.in(Easing.ease),
        }),
      );
    }
  }, [shouldShow, status, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value > 0.5 ? "auto" : "none",
  }));

  // Render content based on status
  const renderContent = () => {
    if (status === "error") {
      return (
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
      );
    }

    if (status === "saving" && showSaving) {
      return (
        <View style={[styles.pill, { borderColor: accentColor }]}>
          <Text style={[styles.text, { color: accentColor }]}>Saving...</Text>
        </View>
      );
    }

    if (status === "saved") {
      return (
        <View style={[styles.pill, { borderColor: accentColor }]}>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={accentColor}
            style={styles.icon}
          />
          <Text style={[styles.text, { color: accentColor }]}>Saved</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + spacing.md },
        animatedStyle,
      ]}
    >
      {renderContent()}
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
    // Shadow for depth
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
  text: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.medium,
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
