/**
 * Wishes Tab - Main wishes & guidance screen
 *
 * Displays section cards for Care Preferences, End-of-Life, and Values.
 * Uses lavender color theme (featureWishes).
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LockedFeatureOverlay, RestrictedAccessOverlay } from "@/components/entitlements";
import { SharedPlanEncryptionGate } from "@/components/family";
import { PillarSectionCard } from "@/components/ui/PillarSectionCard";
import { colors, spacing, typography } from "@/constants/theme";
import { useWishesSections } from "@/constants/wishes";
import { useTranslations } from "@/contexts/LocaleContext";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { usePlan } from "@/data/PlanProvider";
import { useAllProgressQuery } from "@/hooks/queries";

export default function WishesScreen() {
  const insets = useSafeAreaInsets();
  const { isLockedPillar, isViewOnlyPillar } = useEntitlements();
  const { isViewingSharedPlan, canAccessPillar } = usePlan();
  const wishesSections = useWishesSections();
  const { data: progress = {} } = useAllProgressQuery();
  const t = useTranslations();

  const isLocked = isLockedPillar("wishes");
  const isViewOnly = isViewOnlyPillar("wishes");

  // Show locked overlay if pillar is locked or view-only (plan tier doesn't grant full access)
  if (isLocked || isViewOnly) {
    return (
      <LockedFeatureOverlay
        featureName="Wishes & Guidance"
        description="Share your personal wishes, values, and guidance for your loved ones."
        isSharedPlan={isViewingSharedPlan}
      />
    );
  }

  // Show restricted access overlay for shared plan users without wishes access
  if (isViewingSharedPlan && !canAccessPillar("wishes")) {
    return (
      <RestrictedAccessOverlay
        featureName="Wishes & Guidance"
        description="Your access level doesn't include Wishes & Guidance for this plan."
        accentColor={colors.featureWishes}
        tintColor={colors.featureWishesTint}
      />
    );
  }

  return (
    <SharedPlanEncryptionGate>
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.lg + 80 }, // Extra padding for tab bar
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Wishes & Guidance</Text>
        <Text style={styles.description}>
          {t.pages.wishes.description}
        </Text>
      </View>

      <View style={styles.sections}>
        {wishesSections.map((section) => (
          <PillarSectionCard
            key={section.id}
            section={section}
            progress={progress}
            pillar="wishes"
          />
        ))}
      </View>

      <Text style={styles.pacingNote}>
        No need to finish everything today.{"\n"}Your thoughts will come when they{"\u2019"}re ready.
      </Text>
    </ScrollView>
    </SharedPlanEncryptionGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  pageTitle: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  description: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.normal,
  },
  sections: {
    gap: spacing.xs,
  },
  pacingNote: {
    fontFamily: typography.fontFamily.regular,
    fontStyle: "italic",
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.xl,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
  },
});
