/**
 * TierBadge - Displays the current subscription tier
 *
 * A subtle badge showing the user's subscription level (Free, Individual, Family)
 * with a soft colored background that matches the app's calm aesthetic.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { SubscriptionTier } from '@/api/types';
import { colors, spacing, typography } from '@/constants/theme';

interface TierBadgeProps {
  tier: SubscriptionTier;
  tierName: string;
}

const TIER_COLORS: Record<SubscriptionTier, { background: string; text: string }> = {
  free: {
    background: colors.surfaceSecondary,
    text: colors.textSecondary,
  },
  individual: {
    background: '#E8F0E6', // Soft sage
    text: colors.primary,
  },
  family: {
    background: '#E6EAF0', // Soft blue
    text: '#5A6A8A',
  },
};

export function TierBadge({ tier, tierName }: TierBadgeProps) {
  const tierColor = TIER_COLORS[tier] ?? TIER_COLORS.free;

  return (
    <View style={[styles.badge, { backgroundColor: tierColor.background }]}>
      <Text style={[styles.text, { color: tierColor.text }]}>{tierName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 12,
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
