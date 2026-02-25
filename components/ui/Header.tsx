import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing, typography } from "@/constants/theme";
import { usePlanSwitching } from "@/hooks/usePlanSwitching";

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

interface HeaderProps {
  onMenuPress: () => void;
}

export function Header({ onMenuPress }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { isViewingSharedPlan, sharedPlanInfo, switchToMyPlan } =
    usePlanSwitching();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
        isViewingSharedPlan && styles.containerShared,
      ]}
    >
      <View style={styles.content}>
        {/* Left: shared plan indicator or empty spacer */}
        {isViewingSharedPlan && sharedPlanInfo ? (
          <View style={styles.sharedPlanInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(
                  sharedPlanInfo.ownerFirstName,
                  sharedPlanInfo.ownerLastName,
                )}
              </Text>
            </View>
            <Text style={styles.ownerText} numberOfLines={1}>
              {sharedPlanInfo.ownerFirstName}&apos;s Plan
            </Text>
          </View>
        ) : (
          <View style={styles.spacer} />
        )}

        {/* Right: "My Plan" return button (when shared) + hamburger */}
        <View style={styles.rightActions}>
          {isViewingSharedPlan && (
            <Pressable
              onPress={switchToMyPlan}
              style={({ pressed }) => [
                styles.returnButton,
                pressed && styles.returnButtonPressed,
              ]}
              hitSlop={8}
            >
              <Text style={styles.returnButtonText}>My Plan</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onMenuPress}
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.menuButtonPressed,
            ]}
            hitSlop={8}
          >
            <View style={styles.menuIcon}>
              <View
                style={[
                  styles.menuLine,
                  isViewingSharedPlan && styles.menuLineShared,
                ]}
              />
              <View
                style={[
                  styles.menuLine,
                  isViewingSharedPlan && styles.menuLineShared,
                ]}
              />
              <View
                style={[
                  styles.menuLine,
                  isViewingSharedPlan && styles.menuLineShared,
                ]}
              />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  containerShared: {
    backgroundColor: colors.featureFamilyTint,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  spacer: {
    width: 36,
  },
  // Shared plan indicator (left side)
  sharedPlanInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.featureFamily,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    color: colors.surface,
  },
  ownerText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.bodySmall,
    color: colors.featureFamilyDark,
    flex: 1,
  },
  // Right actions
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  returnButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  returnButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  returnButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.bodySmall,
    color: colors.surface,
  },
  menuButton: {
    padding: spacing.xs,
    borderRadius: 8,
  },
  menuButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  menuIcon: {
    width: 20,
    height: 16,
    justifyContent: "space-between",
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: colors.textPrimary,
    borderRadius: 1,
  },
  menuLineShared: {
    backgroundColor: colors.featureFamilyDark,
  },
});
