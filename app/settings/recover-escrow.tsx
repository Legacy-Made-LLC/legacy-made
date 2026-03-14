/**
 * Escrow Recovery Screen
 *
 * Restores encryption keys from Legacy Made's server-side escrow backup.
 * The server decrypts the DEK via AWS KMS and returns it over TLS.
 */

import { colors, spacing, typography } from "@/constants/theme";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RecoverEscrowScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recoverFromEscrow, completeRecovery } = useCrypto();

  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleRecover = useCallback(async () => {
    setIsRecovering(true);
    setError(null);

    try {
      const success = await recoverFromEscrow();
      if (success) {
        await completeRecovery();
        setIsComplete(true);
      } else {
        setError(
          "We couldn\u2019t find a saved key for your account. You may not have turned on Legacy Made Recovery, or it may not be available yet.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during recovery.",
      );
    } finally {
      setIsRecovering(false);
    }
  }, [recoverFromEscrow, completeRecovery]);

  return (
    <>
      <Stack.Screen options={{ title: "Recover from Backup" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {isComplete ? (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons
                name="checkmark-circle"
                size={64}
                color={colors.success}
              />
            </View>
            <Text style={styles.successTitle}>You&apos;re all set</Text>
            <Text style={styles.successDescription}>
              Your key has been restored. All of your information is unlocked
              and ready on this device.
            </Text>
            <Pressable
              style={styles.doneButton}
              onPress={() => router.replace("/(app)")}
            >
              <Text style={styles.doneButtonText}>Continue</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.heading}>Restore your access</Text>
            <Text style={styles.body}>
              Legacy Made stored a protected recovery backup for your account.
              We can use it to restore access on this device.
            </Text>

            <View style={styles.infoCard}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>
                Your recovery backup is only used if you request help restoring
                your account. Legacy Made will never access your information
                without your permission.
              </Text>
            </View>

            {error && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={[
                styles.recoverButton,
                isRecovering && styles.recoverButtonDisabled,
              ]}
              onPress={handleRecover}
              disabled={isRecovering}
            >
              {isRecovering ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.recoverButtonText}>Restore Access</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heading: {
    fontFamily: "LibreBaskerville_600SemiBold",
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  infoCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
  },
  errorCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: `${colors.error}10`,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
  },
  errorText: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.bodySmall,
    color: colors.error,
  },
  recoverButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  recoverButtonDisabled: {
    opacity: 0.7,
  },
  recoverButtonText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.body,
    color: "#FFFFFF",
  },
  successContainer: {
    alignItems: "center",
    paddingTop: spacing.xxl,
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
});
