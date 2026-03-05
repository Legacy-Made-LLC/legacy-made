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
import { usePlan } from "@/data/PlanProvider";
import {
  useAllEntriesQuery,
  useAllMessagesQuery,
  useAllProgressQuery,
  useAllWishesQuery,
} from "@/hooks/queries";
import type { Translations } from "@/locales/types";

export type GuidanceType =
  | "all_complete"
  | "vault_complete"
  | "wishes_complete"
  | "legacy_complete"
  | "making_progress"
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
}

export function useHomeGuidance(): HomeGuidanceResult {
  const translations = useTranslations();
  const vaultSections = useVaultSections();
  const wishesSections = useWishesSections();
  const legacySections = useLegacySections();
  const { isViewingSharedPlan, sharedPlanInfo } = usePlan();
  const progressQuery = useAllProgressQuery();
  const entriesQuery = useAllEntriesQuery();
  const wishesQuery = useAllWishesQuery();
  const messagesQuery = useAllMessagesQuery();

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
  const isLoading =
    progressQuery.isLoading ||
    entriesQuery.isLoading ||
    wishesQuery.isLoading ||
    messagesQuery.isLoading;

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
    // "Touched" = any self-reported progress (complete or in_progress/come back later)
    const vaultTouched = vaultTaskKeys.filter((k) => progress[k]).length;
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

    // Priority 1: All complete
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

    // Priority 2: Vault complete, others incomplete
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

    // Priority 3: Wishes complete, vault incomplete
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

    // Priority 4: Legacy complete, others incomplete
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

    // Priority 5: Making progress (5+ total tasks complete)
    if (totalCompleted >= 5) {
      // Find first incomplete section to direct the user
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

    // Priority 6: Continue where you left off
    // Only triggers when the user has self-reported progress on at least one task.
    // Raw entries alone (e.g. the onboarding contact) don't count — the user
    // should still see the "brand new" guidance on their first real visit.
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

    if (totalTouched > 0 && allItems.length > 0) {
      const mostRecent = allItems.reduce((latest, item) =>
        new Date(item.updatedAt) > new Date(latest.updatedAt) ? item : latest,
      );

      let sectionTitle = "";
      let sectionIcon = "document-text-outline";
      let route: Href;
      let tintColor = colors.featureInformationTint;
      let accentColor = colors.featureInformation;

      if (mostRecent.source === "vault") {
        const section = vaultSections.find((s) =>
          s.tasks.some((t) => t.taskKey === mostRecent.taskKey),
        );
        sectionTitle = section?.title ?? "";
        sectionIcon = section?.ionIcon ?? "document-text-outline";
        route = `/(app)/vault/${section?.id ?? "contacts"}` as Href;
      } else if (mostRecent.source === "wishes") {
        const section = wishesSections.find((s) =>
          s.tasks.some((t) => t.taskKey === mostRecent.taskKey),
        );
        sectionTitle = section?.title ?? "";
        sectionIcon = section?.ionIcon ?? "heart-outline";
        route = `/(app)/wishes/${section?.id ?? "carePrefs"}` as Href;
        tintColor = colors.featureWishesTint;
        accentColor = colors.featureWishes;
      } else {
        const section = legacySections.find((s) =>
          s.tasks.some((t) => t.taskKey === mostRecent.taskKey),
        );
        sectionTitle = section?.title ?? "";
        sectionIcon = section?.ionIcon ?? "videocam-outline";
        route = `/(app)/legacy/${section?.id ?? "people"}` as Href;
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
    }

    // Priority 7: Started vault, no other progress
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

    // Priority 8: Started wishes, no vault progress
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

    // Priority 9: Started legacy, no vault/wishes progress
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

    // Priority 10: Brand new (default)
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
    translations,
  ]);

  return { guidance, isLoading };
}
