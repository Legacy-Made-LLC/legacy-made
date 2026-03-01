/**
 * useQuickActions - Dynamic quick action suggestions for the home screen
 *
 * Evaluates progress across vault and wishes sections and returns the 3
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
import { useVaultSections, type VaultSection } from "@/constants/vault";
import { useWishesSections, type WishesSection } from "@/constants/wishes";
import { useTranslations } from "@/contexts/LocaleContext";
import { useAllProgressQuery } from "@/hooks/queries";
import type { Translations } from "@/locales/types";

const MAX_ACTIONS = 3;

export interface QuickAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: Href;
  color: string;
}

type Section = VaultSection | WishesSection;

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
      if (entry.status === "complete") completed++;
    }
  }

  if (touched === 0) return "not_started";
  if (completed === section.tasks.length) return "complete";
  return "in_progress";
}

const PILLAR_COLORS: Record<"vault" | "wishes", string> = {
  vault: colors.featureInformation,
  wishes: colors.featureWishes,
};

function toAction(
  section: Section,
  pillar: "vault" | "wishes",
  labels: QuickActionLabels,
): QuickAction {
  const route =
    pillar === "vault"
      ? (`/(app)/vault/${section.id}` as Href)
      : (`/(app)/wishes/${section.id}` as Href);

  const label =
    labels[section.id as keyof QuickActionLabels] ?? section.title;

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
  const { data: progress = {} } = useAllProgressQuery();
  const translations = useTranslations();
  const labels = translations.pages.home.quickActions;

  return useMemo(() => {
    const notStarted: QuickAction[] = [];
    const inProgress: QuickAction[] = [];

    const allSections: { section: Section; pillar: "vault" | "wishes" }[] = [
      ...vaultSections.map((s) => ({
        section: s as Section,
        pillar: "vault" as const,
      })),
      ...wishesSections.map((s) => ({
        section: s as Section,
        pillar: "wishes" as const,
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
    if (active.length > 0) {
      return active.slice(0, MAX_ACTIONS);
    }

    // Everything complete — show common revisit actions
    return REVISIT_SECTION_IDS.map((id) => {
      const section = vaultSections.find((s) => s.id === id);
      return section ? toAction(section, "vault", labels) : null;
    }).filter((a): a is QuickAction => a !== null);
  }, [vaultSections, wishesSections, progress, labels]);
}
