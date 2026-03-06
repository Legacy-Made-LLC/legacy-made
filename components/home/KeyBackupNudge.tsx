/**
 * KeyBackupNudge - Home screen card encouraging key backup
 *
 * Shown after the user has created meaningful data. Dismissible but persistent
 * until the user configures at least one backup method.
 */

import { colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface KeyBackupNudgeProps {
  onDismiss: () => void;
}

export function KeyBackupNudge({ onDismiss }: KeyBackupNudgeProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
        </View>
        <Pressable
          onPress={onDismiss}
          hitSlop={12}
          style={styles.dismissButton}
          accessibilityLabel="Dismiss backup reminder"
        >
          <Ionicons name="close" size={18} color={colors.textTertiary} />
        </Pressable>
      </View>

      <Text style={styles.title}>Protect your data</Text>
      <Text style={styles.description}>
        If you ever switch devices, you&apos;ll need your encryption key to access
        your information. Take a moment to back it up.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/(app)/settings/key-backup" as never)}
        accessibilityRole="button"
        accessibilityLabel="Back up encryption key"
      >
        <Text style={styles.buttonText}>Back up key</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissButton: {
    padding: spacing.xs,
  },
  title: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  buttonText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.bodySmall,
    color: colors.primary,
  },
});
