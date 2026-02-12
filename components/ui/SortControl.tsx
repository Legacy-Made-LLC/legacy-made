/**
 * SortControl - Pill toggle for sorting entries (A-Z / Recent)
 *
 * Only rendered when there are 2+ entries.
 */

import { colors, spacing, typography } from "@/constants/theme";
import type { SortMode } from "@/hooks/useSortedEntries";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface SortControlProps {
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  /** Active pill background color. Defaults to colors.primary (sage green). */
  tint?: string;
}

export function SortControl({ sortMode, onSortModeChange, tint }: SortControlProps) {
  const activeBg = tint ?? colors.primary;
  return (
    <View style={styles.container}>
      <View style={styles.pillRow}>
        <Pressable
          onPress={() => onSortModeChange("alphabetical")}
          style={({ pressed }) => [
            styles.pill,
            { backgroundColor: sortMode === "alphabetical" ? activeBg : colors.surfaceSecondary },
            pressed && styles.pillPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Sort alphabetically"
          accessibilityState={{ selected: sortMode === "alphabetical" }}
        >
          <Text
            style={[
              styles.pillText,
              sortMode === "alphabetical"
                ? styles.pillTextActive
                : styles.pillTextInactive,
            ]}
          >
            A–Z
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onSortModeChange("recent")}
          style={({ pressed }) => [
            styles.pill,
            { backgroundColor: sortMode === "recent" ? activeBg : colors.surfaceSecondary },
            pressed && styles.pillPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Sort by most recent"
          accessibilityState={{ selected: sortMode === "recent" }}
        >
          <Text
            style={[
              styles.pillText,
              sortMode === "recent"
                ? styles.pillTextActive
                : styles.pillTextInactive,
            ]}
          >
            Recent
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: spacing.sm,
  },
  pillRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 14,
    minHeight: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  pillPressed: {
    opacity: 0.7,
  },
  pillText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  pillTextInactive: {
    color: colors.textSecondary,
  },
});
