/**
 * EntryStatusFooter - Status row displayed below entry forms
 *
 * Animated transitions:
 * - Status pill: background color crossfade, icon swap with checkmark pop
 * - Save label: "Saved" ↔ "Saving..." opacity crossfade
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type { EntryCompletionStatus } from "@/api/types";
import { colors, spacing, typography } from "@/constants/theme";
import type { AutoSaveStatus } from "@/hooks/useAutoSave";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PILL_MS = 250;
const PILL_TIMING = { duration: PILL_MS, easing: Easing.out(Easing.ease) };
const FADE_OUT = { duration: 120, easing: Easing.out(Easing.ease) };
const ICON_SPRING = { damping: 10, stiffness: 180, mass: 0.6 };
const SAVE_FADE = { duration: 180, easing: Easing.inOut(Easing.ease) };

const ICON_SIZE = 18;

interface EntryStatusFooterProps {
  status: EntryCompletionStatus;
  onToggleStatus: () => void;
  autoSaveStatus: AutoSaveStatus;
  pillarColor: string;
  errorMessage?: string;
  onDismissError?: () => void;
  readOnly?: boolean;
}

// ============================================================================
// Animated Save Status
// ============================================================================

function AnimatedSaveStatus({
  autoSaveStatus,
}: {
  autoSaveStatus: AutoSaveStatus;
}) {
  const isSaving = autoSaveStatus === "saving" || autoSaveStatus === "pending";

  const savedOpacity = useSharedValue(1);
  const savingOpacity = useSharedValue(0);

  useEffect(() => {
    savedOpacity.value = withTiming(isSaving ? 0 : 1, SAVE_FADE);
    savingOpacity.value = withTiming(isSaving ? 1 : 0, SAVE_FADE);
  }, [isSaving, savedOpacity, savingOpacity]);

  const savedStyle = useAnimatedStyle(() => ({ opacity: savedOpacity.value }));
  const savingStyle = useAnimatedStyle(() => ({
    opacity: savingOpacity.value,
  }));

  return (
    <View style={styles.saveStatus}>
      <Animated.Text style={[styles.saveText, savingStyle]}>
        Saving...
      </Animated.Text>
      <Animated.Text
        style={[styles.saveText, styles.saveTextOverlay, savedStyle]}
      >
        Saved
      </Animated.Text>
    </View>
  );
}

// ============================================================================
// Animated Status Pill
// ============================================================================

function AnimatedStatusPill({
  isDraft,
  pillarColor,
}: {
  isDraft: boolean;
  pillarColor: string;
}) {
  // 0 = draft, 1 = finished
  const progress = useSharedValue(isDraft ? 0 : 1);

  // Icons
  const pencilOpacity = useSharedValue(isDraft ? 1 : 0);
  const pencilScale = useSharedValue(isDraft ? 1 : 0.3);
  const checkOpacity = useSharedValue(isDraft ? 0 : 1);
  const checkScale = useSharedValue(isDraft ? 0.3 : 1);

  // Text
  const draftTextOpacity = useSharedValue(isDraft ? 1 : 0);
  const finishedTextOpacity = useSharedValue(isDraft ? 0 : 1);

  useEffect(() => {
    if (isDraft) {
      progress.value = withTiming(0, PILL_TIMING);
      pencilOpacity.value = withTiming(1, PILL_TIMING);
      pencilScale.value = withSpring(1, ICON_SPRING);
      checkOpacity.value = withTiming(0, FADE_OUT);
      checkScale.value = withTiming(0.3, FADE_OUT);
      draftTextOpacity.value = withTiming(1, PILL_TIMING);
      finishedTextOpacity.value = withTiming(0, FADE_OUT);
    } else {
      progress.value = withTiming(1, PILL_TIMING);
      pencilOpacity.value = withTiming(0, FADE_OUT);
      pencilScale.value = withTiming(0.3, FADE_OUT);
      checkOpacity.value = withTiming(1, PILL_TIMING);
      checkScale.value = withSpring(1, ICON_SPRING);
      draftTextOpacity.value = withTiming(0, FADE_OUT);
      finishedTextOpacity.value = withTiming(1, PILL_TIMING);
    }
  }, [
    isDraft,
    progress,
    pencilOpacity,
    pencilScale,
    checkOpacity,
    checkScale,
    draftTextOpacity,
    finishedTextOpacity,
  ]);

  const draftBg = colors.surfaceSecondary;

  const pillBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [draftBg, pillarColor],
    ),
  }));

  const pencilStyle = useAnimatedStyle(() => ({
    opacity: pencilOpacity.value,
    transform: [{ scale: pencilScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const draftLabelStyle = useAnimatedStyle(() => ({
    opacity: draftTextOpacity.value,
  }));

  const finishedLabelStyle = useAnimatedStyle(() => ({
    opacity: finishedTextOpacity.value,
  }));

  return (
    <Animated.View style={[styles.pill, pillBgStyle]}>
      <View style={styles.iconBox}>
        <Animated.View style={[styles.iconLayer, pencilStyle]}>
          <Ionicons
            name="pencil-outline"
            size={ICON_SIZE}
            color={colors.textSecondary}
          />
        </Animated.View>
        <Animated.View style={[styles.iconLayer, checkStyle]}>
          <Ionicons
            name="checkmark-circle-outline"
            size={ICON_SIZE}
            color={colors.surface}
          />
        </Animated.View>
      </View>

      {/* "Finished" sizes the container since it's longer; "Draft" overlays */}
      <View>
        <Animated.Text
          style={[
            styles.pillText,
            { color: colors.surface },
            finishedLabelStyle,
          ]}
        >
          Finished
        </Animated.Text>
        <Animated.Text
          style={[
            styles.pillText,
            styles.textOverlay,
            { color: colors.textSecondary },
            draftLabelStyle,
          ]}
        >
          Draft
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EntryStatusFooter({
  status,
  onToggleStatus,
  autoSaveStatus,
  pillarColor,
  readOnly,
}: EntryStatusFooterProps) {
  const insets = useSafeAreaInsets();
  if (readOnly) return null;

  const isDraft = status === "draft";

  return (
    <View
      style={{ ...styles.container, paddingBottom: insets.bottom + spacing.xs }}
    >
      <AnimatedStatusPill isDraft={isDraft} pillarColor={pillarColor} />

      <Pressable
        onPress={onToggleStatus}
        style={styles.toggleButton}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isDraft ? "Mark as finished" : "Mark as draft"}
      >
        <Animated.Text
          style={[
            styles.toggleText,
            isDraft ? { color: pillarColor } : styles.toggleTextDeemphasized,
          ]}
        >
          {isDraft ? "Mark as finished" : "Mark as draft"}
        </Animated.Text>
      </Pressable>

      <AnimatedSaveStatus autoSaveStatus={autoSaveStatus} />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  iconBox: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  iconLayer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  textOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  pillText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
  },
  toggleButton: {
    marginLeft: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    minHeight: 44,
    justifyContent: "center",
  },
  toggleText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.bodySmall,
  },
  toggleTextDeemphasized: {
    color: colors.textTertiary,
  },
  saveStatus: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  saveText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    textAlign: "right",
  },
  saveTextOverlay: {
    position: "absolute",
    right: 0,
  },
});
