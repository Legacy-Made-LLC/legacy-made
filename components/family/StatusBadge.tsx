/**
 * StatusBadge - Colored status indicator for trusted contact status
 */

import type { TrustedContactStatus } from "@/api/types";
import { colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const STATUS_CONFIG: Record<
  TrustedContactStatus,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: {
    label: "Pending",
    color: colors.warning,
    icon: "time-outline",
  },
  accepted: {
    label: "Accepted",
    color: colors.success,
    icon: "checkmark-circle-outline",
  },
  declined: {
    label: "Declined",
    color: colors.textTertiary,
    icon: "close-circle-outline",
  },
  revoked_by_owner: {
    label: "Revoked",
    color: colors.error,
    icon: "remove-circle-outline",
  },
  revoked_by_contact: {
    label: "Removed",
    color: colors.textTertiary,
    icon: "remove-circle-outline",
  },
};

interface StatusBadgeProps {
  status: TrustedContactStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={styles.container}>
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
  },
});
