/**
 * EncryptionBadge - Small pill badge indicating end-to-end encryption
 *
 * Shows lock icon with encryption text to build user trust.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';

interface EncryptionBadgeProps {
  /** Optional override text. Default: "End-to-end encrypted" */
  label?: string;
  /** Visual style variant */
  variant?: 'default' | 'subtle';
}

export function EncryptionBadge({
  label = 'End-to-end encrypted',
  variant = 'default',
}: EncryptionBadgeProps) {
  const isSubtle = variant === 'subtle';

  return (
    <View
      style={[
        styles.badge,
        isSubtle ? styles.badgeSubtle : styles.badgeDefault,
      ]}
    >
      <Ionicons name="lock-closed" size={12} color={colors.textTertiary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  badgeDefault: {
    backgroundColor: colors.surfaceSecondary,
  },
  badgeSubtle: {
    backgroundColor: 'transparent',
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
});
