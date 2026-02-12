import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PillarSectionCard } from "@/components/ui/PillarSectionCard";
import { colors, spacing, typography } from "@/constants/theme";
import { vaultSections } from "@/constants/vault";
import { useEntryCountsQuery } from "@/hooks/queries";

export default function InformationScreen() {
  const insets = useSafeAreaInsets();
  const { data: counts = {} } = useEntryCountsQuery();

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
          Accounts, documents, and contacts —{"\n"}organized for when it matters
        </Text>
      </View>

      <View style={styles.categories}>
        {vaultSections.map((section) => (
          <PillarSectionCard
            key={section.id}
            section={section}
            counts={counts}
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
