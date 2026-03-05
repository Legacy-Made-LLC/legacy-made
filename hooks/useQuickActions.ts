/**
 * useQuickActions - Dynamic quick action suggestions for the home screen
 *
 * Evaluates progress across vault, wishes, and legacy sections and returns the 3
 * most relevant next actions.
 *
 * Priority order:
 * 1. Not-started sections (next logical thing to tackle)
 * 2. In-progress but incomplete sections (continue what you started)
 * 3. When everything is complete, show common "revisit" actions
 */

import type { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { useMemo } from "react";

import type { TaskProgressData } from "@/api/types";
import { colors } from "@/constants/theme";
import { useLegacySections, type LegacySection } from "@/constants/legacy";
import { useVaultSections, type VaultSection } from "@/constants/vault";
import { useWishesSections, type WishesSection } from "@/constants/wishes";
import { useTranslations } from "@/contexts/LocaleContext";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { usePlan } from "@/data/PlanProvider";
import { useAllProgressQuery, useTrustedContactsQuery } from "@/hooks/queries";
import type { Translations } from "@/locales/types";

const MAX_ACTIONS = 3;

export interface QuickAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: Href;
  color: string;
}

type Section = VaultSection | WishesSection | LegacySection;

type Pillar = "vault" | "wishes" | "legacy";

type SectionStatus = "not_started" | "in_progress" | "complete";

type QuickActionLabels = Translations["pages"]["home"]["quickActions"];

/**
 * Determine a section's status based on self-reported task progress.
 * - "not_started": no tasks have any progress entry
 * - "in_progress": at least one task has a progress entry, but not all are "complete"
 * - "complete": every task is marked "complete"
 */
function getSectionStatus(
  section: Section,
  progress: Record<string, TaskProgressData>,
): SectionStatus {
  let touched = 0;
  let completed = 0;

  for (const task of section.tasks) {
    const entry = progress[task.taskKey];
    if (entry) {
      touched++;
      if (entry.status === "complete" || entry.status === "not_applicable")
        completed++;
    }
  }

  if (touched === 0) return "not_started";
  if (completed === section.tasks.length) return "complete";
  return "in_progress";
}

const PILLAR_COLORS: Record<Pillar, string> = {
  vault: colors.featureInformation,
  wishes: colors.featureWishes,
  legacy: colors.featureLegacy,
};

/** Map legacy section IDs to their namespaced quick action label keys */
const LEGACY_LABEL_KEYS: Record<string, keyof QuickActionLabels> = {
  people: "legacyPeople",
  story: "legacyStory",
  future: "legacyFuture",
};

function toAction(
  section: Section,
  pillar: Pillar,
  labels: QuickActionLabels,
): QuickAction {
  let route: Href;
  if (pillar === "vault") {
    route = `/(app)/vault/${section.id}` as Href;
  } else if (pillar === "wishes") {
    route = `/(app)/wishes/${section.id}` as Href;
  } else {
    route = `/(app)/legacy/${section.id}` as Href;
  }

  // Legacy sections use namespaced label keys to avoid collision with vault "people"
  const labelKey =
    pillar === "legacy"
      ? LEGACY_LABEL_KEYS[section.id]
      : (section.id as keyof QuickActionLabels);

  const label = (labelKey && labels[labelKey]) ?? section.title;

  return {
    key: `${pillar}.${section.id}`,
    label,
    icon: section.ionIcon as keyof typeof Ionicons.glyphMap,
    route,
    color: PILLAR_COLORS[pillar],
  };
}

/** Common actions users revisit after completing their plan */
const REVISIT_SECTION_IDS = ["contacts", "finances", "documents"];

export function useQuickActions(): QuickAction[] {
  const vaultSections = useVaultSections();
  const wishesSections = useWishesSections();
  const legacySections = useLegacySections();
  const { data: progress = {} } = useAllProgressQuery();
  const translations = useTranslations();
  const labels = translations.pages.home.quickActions;
  const { isViewingSharedPlan } = usePlan();
  const { isLockedPillar } = useEntitlements();
  const { data: trustedContacts = [] } = useTrustedContactsQuery();

  return useMemo(() => {
    const notStarted: QuickAction[] = [];
    const inProgress: QuickAction[] = [];

    const allSections: { section: Section; pillar: Pillar }[] = [
      ...vaultSections.map((s) => ({
        section: s as Section,
        pillar: "vault" as const,
      })),
      ...wishesSections.map((s) => ({
        section: s as Section,
        pillar: "wishes" as const,
      })),
      ...legacySections.map((s) => ({
        section: s as Section,
        pillar: "legacy" as const,
      })),
    ];

    for (const { section, pillar } of allSections) {
      const status = getSectionStatus(section, progress);
      if (status === "not_started") {
        notStarted.push(toAction(section, pillar, labels));
      } else if (status === "in_progress") {
        inProgress.push(toAction(section, pillar, labels));
      }
    }

    // Not-started first, then in-progress
    const active = [...notStarted, ...inProgress];
    let actions: QuickAction[];
    if (active.length > 0) {
      actions = active.slice(0, MAX_ACTIONS);
    } else {
      // Everything complete — show common revisit actions
      actions = REVISIT_SECTION_IDS.map((id) => {
        const section = vaultSections.find((s) => s.id === id);
        return section ? toAction(section, "vault", labels) : null;
      }).filter((a): a is QuickAction => a !== null);
    }

    // Inject "Share your plan" action when user has significant progress
    // but no trusted contacts yet
    if (
      !isViewingSharedPlan &&
      !isLockedPillar("family_access") &&
      trustedContacts.length === 0
    ) {
      const totalTasks = allSections.reduce(
        (sum, { section }) => sum + section.tasks.length,
        0,
      );
      let totalCompleted = 0;
      for (const { section } of allSections) {
        for (const task of section.tasks) {
          const entry = progress[task.taskKey];
          if (
            entry?.status === "complete" ||
            entry?.status === "not_applicable"
          ) {
            totalCompleted++;
          }
        }
      }

      if (totalCompleted > totalTasks / 2) {
        actions.unshift({
          key: "family.addContact",
          label: labels.addTrustedContact,
          icon: "people-outline" as keyof typeof Ionicons.glyphMap,
          route: "/(app)/family/contacts/new" as Href,
          color: colors.featureFamily,
        });
        actions = actions.slice(0, MAX_ACTIONS);
      }
    }

    return actions;
  }, [
    vaultSections,
    wishesSections,
    legacySections,
    progress,
    labels,
    isViewingSharedPlan,
    isLockedPillar,
    trustedContacts,
  ]);
}
