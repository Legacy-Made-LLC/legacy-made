/**
 * AnimatedListItem - Wrapper for staggered fade-in animations
 *
 * Wraps list items to provide a gentle fade-in effect with staggered timing.
 * Creates a calm, cascading appearance as items load.
 */

import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

// Animation configuration
const FADE_DURATION = 300;
const STAGGER_DELAY = 60;
const SLIDE_DISTANCE = 8;

interface AnimatedListItemProps {
  children: React.ReactNode;
  /** Index of the item in the list (used for stagger timing) */
  index: number;
  /** Optional custom delay in ms */
  delay?: number;
}

export function AnimatedListItem({ children, index, delay }: AnimatedListItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(SLIDE_DISTANCE);

  const staggerDelay = delay ?? index * STAGGER_DELAY;

  useEffect(() => {
    opacity.value = withDelay(
      staggerDelay,
      withTiming(1, { duration: FADE_DURATION, easing: Easing.out(Easing.ease) })
    );
    translateY.value = withDelay(
      staggerDelay,
      withTiming(0, { duration: FADE_DURATION, easing: Easing.out(Easing.ease) })
    );
  }, [opacity, translateY, staggerDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
