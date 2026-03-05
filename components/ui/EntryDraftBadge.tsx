/**
 * EntryDraftBadge - Small pill badge indicating an entry is a draft
 *
 * Shows pencil icon with "Draft" text for entries saved as drafts.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';

interface EntryDraftBadgeProps {
  /** Accent color for the icon and text. Defaults to textTertiary (gray). */
  color?: string;
  /** Background color for the pill. Defaults to surfaceSecondary (gray). */
  backgroundColor?: string;
}

export function EntryDraftBadge({ color, backgroundColor }: EntryDraftBadgeProps = {}) {
  const badgeColor = color ?? colors.textTertiary;
  const badgeBg = backgroundColor ?? colors.surfaceSecondary;

  return (
    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
      <Ionicons name="pencil-outline" size={12} color={badgeColor} />
      <Text style={[styles.text, { color: badgeColor }]}>Draft</Text>
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
    borderRadius: 8,
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
  },
});
