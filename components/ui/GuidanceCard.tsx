import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/constants/theme';

interface GuidanceCardProps {
  icon?: keyof typeof Ionicons.glyphMap;
  heading?: string;
  text: string;
}

// Soft tint of primary for background
const PRIMARY_SOFT = '#E8EBE7';
// Darker shade of primary for heading text
const PRIMARY_DARK = '#3F4A3F';

export function GuidanceCard({ icon = 'bulb-outline', heading, text }: GuidanceCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      {heading && <Text style={styles.heading}>{heading}</Text>}
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PRIMARY_SOFT,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
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
    fontWeight: typography.weights.semibold as '600',
    color: PRIMARY_DARK,
    marginBottom: spacing.xs,
    lineHeight: typography.sizes.body * typography.lineHeights.normal,
    textAlign: 'center',
  },
  text: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
    textAlign: 'center',
  },
});
