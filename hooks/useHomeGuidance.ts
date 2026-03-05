/**
 * useHomeGuidance - Adaptive guidance hook for the home screen
 *
 * Evaluates user progress across vault, wishes, and legacy pillars to
 * determine the most relevant guidance to show. Uses a priority chain
 * where the first matching condition wins.
 */

import type { Href } from "expo-router";
import { useMemo } from "react";

import { useLegacySections } from "@/constants/legacy";
import { colors } from "@/constants/theme";
import { useVaultSections } from "@/constants/vault";
import { useWishesSections } from "@/constants/wishes";
import { useTranslations } from "@/contexts/LocaleContext";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { usePlan } from "@/data/PlanProvider";
import {
  useAllEntriesQuery,
  useAllMessagesQuery,
  useAllProgressQuery,
  useAllWishesQuery,
  useTrustedContactsQuery,
} from "@/hooks/queries";
import { useContactGuidanceDismissed } from "@/hooks/useGuidanceDismissals";
import type { Translations } from "@/locales/types";

export type GuidanceType =
  | "all_complete"
  | "vault_complete"
  | "wishes_complete"
  | "legacy_complete"
  | "making_progress"
  | "add_trusted_contact"
  | "continue"
  | "started_vault"
  | "started_wishes"
  | "started_legacy"
  | "brand_new"
  | "shared_plan";

export interface GuidanceState {
  type: GuidanceType;
  title: string;
  body: string;
  cta?: string;
  /** Route to navigate when CTA is tapped */
  ctaRoute?: Href;
  /** Label for a secondary action (e.g. "Not now" to dismiss) */
  secondaryCta?: string;
  /** Background tint color for the guidance card */
  tintColor: string;
  /** Accent color for icon/CTA */
  accentColor: string;
  /** Ionicon name for the guidance section */
  icon: string;
}

type GuidanceStrings = Translations["pages"]["home"]["guidance"];

export interface HomeGuidanceResult {
  guidance: GuidanceState;
  isLoading: boolean;
  /** Callback to dismiss the "add trusted contact" guidance card */
  onDismissContactGuidance: () => void;
}

