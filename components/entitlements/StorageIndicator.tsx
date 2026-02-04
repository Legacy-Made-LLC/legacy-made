/**
 * StorageIndicator - Shows storage usage against quota
 *
 * Displays storage usage like "450 MB / 500 MB used" with visual indicators.
 * Shows warning colors when approaching or at limit.
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/constants/theme";
import { useEntitlements } from "@/data/EntitlementsProvider";

interface StorageIndicatorProps {
  /** Optional label to display before the storage info */
  label?: string;
  /** Whether to show the progress bar */
  showProgressBar?: boolean;
  /** Whether to use compact styling */
  compact?: boolean;
}

export function StorageIndicator({
  label,
  showProgressBar = false,
  compact = false,
}: StorageIndicatorProps) {
  const {
    getStorageDisplay,
    getStorageUsedMB,
    getStorageLimitMB,
    isStorageFull,
    isStorageUnlimited,
    isApproachingLimit,
  } = useEntitlements();

  const storageDisplay = getStorageDisplay();
  const usedMB = getStorageUsedMB();
  const limitMB = getStorageLimitMB();
  const isFull = isStorageFull();
  const isUnlimited = isStorageUnlimited();
  const isApproaching = isApproachingLimit("storage_mb");

  // Handle no storage (free tier with 0 limit)
  if (limitMB === 0 && !isUnlimited) {
    return (
      <View style={styles.container}>
        {label && (
          <Text style={[styles.label, compact && styles.labelCompact]}>
            {label}
          </Text>
        )}
        <Text style={[styles.noStorageText, compact && styles.textCompact]}>
          Upgrade to upload files
        </Text>
      </View>
    );
  }

  // Handle unlimited storage
  if (isUnlimited) {
    return (
      <View style={styles.container}>
        {label && (
          <Text style={[styles.label, compact && styles.labelCompact]}>
            {label}
          </Text>
        )}
        <Text style={[styles.unlimitedText, compact && styles.textCompact]}>
          {storageDisplay}
        </Text>
      </View>
    );
  }

  const percentage = limitMB > 0 ? (usedMB / limitMB) * 100 : 100;

  const textColor = isFull
    ? colors.error
    : isApproaching
      ? colors.warning
      : colors.textSecondary;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, compact && styles.labelCompact]}>
          {label}
        </Text>
      )}
      <Text
        style={[
          styles.text,
          compact && styles.textCompact,
          { color: textColor },
        ]}
      >
        {storageDisplay}
      </Text>
      {showProgressBar && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: isFull
                  ? colors.error
                  : isApproaching
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
  label: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  labelCompact: {
    fontSize: typography.sizes.caption,
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    textAlign: "center",
  },
  textCompact: {
    fontSize: typography.sizes.caption,
  },
  unlimitedText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  noStorageText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    fontStyle: "italic",
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
});
