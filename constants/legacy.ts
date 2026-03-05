/**
 * Legacy - Combines structure and translations for the Legacy Messages pillar
 *
 * Follows same pattern as constants/wishes.ts for consistency.
 */

import { useMemo } from "react";

import {
  legacySections as structuralSections,
  type LegacySection as StructuralLegacySection,
  type LegacyTask as StructuralLegacyTask,
  type LegacyTaskType,
} from "./legacy-structure";
import { useTranslations } from "@/contexts/LocaleContext";
import { ownerTranslations } from "@/locales/en";
import type { Translations } from "@/locales/types";

/**
 * Legacy task with translated text fields merged in.
 */
export interface LegacyTask {
  id: string;
  ionIcon?: string;
  taskKey: string;
  taskType: LegacyTaskType;
  title: string;
  description: string;
  guidanceHeading?: string;
  guidance: string;
  triggerText?: string;
  tips?: string[];
  pacingNote?: string;
}

/**
 * Legacy section with translated text fields merged in.
 */
export interface LegacySection {
  id: string;
  title: string;
  description: string;
  ionIcon: string;
  tasks: LegacyTask[];
}

type LegacyTranslations = Translations["legacy"];
type LegacySectionKey = keyof LegacyTranslations;

function getLegacySectionsWithText(
  translations?: LegacyTranslations,
): LegacySection[] {
  const legacyTranslations: LegacyTranslations =
    translations ?? ownerTranslations.legacy;

  return structuralSections.map((section) => {
    const sectionKey = section.id as LegacySectionKey;
    const sectionText = legacyTranslations[sectionKey];

    return {
      id: section.id,
      ionIcon: section.ionIcon,
      title: sectionText?.title || section.id,
      description: sectionText?.description || "",
      tasks: section.tasks.map((task) => {
        const taskText = sectionText?.tasks[task.id];
        return {
          id: task.id,
          taskKey: task.taskKey,
          taskType: task.taskType,
          ionIcon: task.ionIcon,
          title: taskText?.title || task.id,
          description: taskText?.description || "",
          guidanceHeading: taskText?.guidanceHeading,
          guidance: taskText?.guidance || "",
          triggerText: taskText?.triggerText,
          tips: taskText?.tips,
          pacingNote: taskText?.pacingNote,
        };
      }),
    };
  });
}

/**
 * Legacy sections with English owner perspective text.
 * For reactive, perspective-aware access, use the useLegacySections() hook instead.
 */
export const legacySections: LegacySection[] = getLegacySectionsWithText();

// ============================================================================
// Helper Functions
// ============================================================================

export function getLegacySection(sectionId: string): LegacySection | undefined {
  return legacySections.find((s) => s.id === sectionId);
}

export function getLegacyTask(
  sectionId: string,
  taskId: string,
): LegacyTask | undefined {
  return getLegacySection(sectionId)?.tasks.find((t) => t.id === taskId);
}

export function getLegacyTaskByKey(taskKey: string): LegacyTask | undefined {
  return legacySections
    .flatMap((s) => s.tasks)
    .find((t) => t.taskKey === taskKey);
}

export function getLegacySectionByTaskKey(
  taskKey: string,
): LegacySection | undefined {
  return legacySections.find((s) => s.tasks.some((t) => t.taskKey === taskKey));
}

export function legacySectionHasMultipleTasks(sectionId: string): boolean {
  const section = getLegacySection(sectionId);
  return section ? section.tasks.length > 1 : false;
}

export function getDefaultLegacyTask(
  sectionId: string,
): LegacyTask | undefined {
  return getLegacySection(sectionId)?.tasks[0];
}

export function getAllLegacyTaskKeys(): string[] {
  return legacySections.flatMap((s) => s.tasks.map((t) => t.taskKey));
}

export function getLegacySectionTaskCount(sectionId: string): number {
  return getLegacySection(sectionId)?.tasks.length ?? 0;
}

// ============================================================================
// Reactive Hooks (Perspective-Aware)
// ============================================================================

/**
 * Hook that returns legacy sections with current perspective translations.
 */
export function useLegacySections(): LegacySection[] {
  const translations = useTranslations();
  return useMemo(
    () => getLegacySectionsWithText(translations.legacy),
    [translations.legacy],
  );
}

/**
 * Hook to get a legacy section by ID with current perspective translations.
 */
export function useLegacySection(
  sectionId: string,
): LegacySection | undefined {
  const sections = useLegacySections();
  return useMemo(
    () => sections.find((s) => s.id === sectionId),
    [sections, sectionId],
  );
}

/**
 * Hook to get a legacy task with current perspective translations.
 */
export function useLegacyTask(
  sectionId: string,
  taskId: string,
): LegacyTask | undefined {
  const section = useLegacySection(sectionId);
  return useMemo(
    () => section?.tasks.find((t) => t.id === taskId),
    [section, taskId],
  );
}

/**
 * Hook to get a legacy section by task key with current perspective translations.
 */
export function useLegacySectionByTaskKey(
  taskKey: string,
): LegacySection | undefined {
  const sections = useLegacySections();
  return useMemo(
    () => sections.find((s) => s.tasks.some((t) => t.taskKey === taskKey)),
    [sections, taskKey],
  );
}

// Also export structural types
export type {
  LegacySection as StructuralLegacySection,
  LegacyTask as StructuralLegacyTask,
  LegacyTaskType,
} from "./legacy-structure";
