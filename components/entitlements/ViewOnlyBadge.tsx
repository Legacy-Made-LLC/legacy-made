/**
 * ViewOnlyBadge - Small badge indicating view-only access
 *
 * Shows eye icon with "View Only" text for pillars with restricted editing.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';

export function ViewOnlyBadge() {
  return (
    <View style={styles.badge}>
      <Ionicons name="eye-outline" size={14} color={colors.textTertiary} />
      <Text style={styles.text}>View Only</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
});
