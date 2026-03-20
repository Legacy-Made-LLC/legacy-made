/**
 * UndoButton - Navigation bar undo button
 *
 * Curved arrow icon that reverts the form to the previous checkpoint.
 * Full opacity when undo is available, 25% opacity when disabled.
 * 44x44pt touch target via padding wrapper.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { colors } from "@/constants/theme";

interface UndoButtonProps {
  /** Whether undo is available */
  canUndo: boolean;
  /** Callback when undo is pressed */
  onUndo: () => void;
}

export function UndoButton({ canUndo, onUndo }: UndoButtonProps) {
  return (
    <Pressable
      onPress={onUndo}
      disabled={!canUndo}
      style={styles.container}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel="Undo last change"
      accessibilityState={{ disabled: !canUndo }}
    >
      <Ionicons
        name="arrow-undo"
        size={20}
        color={colors.textPrimary}
        style={{ opacity: canUndo ? 1 : 0.25 }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});
