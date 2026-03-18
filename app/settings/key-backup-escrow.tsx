/**
 * Key Backup - Legacy Made Escrow
 *
 * The user opts in to having Legacy Made store their DEK (encrypted with AWS KMS).
 * Includes clear disclosure about what this means for privacy.
 */

import { keyBackupStyles as shared } from "@/components/settings/keyBackupStyles";
import { colors, spacing, typography } from "@/constants/theme";
import { usePlan } from "@/data/PlanProvider";
import {
  useEnableEscrowMutation,
  useRevokeEscrowMutation,
} from "@/hooks/queries/useKeyBackupMutations";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { useAuth } from "@clerk/expo";
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
        style={shared.container}
        contentContainerStyle={[
          shared.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={shared.statusBanner}>
          <Ionicons
            name={stateConfig.bannerIcon}
            size={22}
            color={stateConfig.bannerIconColor}
          />
          <View style={shared.statusBannerContent}>
            <Text style={shared.statusBannerTitle}>
              {stateConfig.bannerTitle}
            </Text>
            {stateConfig.bannerDate && (
              <Text style={shared.statusBannerDate}>
                {stateConfig.bannerDate}
              </Text>
            )}
          </View>
        </View>

        <Text style={shared.guidedPrompt}>{stateConfig.prompt}</Text>

        {error && (
          <View style={shared.errorCard}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={shared.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            shared.optionCard,
            pressed && shared.optionCardPressed,
          ]}
          onPress={stateConfig.actionOnPress}
          disabled={stateConfig.actionPending}
        >
          <View style={shared.optionIcon}>
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
          <View style={shared.optionContent}>
            <Text style={shared.optionTitle}>{stateConfig.actionTitle}</Text>
            <Text style={shared.optionDescription}>
              {stateConfig.actionDescription}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
            style={shared.chevron}
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
  disclaimer: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
