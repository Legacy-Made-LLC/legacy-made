import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RestrictedAccessOverlay } from "@/components/entitlements";
import { PillarSectionCard } from "@/components/ui/PillarSectionCard";
import { colors, spacing, typography } from "@/constants/theme";
import { useVaultSections } from "@/constants/vault";
import { useTranslations } from "@/contexts/LocaleContext";
import { usePlan } from "@/data/PlanProvider";
import { useAllProgressQuery } from "@/hooks/queries";

export default function InformationScreen() {
  const insets = useSafeAreaInsets();
  const vaultSections = useVaultSections();
  const { data: progress = {} } = useAllProgressQuery();
  const t = useTranslations();
  const { canAccessPillar, isViewingSharedPlan } = usePlan();

  if (isViewingSharedPlan && !canAccessPillar("important_info")) {
    return (
      <RestrictedAccessOverlay
        featureName="Information Vault"
        description="Your access level doesn't include the Information Vault for this plan. You can view Wishes and Legacy Messages."
        accentColor={colors.featureInformation}
        tintColor={colors.featureInformationTint}
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
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Information Vault</Text>
        <Text style={styles.description}>
          {t.pages.information.description}
        </Text>
      </View>

      <View style={styles.categories}>
        {vaultSections.map((section) => (
          <PillarSectionCard
            key={section.id}
            section={section}
            progress={progress}
            pillar="information"
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
  categories: {
    gap: spacing.xs,
  },
});
