/**
 * LockedFeatureOverlay - Full-screen overlay for locked features
 *
 * Shows a calm, non-intrusive message about the locked feature
 * with a soft visual treatment and upgrade option.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { UpgradePrompt } from './UpgradePrompt';

interface LockedFeatureOverlayProps {
  featureName: string;
  description?: string;
  /** When true, shows "not available" messaging instead of an upgrade prompt */
  isSharedPlan?: boolean;
  /** RC Targeting placement passed through to the paywall route. */
  placement?: string;
}

export function LockedFeatureOverlay({
  featureName,
  description,
  isSharedPlan = false,
  placement,
}: LockedFeatureOverlayProps) {
  const insets = useSafeAreaInsets();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const defaultDescription = isSharedPlan
    ? 'This feature is not included in this plan.'
    : 'This feature is available with an upgraded plan.';

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.content}>
        {/* Soft lock icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.textTertiary} />
        </View>

        {/* Feature name */}
        <Text style={styles.title}>{featureName}</Text>

        {/* Description */}
        <Text style={styles.description}>
          {description ?? defaultDescription}
        </Text>

        {/* Learn more button — only on own plan */}
        {!isSharedPlan && (
          <Pressable
            onPress={() => setShowUpgrade(true)}
            style={({ pressed }) => [
              styles.learnMoreButton,
              pressed && styles.learnMoreButtonPressed,
            ]}
          >
            <Text style={styles.learnMoreText}>Learn More</Text>
          </Pressable>
        )}
      </View>

      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title={`Unlock ${featureName}`}
        message={`Upgrade your plan to access ${featureName} and other premium features.`}
        placement={placement}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  learnMoreButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  learnMoreButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  learnMoreText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    color: colors.primary,
  },
});
