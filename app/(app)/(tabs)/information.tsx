import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SectionCard } from "@/components/vault/SectionCard";
import { vaultSections } from "@/constants/vault";
import { useVaultEntryCounts } from "@/hooks/useVaultEntries";
import { colors, spacing, typography } from "@/constants/theme";

export default function InformationScreen() {
  const insets = useSafeAreaInsets();
  const { counts } = useVaultEntryCounts();

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
          <SectionCard key={section.id} section={section} counts={counts} />
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
