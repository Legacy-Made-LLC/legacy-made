/**
 * Key Backup Hub - Choose a backup method for your encryption key
 *
 * Presents three options: Legacy Made escrow, downloadable key file, or recovery phrase.
 * The user can configure one or more methods.
 */

import { colors, spacing, typography } from "@/constants/theme";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function KeyBackupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { backupStatus } = useCrypto();

  const options = [
    {
      id: "escrow" as const,
      icon: "cloud-outline" as const,
      title: "Legacy Made Recovery",
      description:
        "We securely store a copy so you can recover your data if you lose your device.",
      isConfigured: backupStatus.escrow,
      route: "/(app)/settings/key-backup-escrow",
    },
    {
      id: "file" as const,
      icon: "document-outline" as const,
      title: "Downloadable Key File",
      description:
        "Save an encrypted file to a safe location. Protected by a PIN you choose.",
      isConfigured: backupStatus.keyFile,
      route: "/(app)/settings/key-backup-file",
    },
    {
      id: "phrase" as const,
      icon: "text-outline" as const,
      title: "Recovery Phrase",
      description:
        "Write down 24 words that can restore your key. No digital storage needed.",
      isConfigured: backupStatus.recoveryPhrase,
      route: "/(app)/settings/key-backup-phrase",
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Back Up Your Key",
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
                name={option.icon}
                size={24}
                color={option.isConfigured ? colors.success : colors.primary}
              />
            </View>
            <View style={styles.optionContent}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                {option.isConfigured && (
                  <View style={styles.configuredBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.success}
                    />
                    <Text style={styles.configuredText}>Done</Text>
                  </View>
                )}
              </View>
              <Text style={styles.optionDescription}>
                {option.description}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textTertiary}
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
    alignItems: "center",
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  optionTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  configuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  configuredText: {
    fontFamily: "DMSans_500Medium",
    fontSize: typography.sizes.caption,
    color: colors.success,
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