export function useHomeGuidance(): HomeGuidanceResult {
  const translations = useTranslations();
  const vaultSections = useVaultSections();
  const wishesSections = useWishesSections();
  const legacySections = useLegacySections();
  const { isViewingSharedPlan, sharedPlanInfo, planId } = usePlan();
  const progressQuery = useAllProgressQuery();
  const entriesQuery = useAllEntriesQuery();
  const wishesQuery = useAllWishesQuery();
  const messagesQuery = useAllMessagesQuery();
  const contactsQuery = useTrustedContactsQuery();
  const { isLockedPillar } = useEntitlements();
  const {
    isDismissed: isContactGuidanceDismissed,
    dismiss: dismissContactGuidance,
    isLoading: dismissalLoading,
  } = useContactGuidanceDismissed(planId ?? undefined);

  const progress = useMemo(
    () => progressQuery.data ?? {},
    [progressQuery.data],
  );
  const entries = useMemo(() => entriesQuery.data ?? [], [entriesQuery.data]);
  const wishes = useMemo(() => wishesQuery.data ?? [], [wishesQuery.data]);
  const messages = useMemo(
    () => messagesQuery.data ?? [],
    [messagesQuery.data],
  );
  const trustedContacts = useMemo(
    () => contactsQuery.data ?? [],
    [contactsQuery.data],
  );
  const isLockedFamily = isLockedPillar("family_access");
  const isLoading =
    progressQuery.isLoading ||
    entriesQuery.isLoading ||
    wishesQuery.isLoading ||
    messagesQuery.isLoading ||
    contactsQuery.isLoading ||
    dismissalLoading;

  const guidance = useMemo((): GuidanceState => {
    const g: GuidanceStrings = translations.pages.home.guidance;
    // Shared plan: passive message, no action nudges
    if (isViewingSharedPlan) {
      const name = sharedPlanInfo?.ownerFirstName ?? "";
      return {
        type: "shared_plan" as const,
        title: g.sharedPlan.title.replace("{name}", name),
        body: g.sharedPlan.body,
        tintColor: colors.surfaceSecondary,
        accentColor: colors.textSecondary,
        icon: "people-outline",
      };
    }

    // Compute progress counts
    const vaultTaskKeys = vaultSections.flatMap((s) =>
      s.tasks.map((t) => t.taskKey),
    );
    const wishesTaskKeys = wishesSections.flatMap((s) =>
      s.tasks.map((t) => t.taskKey),
    );
    const legacyTaskKeys = legacySections.flatMap((s) =>
      s.tasks.map((t) => t.taskKey),
    );

    const isComplete = (k: string) =>
      progress[k]?.status === "complete" ||
      progress[k]?.status === "not_applicable";

    const vaultCompleted = vaultTaskKeys.filter(isComplete).length;
    const wishesCompleted = wishesTaskKeys.filter(isComplete).length;
    const legacyCompleted = legacyTaskKeys.filter(isComplete).length;
    // "Touched" = any self-reported progress (complete or in_progress/come back later).
    // Exclude the onboarding contact (contacts.primary with only "in_progress" and
    // a single entry) so a brand-new user still sees "brand new" guidance. Once the
    // user manually adds more contacts, the filter stops applying.
    const onboardingContactEntries = entries.filter(
      (e) => e.taskKey === "contacts.primary",
    ).length;
    const isOnboardingOnly = (k: string) =>
      k === "contacts.primary" &&
      progress[k]?.status === "in_progress" &&
      onboardingContactEntries <= 1;
    const vaultTouched = vaultTaskKeys.filter(
      (k) => progress[k] && !isOnboardingOnly(k),
    ).length;
    const wishesTouched = wishesTaskKeys.filter((k) => progress[k]).length;
    const legacyTouched = legacyTaskKeys.filter((k) => progress[k]).length;
    const totalTouched = vaultTouched + wishesTouched + legacyTouched;

    const totalCompleted = vaultCompleted + wishesCompleted + legacyCompleted;
    const vaultTotal = vaultTaskKeys.length;
    const wishesTotal = wishesTaskKeys.length;
    const legacyTotal = legacyTaskKeys.length;

    const allVaultDone = vaultTotal > 0 && vaultCompleted === vaultTotal;
    const allWishesDone = wishesTotal > 0 && wishesCompleted === wishesTotal;
    const allLegacyDone = legacyTotal > 0 && legacyCompleted === legacyTotal;

    // Priority 1: Nudge to add a trusted contact (dismissable)
    if (
      totalTouched > 0 &&
      totalCompleted >= 3 &&
      !isLockedFamily &&
      trustedContacts.length === 0 &&
      !isContactGuidanceDismissed
    ) {
      return {
        type: "add_trusted_contact",
        title: g.addTrustedContact.title,
        body: g.addTrustedContact.body,
        cta: g.addTrustedContact.cta,
        ctaRoute: "/(app)/family/contacts/new" as Href,
        secondaryCta: g.addTrustedContact.secondaryCta,
        tintColor: colors.featureFamilyTint,
        accentColor: colors.featureFamily,
        icon: "people-outline",
      };
    }

    // Priority 2: All complete
    if (allVaultDone && allWishesDone && allLegacyDone) {
      return {
        type: "all_complete",
        title: g.allComplete.title,
        body: g.allComplete.body,
        cta: g.allComplete.cta,
        ctaRoute: "/(app)/(tabs)/information" as Href,
        tintColor: colors.featureInformationTint,
        accentColor: colors.featureInformation,
        icon: "checkmark-circle-outline",
      };
    }

    // Priority 3: Vault complete, others incomplete
    if (allVaultDone && !allWishesDone) {
      return {
        type: "vault_complete",
        title: g.vaultComplete.title,
        body: g.vaultComplete.body,
        cta: g.vaultComplete.cta,
        ctaRoute: "/(app)/(tabs)/wishes" as Href,
        tintColor: colors.featureInformationTint,
        accentColor: colors.featureInformation,
        icon: "document-text-outline",
      };
    }

    // Priority 4: Wishes complete, vault incomplete
    if (allWishesDone && !allVaultDone) {
      return {
        type: "wishes_complete",
        title: g.wishesComplete.title,
        body: g.wishesComplete.body,
        cta: g.wishesComplete.cta,
        ctaRoute: "/(app)/(tabs)/information" as Href,
        tintColor: colors.featureWishesTint,
        accentColor: colors.featureWishes,
        icon: "heart-outline",
      };
    }

    // Priority 5: Legacy complete, others incomplete
    if (allLegacyDone && (!allVaultDone || !allWishesDone)) {
      return {
        type: "legacy_complete",
        title: g.legacyComplete.title,
        body: g.legacyComplete.body,
        cta: g.legacyComplete.cta,
        ctaRoute: "/(app)/(tabs)/legacy" as Href,
        tintColor: colors.featureLegacyTint,
        accentColor: colors.featureLegacy,
        icon: "videocam-outline",
      };
    }

    // Priority 6: Started vault only — nudge toward wishes
    if (vaultTouched > 0 && wishesTouched === 0 && legacyTouched === 0) {
      return {
        type: "started_vault",
        title: g.startedVault.title,
        body: g.startedVault.body,
        cta: g.startedVault.cta,
        ctaRoute: "/(app)/(tabs)/wishes" as Href,
        tintColor: colors.featureInformationTint,
        accentColor: colors.featureInformation,
        icon: "document-text-outline",
      };
    }

    // Priority 7: Started wishes only — nudge toward vault
    if (wishesTouched > 0 && vaultTouched === 0 && legacyTouched === 0) {
      return {
        type: "started_wishes",
        title: g.startedWishes.title,
        body: g.startedWishes.body,
        cta: g.startedWishes.cta,
        ctaRoute: "/(app)/(tabs)/information" as Href,
        tintColor: colors.featureWishesTint,
        accentColor: colors.featureWishes,
        icon: "heart-outline",
      };
    }

    // Priority 8: Started legacy only — nudge toward vault
    if (legacyTouched > 0 && vaultTouched === 0 && wishesTouched === 0) {
      return {
        type: "started_legacy",
        title: g.startedLegacy.title,
        body: g.startedLegacy.body,
        cta: g.startedLegacy.cta,
        ctaRoute: "/(app)/(tabs)/legacy" as Href,
        tintColor: colors.featureLegacyTint,
        accentColor: colors.featureLegacy,
        icon: "videocam-outline",
      };
    }

    // Build a list of all items so we can find the most recently worked-on
    // section that still has incomplete tasks.
    const allItems = [
      ...entries.map((e) => ({
        updatedAt: e.updatedAt,
        taskKey: e.taskKey,
        source: "vault" as const,
      })),
      ...wishes.map((w) => ({
        updatedAt: w.updatedAt,
        taskKey: w.taskKey,
        source: "wishes" as const,
      })),
      ...messages.map((m) => ({
        updatedAt: m.updatedAt,
        taskKey: m.taskKey,
        source: "legacy" as const,
      })),
    ];

    // Find the section for an item and whether it's incomplete
    const findIncompleteSection = (item: (typeof allItems)[number]) => {
      if (item.source === "vault") {
        const section = vaultSections.find((s) =>
          s.tasks.some((t) => t.taskKey === item.taskKey),
        );
        if (section && section.tasks.some((t) => !isComplete(t.taskKey))) {
          return { section, source: item.source };
        }
      } else if (item.source === "wishes") {
        const section = wishesSections.find((s) =>
          s.tasks.some((t) => t.taskKey === item.taskKey),
        );
        if (section && section.tasks.some((t) => !isComplete(t.taskKey))) {
          return { section, source: item.source };
        }
      } else {
        const section = legacySections.find((s) =>
          s.tasks.some((t) => t.taskKey === item.taskKey),
        );
        if (section && section.tasks.some((t) => !isComplete(t.taskKey))) {
          return { section, source: item.source };
        }
      }
      return null;
    };

    // Sort items by most recent first, then find the first one whose section
    // still has incomplete tasks.
    const sortedItems = [...allItems].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    const recentIncomplete = sortedItems.reduce<
      ReturnType<typeof findIncompleteSection>
    >((found, item) => found ?? findIncompleteSection(item), null);

    if (totalTouched > 0) {
      if (recentIncomplete) {
        // Priority 9: Continue where you left off (most recent incomplete section)
        const { section, source } = recentIncomplete;
        const sectionTitle = section.title;
        const sectionIcon = section.ionIcon ?? "document-text-outline";

        let route: Href;
        let tintColor: string;
        let accentColor: string;

        if (source === "vault") {
          route = `/(app)/vault/${section.id}` as Href;
          tintColor = colors.featureInformationTint;
          accentColor = colors.featureInformation;
        } else if (source === "wishes") {
          route = `/(app)/wishes/${section.id}` as Href;
          tintColor = colors.featureWishesTint;
          accentColor = colors.featureWishes;
        } else {
          route = `/(app)/legacy/${section.id}` as Href;
          tintColor = colors.featureLegacyTint;
          accentColor = colors.featureLegacy;
        }

        return {
          type: "continue",
          title: g.continue.title,
          body: g.continue.body.replace("{sectionTitle}", sectionTitle),
          cta: g.continue.cta,
          ctaRoute: route,
          tintColor,
          accentColor,
          icon: sectionIcon,
        };
      } else {
        // Priority 10: Making progress (everything touched is done)
        const firstIncompleteVault = vaultSections.find((s) =>
          s.tasks.some((t) => !isComplete(t.taskKey)),
        );
        const route = firstIncompleteVault
          ? (`/(app)/vault/${firstIncompleteVault.id}` as Href)
          : ("/(app)/(tabs)/wishes" as Href);

        return {
          type: "making_progress",
          title: g.makingProgress.title,
          body: g.makingProgress.body,
          cta: g.makingProgress.cta,
          ctaRoute: route,
          tintColor: colors.featureInformationTint,
          accentColor: colors.featureInformation,
          icon: "trending-up-outline",
        };
      }
    }

    // Priority 11: Brand new (default)
    return {
      type: "brand_new",
      title: g.brandNew.title,
      body: g.brandNew.body,
      cta: g.brandNew.cta,
      ctaRoute: "/(app)/vault/contacts" as Href,
      tintColor: colors.featureInformationTint,
      accentColor: colors.featureInformation,
      icon: "leaf-outline",
    };
  }, [
    isViewingSharedPlan,
    sharedPlanInfo,
    vaultSections,
    wishesSections,
    legacySections,
    progress,
    entries,
    wishes,
    messages,
    trustedContacts,
    isLockedFamily,
    isContactGuidanceDismissed,
    translations,
  ]);

  return { guidance, isLoading, onDismissContactGuidance: dismissContactGuidance };
}
