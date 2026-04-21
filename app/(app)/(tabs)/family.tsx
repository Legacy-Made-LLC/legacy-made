import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  LockedFeatureOverlay,
  RestrictedAccessOverlay,
  UpgradePrompt,
} from "@/components/entitlements";
import { SharedPlanCard } from "@/components/family/SharedPlanCard";
import { TrustedContactCard } from "@/components/family/TrustedContactCard";
import { NotificationPermissionPrompt } from "@/components/notifications/NotificationPermissionPrompt";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { useTranslations } from "@/contexts/LocaleContext";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { usePlan } from "@/data/PlanProvider";
import {
  useAcceptSharedPlan,
  useDeclineSharedPlan,
  useSharedPlansQuery,
  useTrustedContactsQuery,
} from "@/hooks/queries";
import { usePlanSwitching } from "@/hooks/usePlanSwitching";
import { toast } from "@/hooks/useToast";

export default function FamilyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLockedPillar, isViewOnlyPillar } = useEntitlements();
  const { isViewingSharedPlan, isReadOnly } = usePlan();
  const { switchToSharedPlan } = usePlanSwitching();
  const { data: contacts, isLoading } = useTrustedContactsQuery();
  const { data: sharedPlans, isLoading: isLoadingSharedPlans } =
    useSharedPlansQuery();
  const acceptMutation = useAcceptSharedPlan();
  const declineMutation = useDeclineSharedPlan();

  // Clear notification badge each time the Family tab is focused
  useFocusEffect(
    useCallback(() => {
      Notifications.setBadgeCountAsync(0);
    }, []),
  );

  const isLocked = isLockedPillar("family_access");
  const isViewOnly = isViewOnlyPillar("family_access");
  const translations = useTranslations();
  const t = translations.pages.family;
  const hasSharedPlans = sharedPlans && sharedPlans.length > 0;
  // View-only on own plan — show upgrade prompts for trusted contacts
  const isOwnPlanViewOnly = !isViewingSharedPlan && isViewOnly;
  // Can't add contacts if viewing a shared plan, read-only, or view-only
  const showAddContact = !isViewingSharedPlan && !isReadOnly && !isViewOnly;

  // Filter out revoked plans, then sort: pending invitations first, then accepted
  const sortedSharedPlans = React.useMemo(() => {
    if (!sharedPlans) return [];
    return [...sharedPlans]
      .filter(
        (sp) =>
          sp.accessStatus !== "revoked_by_owner" &&
          sp.accessStatus !== "revoked_by_contact",
      )
      .sort((a, b) => {
        if (a.accessStatus === "pending" && b.accessStatus !== "pending")
          return -1;
        if (a.accessStatus !== "pending" && b.accessStatus === "pending")
          return 1;
        return 0;
      });
  }, [sharedPlans]);

  const [showUpgradePrompt, setShowUpgradePrompt] = React.useState(false);

  // Track which plan is currently being actioned
  const [actioningPlanId, setActioningPlanId] = React.useState<string | null>(
    null,
  );

  const handleAcceptInvitation = async (planId: string) => {
    setActioningPlanId(planId);
    try {
      await acceptMutation.mutateAsync(planId);
      toast.success({ title: "Invitation accepted" });
    } catch {
      toast.error({
        message: "Failed to accept invitation. Please try again.",
      });
    } finally {
      setActioningPlanId(null);
    }
  };

  const handleDeclineInvitation = async (planId: string) => {
    setActioningPlanId(planId);
    try {
      await declineMutation.mutateAsync(planId);
      toast.success({ title: "Invitation declined" });
    } catch {
      toast.error({
        message: "Failed to decline invitation. Please try again.",
      });
    } finally {
      setActioningPlanId(null);
    }
  };

  // Show paywall only if pillar is fully locked (not in pillars or viewOnlyPillars).
  // View-only on own plan still allows viewing shared plans — just restricts trusted contacts.
  if (isLocked) {
    return (
      <LockedFeatureOverlay
        featureName="Family Access"
        description="Manage who can access your legacy information and when they can see it."
        placement="pillar_locked_trusted"
      />
    );
  }

  if (isViewingSharedPlan) {
    return (
      <RestrictedAccessOverlay
        featureName="Family Access"
        description="Family Access settings can only be managed from your own plan."
        accentColor={colors.featureFamily}
        tintColor={colors.featureFamilyTint}
      />
    );
  }

  const hasContacts = contacts && contacts.length > 0;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.lg + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>{t.title}</Text>
          <Text style={styles.description}>{t.description}</Text>
        </View>

        {/* Your Trusted Contacts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t.trustedContactsHeader}</Text>

          {isLoading ? (
            <View style={styles.skeletons}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : isOwnPlanViewOnly ? (
            /* Locked state — view-only on own plan, upgrade to add contacts */
            <View style={styles.emptyState}>
              <View style={styles.lockedIcon}>
                <Ionicons
                  name="lock-closed-outline"
                  size={28}
                  color={colors.textTertiary}
                />
              </View>
              <Text style={styles.emptyTitle}>Trusted Contacts</Text>
              <Text style={styles.emptyDescription}>
                Upgrade your plan to invite trusted contacts and share access to
                your legacy information.
              </Text>
              <Pressable
                onPress={() => setShowUpgradePrompt(true)}
                style={({ pressed }) => [
                  styles.learnMoreButton,
                  pressed && styles.learnMoreButtonPressed,
                ]}
              >
                <Text style={styles.learnMoreText}>Learn More</Text>
              </Pressable>
            </View>
          ) : hasContacts ? (
            <View style={styles.contactsList}>
              {contacts.map((contact) => (
                <TrustedContactCard
                  key={contact.id}
                  contact={contact}
                  onPress={() => router.push(`/family/contacts/${contact.id}`)}
                />
              ))}
              {/* Add button below list */}
              {showAddContact && (
                <Pressable
                  onPress={() => router.push("/family/contacts/new")}
                  style={({ pressed }) => [
                    styles.addButton,
                    pressed && styles.addButtonPressed,
                  ]}
                >
                  <Ionicons name="add" size={20} color={colors.featureFamily} />
                  <Text style={styles.addButtonText}>Add Trusted Contact</Text>
                </Pressable>
              )}
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
              <Text style={styles.emptyDescription}>{t.emptyDescription}</Text>
              <Pressable
                onPress={() => router.push("/family/contacts/new")}
                style={({ pressed }) => [
                  styles.emptyButton,
                  pressed && styles.emptyButtonPressed,
                ]}
              >
                <Text style={styles.emptyButtonText}>{t.emptyButton}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Shared With Me Section — only shown on user's own plan */}
        {!isViewingSharedPlan && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t.sharedWithMeHeader}</Text>
            {isLoadingSharedPlans ? (
              <View style={styles.skeletons}>
                <SkeletonCard />
              </View>
            ) : hasSharedPlans ? (
              <View style={styles.contactsList}>
                {sortedSharedPlans.map((sp) => (
                  <SharedPlanCard
                    key={sp.planId}
                    sharedPlan={sp}
                    onPress={() => {
                      switchToSharedPlan(sp);
                    }}
                    onAccept={
                      sp.accessStatus === "pending"
                        ? () => handleAcceptInvitation(sp.planId)
                        : undefined
                    }
                    onDecline={
                      sp.accessStatus === "pending"
                        ? () => handleDeclineInvitation(sp.planId)
                        : undefined
                    }
                    isActioning={actioningPlanId === sp.planId}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="heart-half-outline"
                iconColor={colors.featureFamily}
                title="No shared plans yet"
                description={t.sharedWithMeEmpty}
              />
            )}
          </View>
        )}
      </ScrollView>

      {isOwnPlanViewOnly && (
        <UpgradePrompt
          visible={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          title="Unlock Trusted Contacts"
          message="Upgrade your plan to invite trusted contacts and share access to your legacy information."
          placement="pillar_locked_trusted"
        />
      )}

      <NotificationPermissionPrompt />
    </>
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
  learnMoreButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.featureFamily,
  },
  learnMoreButtonPressed: {
    backgroundColor: colors.featureFamilyTint,
  },
  learnMoreText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    color: colors.featureFamilyDark,
  },
  lockedIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
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
