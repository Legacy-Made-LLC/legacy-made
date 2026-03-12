/**
 * Key Backup Hub - Choose a backup method for your encryption key
 *
 * Presents two options: Legacy Made escrow or recovery document.
 * The user can configure one or more methods.
 */

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
      title: "Legacy Made Recovery",
      description:
        "We securely store a copy of your key so you can recover your data if you lose your device.",
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
      title: "Offline Recovery",
      description:
        "Save a recovery key that you keep — print it, store it somewhere safe, and use it to get back in on your own.",
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
      <Stack.Screen options={{ title: "Back Up Your Key" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Text style={styles.intro}>
          Your encryption key keeps your data private. If you lose access to
          your device without a backup, your data cannot be recovered.
        </Text>

        <Text style={styles.sectionLabel}>CHOOSE A METHOD</Text>

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
          We recommend setting up at least one backup method. You can always
          change or add methods later.
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
    gap: spacing.md,
  },
  intro: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.label,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: spacing.sm,
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
