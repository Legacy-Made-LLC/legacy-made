/**
 * CircularProgress - A circular progress indicator
 *
 * Pure View-based implementation with Reanimated animations.
 * Progress starts at 12 o'clock and moves clockwise.
 */

import { colors } from "@/constants/theme";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface CircularProgressProps {
  progress: number;
  size: number;
  strokeWidth?: number;
  progressColor?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  progress,
  size,
  strokeWidth = 3,
  progressColor = colors.primary,
  trackColor = colors.surfaceSecondary,
  children,
}: CircularProgressProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const radius = size / 2;
  const innerRadius = radius - strokeWidth;

  // Animated progress value
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(clampedProgress, { duration: 600 });
  }, [clampedProgress, animatedProgress]);

  // Animated style for the first half (right side, 0-180°)
  const firstHalfStyle = useAnimatedStyle(() => {
    const degrees = animatedProgress.value * 360;
    const firstHalfDegrees = Math.min(degrees, 180);
    return {
      transform: [{ rotate: `${-135 + firstHalfDegrees}deg` }],
    };
  });

  // Animated style for the second half (left side, 180-360°)
  const secondHalfStyle = useAnimatedStyle(() => {
    const degrees = animatedProgress.value * 360;
    const secondHalfDegrees = Math.max(degrees - 180, 0);
    return {
      transform: [{ rotate: `${-135 + secondHalfDegrees}deg` }],
    };
  });

  // Animated opacity for second half (only show when > 50%)
  const secondHalfContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedProgress.value > 0.5 ? 1 : 0,
    };
  });

  // Animated opacity for first half (only show when > 0%)
  const firstHalfContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedProgress.value > 0 ? 1 : 0,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background track ring */}
      <View
        style={[
          styles.absolute,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: trackColor,
          },
        ]}
      />

      {/* Progress ring - Right half (0-180°, clockwise from top) */}
      <Animated.View
        style={[
          styles.halfMask,
          {
            width: radius,
            height: size,
            left: radius,
            overflow: "hidden",
          },
          firstHalfContainerStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.absolute,
            {
              width: size,
              height: size,
              left: -radius,
              borderRadius: radius,
              borderWidth: strokeWidth,
              borderColor: "transparent",
              borderTopColor: progressColor,
              borderRightColor: progressColor,
            },
            firstHalfStyle,
          ]}
        />
      </Animated.View>

      {/* Progress ring - Left half (180-360°, clockwise continuing) */}
      <Animated.View
        style={[
          styles.halfMask,
          {
            width: radius,
            height: size,
            left: 0,
            overflow: "hidden",
          },
          secondHalfContainerStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.absolute,
            {
              width: size,
              height: size,
              left: 0,
              borderRadius: radius,
              borderWidth: strokeWidth,
              borderColor: "transparent",
              borderBottomColor: progressColor,
              borderLeftColor: progressColor,
            },
            secondHalfStyle,
          ]}
        />
      </Animated.View>

      {/* Inner circle to create ring effect */}
      <View
        style={[
          styles.innerCircle,
          {
            width: innerRadius * 2,
            height: innerRadius * 2,
            borderRadius: innerRadius,
            backgroundColor: colors.surface,
          },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  absolute: {
    position: "absolute",
  },
  halfMask: {
    position: "absolute",
  },
  innerCircle: {
    position: "absolute",
  },
  content: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
});
