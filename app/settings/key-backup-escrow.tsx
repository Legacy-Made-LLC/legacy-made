/**
 * Key Backup - Legacy Made Escrow
 *
 * The user opts in to having Legacy Made store their DEK (encrypted with AWS KMS).
 * Includes clear disclosure about what this means for privacy.
 */

import { colors, spacing, typography } from "@/constants/theme";
import { usePlan } from "@/data/PlanProvider";
import {
  useEnableEscrowMutation,
  useRevokeEscrowMutation,
} from "@/hooks/queries/useKeyBackupMutations";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
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
  const { backupStatus } = useCrypto();
  const { myPlanId: planId } = usePlan();
  const { userId } = useAuth();

  const enableMutation = useEnableEscrowMutation();
  const revokeMutation = useRevokeEscrowMutation();

  const [isRevoked, setIsRevoked] = useState(false);
  const [isComplete, setIsComplete] = useState(backupStatus.escrow.configured);

  const error =
    enableMutation.error?.message ?? revokeMutation.error?.message ?? null;

  const handleEnable = useCallback(async () => {
    if (!planId || !userId) return;

    enableMutation.reset();
    try {
      await enableMutation.mutateAsync({ planId, userId });
      setIsComplete(true);
    } catch {
      // Error is captured by the mutation's onError + derived `error` state
    }
  }, [planId, userId, enableMutation]);

  const handleRevoke = useCallback(async () => {
    if (!planId) return;

    revokeMutation.reset();
    try {
      await revokeMutation.mutateAsync({ planId });
      setIsComplete(false);
      setIsRevoked(true);
    } catch {
      // Error is captured by the mutation's onError + derived `error` state
    }
  }, [planId, revokeMutation]);

  // Derive content for the shared layout based on current state
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const stateConfig = isComplete
    ? {
        bannerIcon: "checkmark-circle" as const,
        bannerIconColor: colors.success,
        bannerTitle: "Legacy Made recovery is turned on",
        bannerDate: backupStatus.escrow.createdAt
          ? `Turned on ${formatDate(backupStatus.escrow.createdAt)}`
          : null,
        prompt: "Changed your mind about Legacy Made storing your key?",
        actionIcon: "close-circle-outline" as const,
        actionIconColor: colors.error,
        actionTitle: "Turn off Legacy Made Recovery",
        actionDescription:
          "Legacy Made will no longer store a copy of your key. You\u2019ll need another recovery method if you lose your device.",
        actionOnPress: handleRevoke,
        actionPending: revokeMutation.isPending,
      }
    : {
        bannerIcon: "close-circle" as const,
        bannerIconColor: colors.textTertiary,
        bannerTitle: isRevoked
          ? "Legacy Made recovery is turned off"
          : "Legacy Made recovery is off",
        bannerDate: backupStatus.escrow.removedAt
          ? `Turned off ${formatDate(backupStatus.escrow.removedAt)}`
          : null,
        prompt: isRevoked
          ? "Legacy Made no longer stores a recovery backup. If you lose access to your device, you\u2019ll need another recovery method to get back in."
          : "Legacy Made can securely store a protected recovery backup.",
        actionIcon: "checkmark-circle-outline" as const,
        actionIconColor: colors.primary,
        actionTitle: "Turn On Recovery",
        actionDescription:
          "Legacy Made stores a protected recovery backup used only if you request help restoring your account.",
        actionOnPress: isRevoked
          ? () => {
              setIsRevoked(false);
              handleEnable();
            }
          : handleEnable,
        actionPending: enableMutation.isPending,
      };

  return (
    <>
      <Stack.Screen options={{ title: "Recovery With Legacy Made" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={styles.statusBanner}>
          <Ionicons
            name={stateConfig.bannerIcon}
            size={22}
            color={stateConfig.bannerIconColor}
          />
          <View style={styles.statusBannerContent}>
            <Text style={styles.statusBannerTitle}>
              {stateConfig.bannerTitle}
            </Text>
            {stateConfig.bannerDate && (
              <Text style={styles.statusBannerDate}>
                {stateConfig.bannerDate}
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.guidedPrompt}>{stateConfig.prompt}</Text>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.optionCard,
            pressed && styles.optionCardPressed,
          ]}
          onPress={stateConfig.actionOnPress}
          disabled={stateConfig.actionPending}
        >
          <View style={styles.optionIcon}>
            {stateConfig.actionPending ? (
              <ActivityIndicator color={stateConfig.actionIconColor} />
            ) : (
              <Ionicons
                name={stateConfig.actionIcon}
                size={22}
                color={stateConfig.actionIconColor}
              />
            )}
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>{stateConfig.actionTitle}</Text>
            <Text style={styles.optionDescription}>
              {stateConfig.actionDescription}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
            style={styles.chevron}
          />
        </Pressable>

        <Text style={styles.disclaimer}>
          Your recovery backup is only used if you request help restoring your
          account. Legacy Made will never access your information without your
          permission.
        </Text>
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
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statusBannerContent: {
    flex: 1,
  },
  statusBannerTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
  },
  statusBannerDate: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  guidedPrompt: {
    fontFamily: "DMSans_500Medium",
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  disclaimer: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flex: 1,
  },
  chevron: {
    marginTop: 2,
    marginLeft: spacing.sm,
  },
  optionTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  optionDescription: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
  },
});
