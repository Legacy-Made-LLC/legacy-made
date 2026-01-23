/**
 * SkeletonCard - Loading placeholder that mimics entry card structure
 *
 * Shows animated placeholder bars while content is loading.
 * Uses a subtle pulse animation to indicate loading state.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { colors, shadows, componentStyles, spacing } from '@/constants/theme';

// Animation configuration
const PULSE_DURATION = 1000;
const PULSE_MIN_OPACITY = 0.4;
const PULSE_MAX_OPACITY = 0.7;

interface SkeletonCardProps {
  /** Whether to show a subtitle placeholder */
  showSubtitle?: boolean;
}

export function SkeletonCard({ showSubtitle = true }: SkeletonCardProps) {
  const opacity = useSharedValue(PULSE_MIN_OPACITY);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(PULSE_MAX_OPACITY, { duration: PULSE_DURATION }),
        withTiming(PULSE_MIN_OPACITY, { duration: PULSE_DURATION })
      ),
      -1, // Infinite repeat
      false // Don't reverse
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.textContent}>
          <Animated.View style={[styles.titleBar, animatedStyle]} />
          {showSubtitle && (
            <Animated.View style={[styles.subtitleBar, animatedStyle]} />
          )}
        </View>
        <Animated.View style={[styles.chevronBar, animatedStyle]} />
      </View>
    </View>
  );
}

interface SkeletonListProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Whether to show subtitles on skeleton cards */
  showSubtitle?: boolean;
}

export function SkeletonList({ count = 3, showSubtitle = true }: SkeletonListProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} showSubtitle={showSubtitle} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: componentStyles.card.borderRadius,
    padding: componentStyles.card.padding,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContent: {
    flex: 1,
  },
  titleBar: {
    height: 18,
    width: '70%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  subtitleBar: {
    height: 14,
    width: '45%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
  },
  chevronBar: {
    height: 20,
    width: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
});
