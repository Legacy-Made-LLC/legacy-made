/**
 * TaskStatusIndicator - Circle indicator showing task progress state
 *
 * Three states:
 * - Not started: dashed gray circle
 * - In progress: solid pillar-color border with bottom half filled (half-moon)
 * - Complete: filled pillar-color circle with checkmark
 */

import type { TaskProgressData } from "@/api/types";
import { colors, spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

const SIZE = 28;
const RADIUS = SIZE / 2;
const BORDER_WIDTH = 1.5;

interface TaskStatusIndicatorProps {
  progress: TaskProgressData | undefined;
  pillarColor: string;
}

export function TaskStatusIndicator({
  progress,
  pillarColor,
}: TaskStatusIndicatorProps) {
  const status = progress?.status;

  if (status === "complete") {
    return (
      <View style={[styles.base, styles.complete, { backgroundColor: pillarColor }]}>
        <Ionicons name="checkmark" size={18} color={colors.surface} />
      </View>
    );
  }

  if (status === "in_progress") {
    return (
      <View style={[styles.base, styles.inProgress, { borderColor: pillarColor }]}>
        <View style={[styles.halfFill, { backgroundColor: pillarColor }]} />
      </View>
    );
  }

  // Not started
  return <View style={[styles.base, styles.notStarted]} />;
}

const styles = StyleSheet.create({
  base: {
    width: SIZE,
    height: SIZE,
    borderRadius: RADIUS,
    marginRight: spacing.md,
  },
  notStarted: {
    borderWidth: BORDER_WIDTH,
    borderStyle: "dashed",
    borderColor: colors.textTertiary,
  },
  inProgress: {
    borderWidth: BORDER_WIDTH,
    overflow: "hidden",
  },
  halfFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "50%",
  },
  complete: {
    justifyContent: "center",
    alignItems: "center",
  },
});
