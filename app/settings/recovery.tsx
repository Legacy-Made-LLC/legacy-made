/**
 * Recovery Prompt Screen
 *
 * Full-screen interception when the user needs key recovery.
 * Shown when a returning user signs in on a device without local encryption keys.
 *
 * If escrow (Legacy Made Recovery) is enabled, recovery is attempted automatically
 * on mount — the user never sees this screen in the happy path. If escrow isn't
 * configured or fails, the manual options (offline document, device linking) are shown.
 */

import { useApi } from "@/api/useApi";
import { colors, spacing, typography } from "@/constants/theme";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { usePlan } from "@/data/PlanProvider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

type AutoRecoveryState =
  | "checking" // Checking if escrow is available
  | "recovering" // Escrow found, attempting auto-recovery
  | "failed" // Escrow recovery failed
  | "manual"; // No escrow — show manual options

export default function RecoveryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recoverFromEscrow, completeRecovery } = useCrypto();
  const { keys } = useApi();
  const { planId } = usePlan();

  const [autoState, setAutoState] = useState<AutoRecoveryState>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasRecoveryDoc, setHasRecoveryDoc] = useState(false);
  const attemptedRef = useRef(false);

  const attemptEscrowRecovery = useCallback(async () => {
    setAutoState("recovering");
    setErrorMessage(null);

    try {
      const success = await recoverFromEscrow();
      if (success) {
        await completeRecovery();
        router.replace("/(app)");
      } else {
        setErrorMessage(
          "We couldn\u2019t restore your key automatically. Please try again or use one of the options below.",
        );
        setAutoState("failed");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during recovery.",
      );
      setAutoState("failed");
    }
  }, [recoverFromEscrow, completeRecovery, router]);

  useEffect(() => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    async function checkAndRecover() {
      try {
        const dekRecords = await keys.listDeks(planId ?? undefined);
        const hasEscrow = dekRecords.some((d) => d.dekType === "escrow");
        const hasRecovery = dekRecords.some((d) => d.dekType === "recovery");
        setHasRecoveryDoc(hasRecovery);

        if (hasEscrow) {
          await attemptEscrowRecovery();
        } else {
          setAutoState("manual");
        }
      } catch {
        // Can't check DEK status — fall through to manual options.
        // Default to showing recovery doc option since we can't confirm either way.
        setHasRecoveryDoc(true);
        setAutoState("manual");
      }
    }

    checkAndRecover();
  }, [keys, planId, attemptEscrowRecovery]);

  // Show loading state while checking/recovering
  if (autoState === "checking" || autoState === "recovering") {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { paddingTop: insets.top + spacing.xxl },
        ]}
      >
        <Image
          source={require("@/assets/images/muted-green-circle-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>Legacy Made</Text>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.spinner}
        />
        <Text style={styles.loadingText}>
          {autoState === "checking"
            ? "Checking your account\u2026"
            : "Restoring your key\u2026"}
        </Text>
      </View>
    );
  }

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
        <Image
          source={require("@/assets/images/muted-green-circle-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>Legacy Made</Text>
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.body}>
          Your information is protected by a private key that this device
          doesn&apos;t have yet. Choose how you&apos;d like to restore it.
        </Text>
      </View>

      {autoState === "failed" && errorMessage && (
        <View style={styles.errorSection}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
          <Pressable
            style={styles.retryButton}
            onPress={() => attemptEscrowRecovery()}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {hasRecoveryDoc && (
        <RecoveryOption
          icon="document-text-outline"
          title="Recover from Offline Document"
          description="Use the recovery document you saved when you set up your account"
          onPress={() => router.push("/settings/recover-document" as never)}
        />
      )}

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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: spacing.xs,
  },
  brandName: {
    fontFamily: "LibreBaskerville_600SemiBold",
    fontSize: typography.sizes.titleLarge,
    color: colors.textPrimary,
    textAlign: "center",
  },
  heading: {
    fontFamily: "LibreBaskerville_600SemiBold",
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  body: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    paddingHorizontal: spacing.md,
  },
  spinner: {
    marginTop: spacing.xl,
  },
  loadingText: {
    fontFamily: "DMSans_400Regular",
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorSection: {
    gap: spacing.sm,
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
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 44,
  },
  retryButtonText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: typography.sizes.body,
    color: "#FFFFFF",
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
