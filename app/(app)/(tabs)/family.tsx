import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  LockedFeatureOverlay,
  ViewOnlyBadge,
} from "@/components/entitlements";
import { TrustedContactCard } from "@/components/family/TrustedContactCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import {
  borderRadius,
  colors,
  spacing,
  typography,
} from "@/constants/theme";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { usePerspective } from "@/contexts/LocaleContext";
import { useTrustedContactsQuery } from "@/hooks/queries";

const pageText = {
  owner: {
    title: "Family Access",
    description:
      "Choose who can access your\nplan \u2014 and when.",
    trustedContactsHeader: "YOUR TRUSTED CONTACTS",
    sharedWithMeHeader: "SHARED WITH ME",
    emptyTitle: "Share your plan with\nsomeone you trust",
    emptyDescription:
      "Give a family member, friend, or advisor access so they\u2019re never left guessing.",
    emptyButton: "Add Trusted Contact",
    sharedWithMeEmpty:
      "When someone shares their plan with you, it will appear here.",
  },
  family: {
    title: "Family Access",
    description:
      "See who has access to this\nplan and manage shared plans.",
    trustedContactsHeader: "TRUSTED CONTACTS",
    sharedWithMeHeader: "SHARED WITH ME",
    emptyTitle: "No trusted contacts yet",
    emptyDescription:
      "Trusted contacts will appear here once they\u2019re added to this plan.",
    emptyButton: "Add Trusted Contact",
    sharedWithMeEmpty:
      "When someone shares their plan with you, it will appear here.",
  },
};

export default function FamilyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLockedPillar, isViewOnlyPillar } = useEntitlements();
  const { perspective } = usePerspective();
  const {
    data: contacts,
    isLoading,
  } = useTrustedContactsQuery();

  const isLocked = isLockedPillar("family_access");
  const isViewOnly = isViewOnlyPillar("family_access");
  const t = pageText[perspective];

  if (isLocked) {
    return (
      <LockedFeatureOverlay
        featureName="Family Access"
        description="Manage who can access your legacy information and when they can see it."
      />
    );
  }

  const hasContacts = contacts && contacts.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.lg + 80 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {isViewOnly && (
        <View style={styles.viewOnlyHeader}>
          <ViewOnlyBadge />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>{t.title}</Text>
        <Text style={styles.description}>{t.description}</Text>
      </View>

      {/* Your Trusted Contacts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          {t.trustedContactsHeader}
        </Text>

        {isLoading ? (
          <View style={styles.skeletons}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : hasContacts ? (
          <View style={styles.contactsList}>
            {contacts.map((contact) => (
              <TrustedContactCard
                key={contact.id}
                contact={contact}
                onPress={() =>
                  router.push(`/family/contacts/${contact.id}`)
                }
              />
            ))}
            {/* Add button below list */}
            <Pressable
              onPress={() => router.push("/family/contacts/new")}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
            >
              <Ionicons
                name="add"
                size={20}
                color={colors.featureFamily}
              />
              <Text style={styles.addButtonText}>
                Add Trusted Contact
              </Text>
            </Pressable>
          </View>
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="people-outline"
                size={36}
                color={colors.featureFamily}
              />
            </View>
            <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
            <Text style={styles.emptyDescription}>
              {t.emptyDescription}
            </Text>
            <Pressable
              onPress={() => router.push("/family/contacts/new")}
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.emptyButtonPressed,
              ]}
            >
              <Text style={styles.emptyButtonText}>
                {t.emptyButton}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Shared With Me Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          {t.sharedWithMeHeader}
        </Text>
        <EmptyState
          icon="heart-half-outline"
          iconColor={colors.featureFamily}
          title="No shared plans yet"
          description={t.sharedWithMeEmpty}
        />
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.label,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  skeletons: {
    gap: spacing.sm,
  },
  contactsList: {
    gap: 0,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.featureFamily,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  addButtonPressed: {
    backgroundColor: colors.featureFamilyTint,
  },
  addButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.featureFamily,
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.featureFamilyTint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: typography.sizes.titleLarge,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    backgroundColor: colors.featureFamily,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.pill,
    minWidth: 200,
    alignItems: "center",
  },
  emptyButtonPressed: {
    opacity: 0.9,
  },
  emptyButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
});
