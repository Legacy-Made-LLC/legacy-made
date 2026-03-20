/**
 * KeyboardDoneButton - Floating "Done" pill above the keyboard
 *
 * Fades in with the keyboard and dismisses it on tap.
 */

import { colors, borderRadius, spacing, typography } from "@/constants/theme";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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

const FADE_OUT_GRACE_MS = 350;
const BUTTON_OFFSET = 12;

interface KeyboardDoneButtonProps {
  /** Pillar accent color for the button background */
  accentColor?: string;
}

export function KeyboardDoneButton({
  accentColor = colors.primary,
}: KeyboardDoneButtonProps) {
  const { height, progress } = useReanimatedKeyboardAnimation();
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Mount when keyboard shows, stay mounted briefly after hide for fade-out
  useEffect(() => {
    if (isKeyboardVisible) {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      setVisible(true);
    } else {
      hideTimeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, FADE_OUT_GRACE_MS);
    }
  }, [isKeyboardVisible]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const handlePress = useCallback(() => {
    Keyboard.dismiss();
  }, []);

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
          pressed && styles.buttonPressed,
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
      >
        <Text style={styles.doneText}>Done</Text>
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
