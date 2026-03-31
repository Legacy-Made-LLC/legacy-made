/**
 * EntryStatusFooter - Status row displayed below entry forms
 *
 * Animated transitions:
 * - Status pill: background color crossfade, icon swap with checkmark pop
 * - Save label: "Saved" ↔ "Saving..." opacity crossfade
 * - Popover: fade + slide up on open/close
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import type { AutoSaveStatus } from "@/hooks/useAutoSave";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PILL_MS = 250;
const PILL_TIMING = { duration: PILL_MS, easing: Easing.out(Easing.ease) };
const FADE_OUT = { duration: 120, easing: Easing.out(Easing.ease) };
const ICON_SPRING = { damping: 10, stiffness: 180, mass: 0.6 };
const SAVE_FADE = { duration: 180, easing: Easing.inOut(Easing.ease) };
const POPOVER_TIMING = { duration: 150, easing: Easing.out(Easing.ease) };

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
      <Animated.View style={[styles.saveRow, savingStyle]}>
        <Animated.Text style={styles.saveText}>Saving...</Animated.Text>
      </Animated.View>
      <Animated.View
        style={[styles.saveRow, styles.saveTextOverlay, savedStyle]}
      >
        <Ionicons
          name="cloud-done-outline"
          size={13}
          color="#B8B8B8"
          style={styles.saveCheckIcon}
        />
        <Animated.Text style={styles.saveText}>Saved</Animated.Text>
      </Animated.View>
    </View>
  );
}

// ============================================================================
// Status Popover
// ============================================================================

function StatusPopover({
  isDraft,
  pillarColor,
  onSelect,
  onClose,
}: {
  isDraft: boolean;
  pillarColor: string;
  onSelect: () => void;
  onClose: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);

  useEffect(() => {
    opacity.value = withTiming(1, POPOVER_TIMING);
    translateY.value = withTiming(0, POPOVER_TIMING);
  }, [opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <>
      <Pressable style={styles.popoverBackdrop} onPress={onClose} />
      <Animated.View style={[styles.popover, animStyle]}>
        <Pressable
          style={styles.popoverOption}
          onPress={() => {
            onSelect();
            onClose();
          }}
        >
          <Ionicons
            name={isDraft ? "checkmark-circle-outline" : "pencil-outline"}
            size={16}
            color={isDraft ? pillarColor : colors.textSecondary}
          />
          <Animated.Text
            style={[
              styles.popoverText,
              { color: isDraft ? pillarColor : colors.textSecondary },
            ]}
          >
            {isDraft ? "Mark as finished" : "Mark as draft"}
          </Animated.Text>
        </Pressable>
      </Animated.View>
    </>
  );
}

// ============================================================================
// Animated Status Pill (now pressable)
// ============================================================================

function AnimatedStatusPill({
  isDraft,
  pillarColor,
  onPress,
}: {
  isDraft: boolean;
  pillarColor: string;
  onPress: () => void;
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

  const draftBg = colors.surfaceRaised;

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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        isDraft ? "Draft — tap to change" : "Finished — tap to change"
      }
    >
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

        <Ionicons
          name="chevron-down"
          size={14}
          color={isDraft ? colors.textTertiary : colors.surface}
        />
      </Animated.View>
    </Pressable>
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
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPopover = useCallback(() => setPopoverOpen(true), []);
  const closePopover = useCallback(() => setPopoverOpen(false), []);

  // Auto-dismiss popover after a few seconds
  useEffect(() => {
    if (popoverOpen) {
      popoverTimerRef.current = setTimeout(() => {
        setPopoverOpen(false);
      }, 4000);
    }
    return () => {
      if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
    };
  }, [popoverOpen]);

  if (readOnly) return null;

  const isDraft = status === "draft";

  return (
    <View
      style={{ ...styles.container, paddingBottom: insets.bottom + spacing.xs }}
    >
      <View style={styles.pillWrapper}>
        <AnimatedStatusPill
          isDraft={isDraft}
          pillarColor={pillarColor}
          onPress={openPopover}
        />
        {popoverOpen && (
          <StatusPopover
            isDraft={isDraft}
            pillarColor={pillarColor}
            onSelect={onToggleStatus}
            onClose={closePopover}
          />
        )}
      </View>

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
  pillWrapper: {
    position: "relative",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
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
  // Popover
  popoverBackdrop: {
    ...StyleSheet.absoluteFill,
    // Invisible full-area press target to close popover
    // positioned via the portal-like behavior of the wrapper
    position: "fixed" as never,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9,
  },
  popover: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
    minWidth: 180,
  },
  popoverOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  popoverText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.bodySmall,
  },
  // Save status
  saveStatus: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  saveCheckIcon: {
    marginRight: 3,
  },
  saveText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: "#B8B8B8",
    textAlign: "right",
  },
  saveTextOverlay: {
    position: "absolute",
    right: 0,
  },
});
