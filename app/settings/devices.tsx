/**
 * Device Management Screen
 *
 * Lists all registered devices (active + deactivated).
 * Allows users to report a device as lost (deactivate its key).
 */

import { useApi } from "@/api";
import type { UserKeyRecord } from "@/api/keys";
import { colors, spacing, typography } from "@/constants/theme";
import { getKeyVersion } from "@/lib/crypto/keys";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DevicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { keys } = useApi();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all keys including inactive
  const {
    data: deviceKeys,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.crypto.deviceKeys(userId!),
    queryFn: () => keys.getMyKeys(true),
    enabled: !!userId,
  });

  // Fetch local keyVersion to identify current device
  const { data: localKeyVersion } = useQuery({
    queryKey: queryKeys.crypto.keyVersion(userId!),
    queryFn: () => getKeyVersion(userId!),
    enabled: !!userId,
    staleTime: Infinity,
  });

  const deactivateMutation = useMutation({
    mutationFn: (keyVersion: number) => keys.deactivateKey(keyVersion),
    onSuccess: () => {
      // Refresh device list and server keys cache
      refetch();
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.crypto.serverKeys(userId),
        });
      }
    },
    onError: (error) => {
      logger.error("Failed to deactivate key", error);
      Alert.alert("Error", "Could not deactivate this device. Please try again.");
    },
  });

  const handleDeactivate = (device: UserKeyRecord) => {
    Alert.alert(
      "Report Device Lost",
      "This will permanently deactivate the encryption key for this device. " +
        "If someone has shared plans with you, those shares may need to be " +
        "re-established. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: () => deactivateMutation.mutate(device.keyVersion),
        },
      ],
    );
  };

  // Sort: active first, then by createdAt descending
  const sortedDevices = [...(deviceKeys ?? [])].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " at " + date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.description}>
        These are the devices linked to your account. Each device has its own
        encryption key.
      </Text>

      <Pressable
        onPress={() => router.push("/settings/device-linking" as never)}
        style={({ pressed }) => [
          styles.linkDeviceButton,
          pressed && styles.linkDeviceButtonPressed,
        ]}
      >
        <Ionicons name="link-outline" size={20} color={colors.primary} />
        <Text style={styles.linkDeviceText}>Link a New Device</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </Pressable>

      {sortedDevices.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons
            name="phone-portrait-outline"
            size={40}
            color={colors.textTertiary}
          />
          <Text style={styles.emptyText}>No devices registered</Text>
        </View>
      )}

      {sortedDevices.map((device) => {
        const isCurrentDevice = device.keyVersion === localKeyVersion;
        const isActive = device.isActive;
        const isRecoveryKey = device.keyType === "recovery";

        return (
          <View
            key={device.id}
            style={[
              styles.deviceCard,
              !isActive && styles.deviceCardInactive,
              isCurrentDevice && styles.deviceCardCurrent,
            ]}
          >
            <View style={styles.deviceIcon}>
              <Ionicons
                name={isRecoveryKey ? "key-outline" : "phone-portrait-outline"}
                size={24}
                color={isActive ? colors.textPrimary : colors.textTertiary}
              />
            </View>
            <View style={styles.deviceInfo}>
              <Text
                style={[
                  styles.deviceLabel,
                  !isActive && styles.deviceLabelInactive,
                ]}
                numberOfLines={1}
              >
                {device.deviceLabel || `Device ${device.keyVersion}`}
              </Text>
              <View style={styles.deviceMeta}>
                {isCurrentDevice && (
                  <Text style={styles.currentBadge}>This device</Text>
                )}
                {isRecoveryKey && (
                  <Text style={styles.recoveryBadge}>Recovery key</Text>
                )}
                {isActive ? (
                  <Text style={styles.activeBadge}>Active</Text>
                ) : (
                  <Text style={styles.deactivatedBadge}>Deactivated</Text>
                )}
              </View>
              <Text style={styles.deviceDate}>
                {isActive
                  ? `Registered ${formatDate(device.createdAt)}`
                  : `Deactivated ${device.deactivatedAt ? formatDate(device.deactivatedAt) : formatDate(device.updatedAt)}`}
              </Text>
            </View>
            {isActive && !isCurrentDevice && (
              <Pressable
                onPress={() => handleDeactivate(device)}
                disabled={deactivateMutation.isPending}
                style={({ pressed }) => [
                  styles.reportLostButton,
                  pressed && styles.reportLostButtonPressed,
                ]}
              >
                <Text style={styles.reportLostText}>
                  {deactivateMutation.isPending ? "..." : "Report Lost"}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}

      <View style={styles.infoCard}>
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={colors.textSecondary}
        />
        <Text style={styles.infoText}>
          Reporting a device as lost will deactivate its encryption key and
          remove any shared encryption access tied to that device. Your other
          devices are not affected.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textTertiary,
  },
  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceCardInactive: {
    opacity: 0.6,
    backgroundColor: colors.surfaceSecondary,
  },
  deviceCardCurrent: {
    borderColor: colors.primary,
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  deviceLabelInactive: {
    color: colors.textSecondary,
  },
  deviceMeta: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 2,
  },
  currentBadge: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.primary,
  },
  recoveryBadge: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.warning,
  },
  activeBadge: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.success,
  },
  deactivatedBadge: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
  deviceDate: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  reportLostButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 20,
  },
  reportLostButtonPressed: {
    opacity: 0.7,
  },
  reportLostText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.error,
  },
  linkDeviceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  linkDeviceButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  linkDeviceText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    color: colors.primary,
  },
  infoCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
  },
});
