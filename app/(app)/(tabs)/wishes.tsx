/**
 * Wishes Tab - Main wishes & guidance screen
 *
 * Displays section cards for Care Preferences, End-of-Life, and Values.
 * Uses lavender color theme (featureWishes).
 */

import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LockedFeatureOverlay, ViewOnlyBadge } from "@/components/entitlements";
import { PillarSectionCard } from "@/components/ui/PillarSectionCard";
import { colors, spacing, typography } from "@/constants/theme";
import { useWishesSections } from "@/constants/wishes";
import { useTranslations } from "@/contexts/LocaleContext";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { useAllProgressQuery } from "@/hooks/queries";

export default function WishesScreen() {
  const insets = useSafeAreaInsets();
  const { isLockedPillar, isViewOnlyPillar } = useEntitlements();
  const wishesSections = useWishesSections();
  const { data: progress = {} } = useAllProgressQuery();
  const t = useTranslations();

  const isLocked = isLockedPillar("wishes");
  const isViewOnly = isViewOnlyPillar("wishes");

  // Show locked overlay if pillar is locked
  if (isLocked) {
    return (
      <LockedFeatureOverlay
        featureName="Wishes & Guidance"
        description="Share your personal wishes, values, and guidance for your loved ones."
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.lg + 80 }, // Extra padding for tab bar
      ]}
      showsVerticalScrollIndicator={false}
    >
      {isViewOnly && (
        <View style={styles.viewOnlyHeader}>
          <ViewOnlyBadge />
        </View>
      )}

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
    </ScrollView>
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
  viewOnlyHeader: {
    paddingBottom: spacing.sm,
    alignItems: "center",
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
});
