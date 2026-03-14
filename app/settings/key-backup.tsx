/**
 * Key Backup Hub - Choose a backup method for your encryption key
 *
 * Presents two options: Legacy Made escrow or recovery document.
 * The user can configure one or more methods.
 */

import { EncryptionBadge } from "@/components/ui/EncryptionBadge";
import { colors, spacing, typography } from "@/constants/theme";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function KeyBackupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { backupStatus } = useCrypto();

  const options = [
    {
      id: "escrow" as const,
      icon: "cloud" as const,
      title: backupStatus.escrow.configured
        ? "Legacy Made Recovery is on"
        : "Let Legacy Made handle recovery for me",
      description: backupStatus.escrow.configured
        ? "Legacy Made is safeguarding a backup so we can help restore access if you lose your device."
        : "Legacy Made safeguards a backup of your key so we can help restore access if you lose your device.",
      isConfigured: backupStatus.escrow.configured,
      createdAt: backupStatus.escrow.createdAt,
      removedAt: backupStatus.escrow.removedAt,
      route: "/settings/key-backup-escrow",
      configuredText: "Turned on",
      removedText: "Turned off",
    },
    {
      id: "phrase" as const,
      icon: "cloud-offline" as const,
      title: backupStatus.recoveryPhrase.configured
        ? "Recovery document is set up"
        : "I want to handle recovery myself",
      description: backupStatus.recoveryPhrase.configured
        ? "Your recovery document is saved. Only you can restore access to your account."
        : "Create a recovery document that you keep somewhere safe. Only you can restore access to your account.",
      isConfigured: backupStatus.recoveryPhrase.configured,
      createdAt: backupStatus.recoveryPhrase.createdAt,
      removedAt: backupStatus.recoveryPhrase.removedAt,
      route: "/settings/key-backup-offline-document",
      configuredText: "Set up",
      removedText: "Removed",
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: "Choose Recovery Method" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            If you ever lose your phone, you&apos;ll need a recovery method to
            restore access to your account.
          </Text>
        </View>

        {options.map((option) => (
          <Pressable
            key={option.id}
            style={({ pressed }) => [
              styles.optionCard,
              pressed && styles.optionCardPressed,
            ]}
            onPress={() => router.push(option.route as never)}
            accessibilityRole="button"
            accessibilityLabel={option.title}
          >
            <View style={styles.optionIcon}>
              <Ionicons
                name={
                  option.isConfigured ? option.icon : `${option.icon}-outline`
                }
                size={22}
                color={option.isConfigured ? colors.success : colors.primary}
              />
            </View>
            <View style={styles.optionContent}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
              </View>
              {option.isConfigured && (
                <View style={styles.statusContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.success}
                  />
                  <Text style={styles.configuredText}>
                    {option.configuredText}
                    {option.createdAt
                      ? ` ${new Date(option.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                      : ""}
                  </Text>
                </View>
              )}
              {!option.isConfigured && option.removedAt && (
                <View style={styles.statusContainer}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.textTertiary}
                  />
                  <Text style={styles.removedText}>
                    {option.removedText}{" "}
                    {new Date(option.removedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              )}
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textTertiary}
              style={styles.chevron}
            />
          </Pressable>
        ))}

        <Text style={styles.footer}>
          You can always change or add recovery methods later.
        </Text>

        <EncryptionBadge />
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
    gap: spacing.md,
  },
  infoCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: `${colors.primary}08`,
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
  optionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
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
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    marginBottom: spacing.sm,
  },
  optionTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  chevron: {
    marginTop: 2,
    marginLeft: spacing.sm,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  configuredText: {
    fontFamily: "DMSans_500Medium",
    fontSize: typography.sizes.caption,
    color: colors.success,
  },
  removedText: {
    fontFamily: "DMSans_500Medium",
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
  optionDescription: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
  },
  footer: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
