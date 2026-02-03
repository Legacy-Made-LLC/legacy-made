/**
 * ExpandableGuidanceCard - Collapsible guidance card with tips
 *
 * Collapsed: Simple row with icon + question + chevron (no background)
 * Expanded: Card that fades in and expands over the question with X to close
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { PacingNote } from './PacingNote';

// Animation configuration
const ANIMATION_DURATION = 250;
const EASING = Easing.out(Easing.ease);

// Heights
const COLLAPSED_HEIGHT = 44;

// Soft tint of primary for expanded card background
const PRIMARY_SOFT = '#E8EBE7';
// Darker shade of primary for heading text
const PRIMARY_DARK = '#3F4A3F';

interface ExpandableGuidanceCardProps {
  /** Ionicons name for the section icon */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Question text shown when collapsed */
  triggerText: string;
  /** Bold heading text when expanded (answers the question) */
  heading?: string;
  /** Muted description text when expanded */
  detail: string;
  /** Array of tip strings for "What else should I know?" section */
  tips?: string[];
  /** Custom pacing note (defaults to standard message if not provided) */
  pacingNote?: string;
  /** Whether the card starts expanded */
  initialExpanded?: boolean;
}

export function ExpandableGuidanceCard({
  icon = 'bulb-outline',
  triggerText,
  heading,
  detail,
  tips,
  pacingNote,
  initialExpanded = false,
}: ExpandableGuidanceCardProps) {
  const [isTipsExpanded, setIsTipsExpanded] = useState(false);
  const [expandedHeight, setExpandedHeight] = useState(300); // Initial estimate
  const [tipsHeight, setTipsHeight] = useState(0);

  // Animation values
  const expandProgress = useSharedValue(initialExpanded ? 1 : 0);
  const tipsExpandProgress = useSharedValue(0);
  const tipsArrowRotation = useSharedValue(0);

  const handleExpand = useCallback(() => {
    expandProgress.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: EASING,
    });
  }, [expandProgress]);

  const handleCollapse = useCallback(() => {
    expandProgress.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: EASING,
    });
    // Close tips when collapsing
    if (isTipsExpanded) {
      setIsTipsExpanded(false);
      tipsExpandProgress.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: EASING,
      });
      tipsArrowRotation.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: EASING,
      });
    }
  }, [isTipsExpanded, expandProgress, tipsExpandProgress, tipsArrowRotation]);

  const handleTipsToggle = useCallback(() => {
    const newTipsExpanded = !isTipsExpanded;
    setIsTipsExpanded(newTipsExpanded);
    tipsExpandProgress.value = withTiming(newTipsExpanded ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: EASING,
    });
    tipsArrowRotation.value = withTiming(newTipsExpanded ? 90 : 0, {
      duration: ANIMATION_DURATION,
      easing: EASING,
    });
  }, [isTipsExpanded, tipsExpandProgress, tipsArrowRotation]);

  const onExpandedLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0 && height !== expandedHeight) {
      setExpandedHeight(height);
    }
  }, [expandedHeight]);

  const onTipsLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0) {
      setTipsHeight(height);
    }
  }, []);

  // Animated styles
  const wrapperStyle = useAnimatedStyle(() => ({
    height: interpolate(
      expandProgress.value,
      [0, 1],
      [COLLAPSED_HEIGHT, expandedHeight],
      Extrapolation.CLAMP
    ),
  }));

  const collapsedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0, 0.5], [1, 0], Extrapolation.CLAMP),
  }));

  const expandedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0.3, 0.8], [0, 1], Extrapolation.CLAMP),
  }));

  const tipsArrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tipsArrowRotation.value}deg` }],
  }));

  const tipsContainerStyle = useAnimatedStyle(() => ({
    height: interpolate(tipsExpandProgress.value, [0, 1], [0, tipsHeight], Extrapolation.CLAMP),
    opacity: tipsExpandProgress.value,
    overflow: 'hidden' as const,
  }));

  const hasTips = tips && tips.length > 0;

  return (
    <Animated.View style={[styles.wrapper, wrapperStyle]}>
      {/* Collapsed state - question row */}
      <Animated.View style={[styles.collapsedContainer, collapsedStyle]}>
        <Pressable
          onPress={handleExpand}
          style={styles.collapsedRow}
          accessibilityRole="button"
          accessibilityState={{ expanded: false }}
          accessibilityLabel={triggerText}
        >
          <Ionicons name={icon} size={18} color={colors.primary} />
          <Text style={styles.questionText}>{triggerText}</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.primary}
          />
        </Pressable>
      </Animated.View>

      {/* Expanded state - card overlaid on top */}
      <Animated.View style={[styles.expandedContainer, expandedStyle]}>
        <View onLayout={onExpandedLayout} style={styles.expandedCard}>
          {/* Close button in top right */}
          <Pressable
            onPress={handleCollapse}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close guidance"
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="close" size={20} color={colors.textTertiary} />
          </Pressable>

          {/* Centered icon with circle */}
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={24} color={colors.primary} />
          </View>

          {/* Heading */}
          {heading && <Text style={styles.heading}>{heading}</Text>}

          {/* Detail text */}
          <Text style={styles.detail}>{detail}</Text>

          {/* Tips section */}
          {hasTips && (
            <View style={styles.tipsSection}>
              <Pressable
                onPress={handleTipsToggle}
                style={styles.tipsTrigger}
                accessibilityRole="button"
                accessibilityState={{ expanded: isTipsExpanded }}
                accessibilityLabel="What else should I know?"
              >
                <Text style={styles.tipsTriggerText}>
                  What else should I know?
                </Text>
                <Animated.View style={tipsArrowStyle}>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={colors.textTertiary}
                  />
                </Animated.View>
              </Pressable>

              {/* Tips content */}
              <Animated.View style={tipsContainerStyle}>
                <View onLayout={onTipsLayout} style={styles.tipsContent}>
                  {tips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <Text style={styles.tipBullet}>{'\u2022'}</Text>
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            </View>
          )}

          {/* Pacing note */}
          <PacingNote text={pacingNote} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  // Collapsed state styles
  collapsedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: COLLAPSED_HEIGHT,
  },
  questionText: {
    flex: 1,
    fontSize: typography.sizes.bodySmall,
    color: colors.primary,
    fontFamily: typography.fontFamily.medium,
  },
  // Expanded state styles
  expandedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  expandedCard: {
    backgroundColor: PRIMARY_SOFT,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: PRIMARY_DARK,
    marginBottom: spacing.sm,
    lineHeight: typography.sizes.body * typography.lineHeights.normal,
    textAlign: 'center',
  },
  detail: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
    textAlign: 'center',
  },
  // Tips section styles
  tipsSection: {
    marginTop: spacing.md,
    width: '100%',
  },
  tipsTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
  },
  tipsTriggerText: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  tipsContent: {
    paddingTop: spacing.md,
    width: '100%',
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  tipBullet: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    marginRight: spacing.sm,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
  },
  tipText: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
    flex: 1,
  },
});
