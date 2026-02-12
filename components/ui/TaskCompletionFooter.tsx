/**
 * TaskCompletionFooter - Fixed footer for marking tasks complete
 *
 * Two states:
 * - Not complete: "Mark as Complete" button + "Come Back Later" link
 * - Complete: Checkmark + "Completed" text + "Mark as Incomplete" link
 *
 * Only renders when the task has content (entries > 0 or wish exists).
 */

import {
  borderRadius,
  colors,
  componentStyles,
  spacing,
  typography,
} from "@/constants/theme";
import {
  useMarkTaskComplete,
  useMarkTaskInProgress,
  useTaskProgressQuery,
} from "@/hooks/queries";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TaskCompletionFooterProps {
  /** The task key to track progress for */
  taskKey: string;
  /** Accent color for the primary button (pillar color) */
  pillarColor: string;
  /** Light tint variant of the pillar color (for completed state background) */
  pillarTint: string;
  /** Navigate back when "Come Back Later" is tapped */
  onComeBackLater: () => void;
}

export function TaskCompletionFooter({
  taskKey,
  pillarColor,
  pillarTint,
  onComeBackLater,
}: TaskCompletionFooterProps) {
  const insets = useSafeAreaInsets();
  const { data: progressData } = useTaskProgressQuery(taskKey);
  const markComplete = useMarkTaskComplete(taskKey);
  const markInProgress = useMarkTaskInProgress(taskKey);

  const scale = useSharedValue(1);
  const checkScale = useSharedValue(0);
  const wasComplete = useRef(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const isComplete = progressData?.status === "complete";

  // Pop animation when checkmark appears
  useEffect(() => {
    if (isComplete && !wasComplete.current) {
      checkScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1, { damping: 50, stiffness: 800 }),
      );
    } else if (isComplete) {
      checkScale.value = 1;
    } else {
      checkScale.value = 0;
    }
    wasComplete.current = !!isComplete;
  }, [isComplete, checkScale]);

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom + spacing.sm }]}
    >
      <AnimatedPressable
        onPress={() => markComplete.mutate()}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.primaryButton,
          { backgroundColor: isComplete ? pillarTint : pillarColor },
          animatedStyle,
        ]}
        disabled={isComplete}
      >
        {isComplete && (
          <Animated.View style={[styles.buttonIcon, checkAnimatedStyle]}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={pillarColor}
            />
          </Animated.View>
        )}
        <Text
          style={[
            styles.primaryButtonText,
            isComplete && { color: pillarColor },
          ]}
        >
          {isComplete ? "Marked as Complete" : "Mark as Complete"}
        </Text>
      </AnimatedPressable>
      <Pressable
        onPress={isComplete ? () => markInProgress.mutate() : onComeBackLater}
        hitSlop={8}
      >
        <Text style={styles.linkText}>
          {isComplete ? "Mark as Incomplete" : "Come Back Later"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    alignItems: "center",
    gap: spacing.sm,
  },
  primaryButton: {
    flexDirection: "row",
    height: componentStyles.button.height,
    borderRadius: borderRadius.pill,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    width: "100%",
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.semibold,
  },
  linkText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    color: colors.textTertiary,
    paddingVertical: spacing.xs,
  },
});
