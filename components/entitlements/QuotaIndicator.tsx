/**
 * QuotaIndicator - Shows usage against quota limits
 *
 * Displays "4 of 5 items" style text, with optional progress bar.
 * Uses amber color when approaching the limit (80%+).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { QuotaInfo } from '@/api/types';
import { colors, spacing, typography } from '@/constants/theme';

interface QuotaIndicatorProps {
  quota: QuotaInfo;
  label?: string;
  showProgressBar?: boolean;
}

export function QuotaIndicator({
  quota,
  label,
  showProgressBar = false,
}: QuotaIndicatorProps) {
  // Use displayName from quota if no label provided
  const displayLabel = label ?? quota.displayName ?? 'items';

  // Handle unlimited quota
  if (quota.unlimited) {
    return (
      <View style={styles.container}>
        <Text style={styles.unlimitedText}>{quota.current} {displayLabel}</Text>
      </View>
    );
  }

  const percentage = quota.limit > 0 ? (quota.current / quota.limit) * 100 : 100;
  const isApproachingLimit = percentage >= 80;
  const isAtLimit = quota.current >= quota.limit;

  const textColor = isAtLimit
    ? colors.error
    : isApproachingLimit
    ? colors.warning
    : colors.textSecondary;

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: textColor }]}>
        {quota.current} of {quota.limit} {displayLabel}
      </Text>
      {showProgressBar && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: isAtLimit
                  ? colors.error
                  : isApproachingLimit
                  ? colors.warning
                  : colors.primary,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  text: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
  },
  unlimitedText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
