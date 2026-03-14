/**
 * Data Migration Screen - Encrypt Existing Data
 *
 * Shown to existing users after the E2EE update. Fetches all unencrypted
 * entries and wishes, encrypts them client-side, and PATCHes them back.
 * Shows progress with per-item tracking for crash resilience.
 */

import { colors, spacing, typography } from "@/constants/theme";
import { useMigration } from "@/hooks/useMigration";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EncryptDataScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { progress, startMigration } = useMigration();
  const started = useRef(false);

  // Auto-start migration on mount
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      startMigration();
    }
  }, [startMigration]);

  const totalItems = progress.totalEntries + progress.totalWishes + progress.totalMessages;
  const migratedItems = progress.migratedEntries + progress.migratedWishes + progress.migratedMessages;
  const failedItems =
    progress.failedEntries.length + progress.failedWishes.length + progress.failedMessages.length;
  const progressPercent =
    totalItems > 0 ? Math.round((migratedItems / totalItems) * 100) : 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Encrypting Data",
          headerBackTitle: "Back",
          gestureEnabled: progress.isComplete,
          headerLeft: progress.isComplete ? undefined : () => null,
        }}
      />
      <View
        style={[
          styles.container,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {progress.isComplete ? (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons
                name={failedItems > 0 ? "warning" : "checkmark-circle"}
                size={64}
                color={failedItems > 0 ? colors.warning : colors.success}
              />
            </View>
            <Text style={styles.successTitle}>
              {failedItems > 0 ? "Migration partially complete" : "Data encrypted"}
            </Text>
            <Text style={styles.successDescription}>
              {failedItems > 0
                ? `${migratedItems} items encrypted successfully. ${failedItems} items could not be encrypted and will be retried later.`
                : totalItems > 0
                  ? `All ${migratedItems} items have been encrypted. Your data is now protected with end-to-end encryption.`
                  : "All your data is already encrypted. No migration needed."}
            </Text>
            <Pressable
              style={styles.doneButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        ) : progress.error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={64} color={colors.error} />
            </View>
            <Text style={styles.errorTitle}>Migration failed</Text>
            <Text style={styles.errorDescription}>{progress.error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                started.current = false;
                startMigration();
              }}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.progressTitle}>Encrypting your data</Text>
            <Text style={styles.progressDescription}>
              This may take a moment. Please keep the app open.
            </Text>

            {totalItems > 0 && (
              <>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressCount}>
                  {migratedItems} of {totalItems} items ({progressPercent}%)
                </Text>
              </>
            )}
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: spacing.lg,
  },
  progressContainer: {
    alignItems: "center",
    gap: spacing.md,
  },
  progressTitle: {
    fontFamily: "LibreBaskerville_600SemiBold",
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  progressDescription: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressCount: {
    fontFamily: "DMSans_500Medium",
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
  },
  successContainer: {
    alignItems: "center",
    gap: spacing.md,
  },
  successIcon: {
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontFamily: "LibreBaskerville_600SemiBold",
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
  },
  successDescription: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    paddingHorizontal: spacing.lg,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 52,
    paddingHorizontal: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  doneButtonText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.body,
    color: "#FFFFFF",
  },
  errorContainer: {
    alignItems: "center",
    gap: spacing.md,
  },
  errorIcon: {
    marginBottom: spacing.sm,
  },
  errorTitle: {
    fontFamily: "LibreBaskerville_600SemiBold",
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
  },
  errorDescription: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 52,
    paddingHorizontal: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  retryButtonText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.body,
    color: "#FFFFFF",
  },
});
