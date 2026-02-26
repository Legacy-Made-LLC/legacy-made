/**
 * RestrictedAccessOverlay - Shown when a shared plan access level
 * doesn't include a particular pillar (e.g., limited_view can't see Info Vault).
 *
 * Unlike LockedFeatureOverlay, there's no upgrade path — the restriction
 * is set by the plan owner's sharing settings. Includes a "View My Plan"
 * button so the user can easily switch back to their own plan.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  borderRadius,
  colors,
  componentStyles,
  spacing,
  typography,
} from "@/constants/theme";
import { usePlanSwitching } from "@/hooks/usePlanSwitching";

interface RestrictedAccessOverlayProps {
  featureName: string;
  description?: string;
  /** Pillar accent color for the icon and button (defaults to colors.textTertiary / colors.primary) */
  accentColor?: string;
  /** Pillar tint color for the icon background (defaults to colors.surfaceSecondary) */
  tintColor?: string;
}

export function RestrictedAccessOverlay({
  featureName,
  description,
  accentColor,
  tintColor,
}: RestrictedAccessOverlayProps) {
  const insets = useSafeAreaInsets();
  const { switchToMyPlan } = usePlanSwitching();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, tintColor != null && { backgroundColor: tintColor }]}>
          <Ionicons
            name="eye-off-outline"
            size={40}
            color={accentColor ?? colors.textTertiary}
          />
        </View>

        <Text style={styles.title}>{featureName}</Text>

        <Text style={styles.description}>
          {description ??
            "Your access level for this plan doesn't include this section."}
        </Text>

        <Pressable
          onPress={switchToMyPlan}
          style={({ pressed }) => [
            styles.button,
            accentColor != null && { backgroundColor: accentColor },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>View My Plan</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    maxWidth: 280,
  },
  button: {
    marginTop: spacing.xl,
    height: componentStyles.button.height,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    minWidth: 200,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  buttonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
});
