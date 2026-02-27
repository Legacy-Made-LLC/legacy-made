/**
 * KeyboardDoneButton - Floating "Done" pill above the keyboard
 *
 * Fades in with the keyboard and dismisses it on tap. Two behaviors:
 * - autoSave: spinner → checkmark → dismiss (for forms that save automatically)
 * - dismiss-only: just fades out and closes the keyboard
 */

import { colors, borderRadius, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import {
  useKeyboardState,
  useReanimatedKeyboardAnimation,
} from "react-native-keyboard-controller";

type DoneStatus = "idle" | "saving" | "done";

const SPINNER_DURATION_MS = 400;
const CHECKMARK_DURATION_MS = 350;
const FADE_OUT_GRACE_MS = 350;
const BUTTON_OFFSET = 12;

interface KeyboardDoneButtonProps {
  /** Pillar accent color for the button background */
  accentColor?: string;
  /** Whether tapping shows a save animation (true) or just dismisses (false) */
  autoSave?: boolean;
}

export function KeyboardDoneButton({
  accentColor = colors.primary,
  autoSave = false,
}: KeyboardDoneButtonProps) {
  const { height, progress } = useReanimatedKeyboardAnimation();
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  const [status, setStatus] = useState<DoneStatus>("idle");
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Mount when keyboard shows, stay mounted briefly after hide for fade-out
  useEffect(() => {
    if (isKeyboardVisible) {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      setVisible(true);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        setVisible(false);
        setStatus("idle");
      }, FADE_OUT_GRACE_MS);
    }
  }, [isKeyboardVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const handlePress = useCallback(() => {
    if (status !== "idle") return;

    if (!autoSave) {
      Keyboard.dismiss();
      return;
    }

    setStatus("saving");

    timeoutRef.current = setTimeout(() => {
      setStatus("done");
      timeoutRef.current = setTimeout(() => {
        Keyboard.dismiss();
      }, CHECKMARK_DURATION_MS);
    }, SPINNER_DURATION_MS);
  }, [status, autoSave]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value - BUTTON_OFFSET }],
    opacity: progress.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      pointerEvents={isKeyboardVisible ? "auto" : "none"}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: accentColor },
          pressed && status === "idle" && styles.buttonPressed,
        ]}
        disabled={status !== "idle"}
        hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
      >
        {status === "saving" ? (
          <ActivityIndicator size="small" color={colors.surface} />
        ) : status === "done" ? (
          <Ionicons name="checkmark" size={16} color={colors.surface} />
        ) : (
          <Text style={styles.doneText}>Done</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    right: spacing.md,
    zIndex: 50,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.pill,
    minWidth: 60,
    height: 32,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  doneText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.caption,
    color: colors.surface,
  },
});
