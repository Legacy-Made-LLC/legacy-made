/**
 * Key Backup - Legacy Made Escrow
 *
 * The user opts in to having Legacy Made store their DEK (encrypted with AWS KMS).
 * Includes clear disclosure about what this means for privacy.
 */

import { useApi } from "@/api";
import { colors, spacing, typography } from "@/constants/theme";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { exportDEK, getDEK } from "@/lib/crypto/keys";
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

export default function KeyBackupEscrowScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { backupStatus } = useCrypto();
  const { keys } = useApi();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(backupStatus.escrow);

  const handleEnable = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const dek = await getDEK();
      if (!dek) {
        throw new Error("No encryption key found");
      }

      const dekB64 = await exportDEK(dek);

      // Send DEK to server over TLS — server encrypts with KMS
      await keys.upload({
        publicKey: "", // Not needed for escrow
        wrappedDEK: dekB64,
        keyId: "escrow",
      });

      setIsComplete(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to enable recovery",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [keys]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Legacy Made Recovery",
          headerBackTitle: "Back",
        }}
      />
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
            <Text style={styles.successTitle}>Recovery enabled</Text>
            <Text style={styles.successDescription}>
              If you lose your device, you can recover your data by signing in
              to your Legacy Made account on a new device.
            </Text>
            <Pressable
              style={styles.doneButton}
              onPress={() => router.back()}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.heading}>How it works</Text>
            <Text style={styles.body}>
              Legacy Made will store a secure copy of your encryption key,
              protected by AWS encryption (KMS). If you lose your device, you
              can recover your data by signing in to your account.
            </Text>

            <View style={styles.disclosureCard}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.warning}
              />
              <Text style={styles.disclosureText}>
                <Text style={styles.disclosureBold}>Privacy note: </Text>
                Opting into recovery gives Legacy Made the technical ability to
                decrypt your data. We will never access your information without
                your explicit consent, but this is an important trade-off to
                understand.
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
                styles.enableButton,
                isSubmitting && styles.enableButtonDisabled,
              ]}
              onPress={handleEnable}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.enableButtonText}>
                  Enable Legacy Made Recovery
                </Text>
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
  disclosureCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: `${colors.warning}10`,
    borderRadius: 12,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  disclosureText: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
  },
  disclosureBold: {
    fontFamily: "DMSans_600SemiBold",
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
  enableButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  enableButtonDisabled: {
    opacity: 0.7,
  },
  enableButtonText: {
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
