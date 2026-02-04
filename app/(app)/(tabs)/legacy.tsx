import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LockedFeatureOverlay, ViewOnlyBadge } from "@/components/entitlements";
import { colors, spacing, typography } from "@/constants/theme";
import { useEntitlements } from "@/data/EntitlementsProvider";

export default function LegacyScreen() {
  const insets = useSafeAreaInsets();
  const { isLockedPillar, isViewOnlyPillar } = useEntitlements();

  const isLocked = isLockedPillar("messages");
  const isViewOnly = isViewOnlyPillar("messages");

  // Show locked overlay if pillar is locked
  if (isLocked) {
    return (
      <LockedFeatureOverlay
        featureName="Legacy Messages"
        description="Record video messages and memories to share with your loved ones when the time is right."
      />
    );
  }

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}
    >
      {isViewOnly && (
        <View style={styles.viewOnlyHeader}>
          <ViewOnlyBadge />
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="videocam-outline"
            size={40}
            color={colors.textTertiary}
          />
        </View>
        <Text style={styles.title}>Legacy Messages</Text>
        <Text style={styles.subtitle}>
          Record video messages and memories to share with your loved ones when
          the time is right.
        </Text>
        <Text style={styles.comingSoon}>Coming Soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.lg,
  },
  viewOnlyHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.lg,
  },
  comingSoon: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
