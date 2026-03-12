/**
 * Recovery Prompt Screen
 *
 * Full-screen interception when the user needs key recovery.
 * Shown when a returning user signs in on a device without local encryption keys.
 */

import { colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface RecoveryOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}

function RecoveryOption({
  icon,
  title,
  description,
  onPress,
}: RecoveryOptionProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.optionCard,
        pressed && styles.optionCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.optionIcon}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </Pressable>
  );
}

export default function RecoveryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.xxl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="key-outline" size={40} color={colors.primary} />
        </View>
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.body}>
          Your information is protected by a private key that this device
          doesn&apos;t have yet. Choose how you&apos;d like to restore it.
        </Text>
      </View>

      <RecoveryOption
        icon="cloud-outline"
        title="Legacy Made Recovery"
        description="The easiest option — we'll restore your key automatically"
        onPress={() => router.push("/settings/recover-escrow" as never)}
      />

      <RecoveryOption
        icon="document-text-outline"
        title="Recovery Document"
        description="Use the recovery document you saved when you set up your account"
        onPress={() => router.push("/settings/recover-document" as never)}
      />

      <RecoveryOption
        icon="phone-portrait-outline"
        title="Link from Another Device"
        description="If you have another phone or tablet that's already set up"
        onPress={() =>
          router.push("/settings/device-linking?mode=receive" as never)
        }
      />

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
    gap: spacing.lg,
  },
  header: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  heading: {
    fontFamily: "LibreBaskerville_600SemiBold",
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
  },
  body: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    paddingHorizontal: spacing.md,
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
  optionTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
  },
});
