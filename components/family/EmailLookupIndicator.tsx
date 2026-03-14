import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/constants/theme";

interface EmailLookupIndicatorProps {
  isLoading: boolean;
  found: boolean;
  hasLookedUp: boolean;
}

export function EmailLookupIndicator({
  isLoading,
  found,
  hasLookedUp,
}: EmailLookupIndicatorProps) {
  if (!hasLookedUp && !isLoading) return null;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.featureFamily} />
      </View>
    );
  }

  if (found) {
    return (
      <View style={styles.container}>
        <Ionicons
          name="checkmark-circle"
          size={14}
          color={colors.success}
        />
        <Text style={[styles.text, styles.foundText]}>
          Has a Legacy Made account — encryption key will be shared
          automatically
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Will receive an email invitation</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  text: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
  foundText: {
    color: colors.success,
  },
});
