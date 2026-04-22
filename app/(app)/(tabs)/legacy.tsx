/**
 * Legacy Tab - Main legacy messages screen
 *
 * Displays section cards for Messages to People, Your Story, and Future Moments.
 * Uses soft blue color theme (featureLegacy).
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LockedFeatureOverlay, RestrictedAccessOverlay } from "@/components/entitlements";
import { SharedPlanEncryptionGate } from "@/components/family";
import { PillarSectionCard } from "@/components/ui/PillarSectionCard";
import { colors, spacing, typography } from "@/constants/theme";
import { useLegacySections } from "@/constants/legacy";
import { useTranslations } from "@/contexts/LocaleContext";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { usePlan } from "@/data/PlanProvider";
import { useAllProgressQuery } from "@/hooks/queries";

export default function LegacyScreen() {
  const insets = useSafeAreaInsets();
  const { isLockedPillar, isViewOnlyPillar } = useEntitlements();
  const { isViewingSharedPlan, canAccessPillar } = usePlan();
  const legacySections = useLegacySections();
  const { data: progress = {} } = useAllProgressQuery();
  const t = useTranslations();

  const isLocked = isLockedPillar("messages");
  const isViewOnly = isViewOnlyPillar("messages");

  // Show locked overlay if pillar is locked or view-only (plan tier doesn't grant full access)
  if (isLocked || isViewOnly) {
    return (
      <LockedFeatureOverlay
        featureName="Legacy Messages"
        description="Record video messages and memories to share with your loved ones when the time is right."
        isSharedPlan={isViewingSharedPlan}
        placement="pillar_locked_messages"
      />
    );
  }

  // Show restricted access overlay for shared plan users without messages access
  if (isViewingSharedPlan && !canAccessPillar("messages")) {
    return (
      <RestrictedAccessOverlay
        featureName="Legacy Messages"
        description="Your access level doesn't include Legacy Messages for this plan."
        accentColor={colors.featureLegacy}
        tintColor={colors.featureLegacyTint}
      />
    );
  }

  return (
    <SharedPlanEncryptionGate>
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.lg + 80 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Legacy Messages</Text>
        <Text style={styles.description}>
          {t.pages.legacy.description}
        </Text>
      </View>

      <View style={styles.sections}>
        {legacySections.map((section) => (
          <PillarSectionCard
            key={section.id}
            section={section}
            progress={progress}
            pillar="legacy"
          />
        ))}
      </View>

      <Text style={styles.pacingNote}>
        No need to finish everything today.{"\n"}The right words will find you.
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
