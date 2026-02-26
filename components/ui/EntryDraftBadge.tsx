/**
 * EntryDraftBadge - Small pill badge indicating an entry is a draft
 *
 * Shows pencil icon with "Draft" text for entries saved as drafts.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';

export function EntryDraftBadge() {
  return (
    <View style={styles.badge}>
      <Ionicons name="pencil-outline" size={12} color={colors.textTertiary} />
      <Text style={styles.text}>Draft</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
