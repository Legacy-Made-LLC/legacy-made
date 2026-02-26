/**
 * SegmentedControl - iOS-style segmented toggle
 *
 * A clean two-or-more option toggle that slides an indicator
 * behind the selected segment.
 */

import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: readonly SegmentOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function SegmentedControl({
  options,
  value,
  onValueChange,
  disabled,
}: SegmentedControlProps) {
  const selectedIndex = options.findIndex((o) => o.value === value);
  const translateX = useSharedValue(0);

  // We'll measure segment width as a fraction (each segment is equal width)
  const segmentFraction = 1 / options.length;

  useEffect(() => {
    const idx = selectedIndex >= 0 ? selectedIndex : 0;
    translateX.value = withTiming(idx, { duration: 200 });
  }, [selectedIndex, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${translateX.value * segmentFraction * 100}%` as unknown as number,
    width: `${segmentFraction * 100}%` as unknown as number,
  }));

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={styles.segment}
          onPress={disabled ? undefined : () => onValueChange(option.value)}
        >
          <Text
            style={[
              styles.segmentText,
              option.value === value && styles.segmentTextSelected,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: 3,
    position: "relative",
  },
  containerDisabled: {
    opacity: 0.5,
  },
  indicator: {
    position: "absolute",
    top: 3,
    bottom: 3,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md - 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm + 2,
    zIndex: 1,
  },
  segmentText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  segmentTextSelected: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.semibold,
  },
});
