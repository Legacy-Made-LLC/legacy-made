/**
 * SharedPlanEncryptionGate - Gate for shared plan content
 *
 * Shows a "Waiting for access" message when the shared plan's DEK
 * hasn't been shared yet, a loader while resolving, and renders
 * children when the DEK is available.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useOptionalCrypto } from "@/lib/crypto/CryptoProvider";
import { usePlan } from "@/data/PlanProvider";
import { colors, borderRadius, spacing, typography } from "@/constants/theme";

interface SharedPlanEncryptionGateProps {
  children: ReactNode;
}

export function SharedPlanEncryptionGate({
  children,
}: SharedPlanEncryptionGateProps) {
  const crypto = useOptionalCrypto();
  const { isViewingSharedPlan, sharedPlanInfo, returnToMyPlan } = usePlan();

  // Not viewing a shared plan — render children directly
  if (!isViewingSharedPlan) {
    return <>{children}</>;
  }

  // Loading the shared DEK
  if (crypto?.isActiveDEKLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.featureFamily} />
      </View>
    );
  }

  // DEK not available — show "waiting for access" message
  if (crypto?.sharedPlanDEKUnavailable) {
    const ownerName = sharedPlanInfo
      ? `${sharedPlanInfo.ownerFirstName} ${sharedPlanInfo.ownerLastName}`
      : "The plan owner";

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={40}
              color={colors.featureFamily}
            />
          </View>
          <Text style={styles.title}>Waiting for access</Text>
          <Text style={styles.description}>
            {ownerName}&apos;s plan is encrypted. They need to share their
            encryption key from their device before you can view this plan.
          </Text>
          <Pressable
            onPress={returnToMyPlan}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Return to Your Plan</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // DEK available — render children
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  card: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.featureFamilyTint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.featureFamily,
    borderRadius: borderRadius.pill,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.featureFamily,
  },
});
