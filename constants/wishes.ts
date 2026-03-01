/**
 * Wishes - Combines structure and translations for the Wishes & Guidance pillar
 *
 * This file merges the structural data (IDs, icons) with translated text
 * based on the current locale and perspective.
 *
 * These "combined" types (WishesSection, WishesTask) include both structural
 * fields and translated text. For structure-only access (no text needed),
 * use wishes-structure.ts directly.
 */

import { useMemo } from "react";

import {
  wishesSections as structuralSections,
  type WishesSection as StructuralWishesSection,
  type WishesTask as StructuralWishesTask,
} from "./wishes-structure";
import { useTranslations } from "@/contexts/LocaleContext";
import { ownerTranslations } from "@/locales/en";
import type { Translations } from "@/locales/types";

/**
 * Wishes task with translated text fields merged in.
 * For structure-only access, use WishesTask from wishes-structure.ts.
 */
export interface WishesTask {
  /** Unique identifier within the section */
  id: string;
  /** Ionicon name */
  ionIcon?: string;
  /** Key used to identify wishes in the backend (e.g., "wishes.carePrefs.whatMatters") */
  taskKey: string;
  /** Display title */
  title: string;
  /** Short description */
  description: string;
  /** Heading for guidance card shown on the task screen */
  guidanceHeading?: string;
  /** Longer guidance text shown on the task screen */
  guidance: string;
  /** Text shown on the collapsed trigger button */
  triggerText?: string;
  /** Tips shown in "What else should I know?" section */
  tips?: string[];
  /** Custom pacing note (defaults to standard message if not provided) */
  pacingNote?: string;
}

/**
 * Wishes section with translated text fields merged in.
 * For structure-only access, use WishesSection from wishes-structure.ts.
 */
export interface WishesSection {
  /** Unique identifier for the section */
  id: string;
  /** Display title shown on dashboard */
  title: string;
  /** Short description shown on dashboard */
  description: string;
  /** Ionicon name */
  ionIcon: string;
  /** Tasks within this section */
  tasks: WishesTask[];
}

/**
 * Get wishes sections with translations merged in.
 *
 * @param translations - Optional translations object. If not provided, uses English owner perspective.
 */
type WishesTranslations = Translations["wishes"];
type WishesSectionKey = keyof WishesTranslations;

function getWishesSectionsWithText(
  translations?: WishesTranslations,
): WishesSection[] {
  // If no translations provided, use default English owner perspective
  const wishesTranslations: WishesTranslations =
    translations ?? ownerTranslations.wishes;

  return structuralSections.map((section) => {
    const sectionKey = section.id as WishesSectionKey;
    const sectionText = wishesTranslations[sectionKey];

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
 * Wishes sections with English owner perspective text.
 * For reactive, perspective-aware access, use the useWishesSections() hook instead.
 */
export const wishesSections: WishesSection[] = getWishesSectionsWithText();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a section by its ID (with text).
 * Note: Uses the static English owner constant. For perspective-aware access, use useWishesSection().
 */
export function getWishesSection(sectionId: string): WishesSection | undefined {
  return wishesSections.find((s) => s.id === sectionId);
}

/**
 * Get a task by section ID and task ID (with text).
 * Note: Uses the static English owner constant. For perspective-aware access, use useWishesTask().
 */
export function getWishesTask(
  sectionId: string,
  taskId: string,
): WishesTask | undefined {
  return getWishesSection(sectionId)?.tasks.find((t) => t.id === taskId);
}

/** Get a task by its taskKey (with text). */
export function getWishesTaskByKey(taskKey: string): WishesTask | undefined {
  return wishesSections
    .flatMap((s) => s.tasks)
    .find((t) => t.taskKey === taskKey);
}

/** Get the section that contains a given task key (with text). */
export function getWishesSectionByTaskKey(
  taskKey: string,
): WishesSection | undefined {
  return wishesSections.find((s) => s.tasks.some((t) => t.taskKey === taskKey));
}

/** Check if a section has multiple tasks (requires task picker screen). */
export function wishesSectionHasMultipleTasks(sectionId: string): boolean {
  const section = getWishesSection(sectionId);
  return section ? section.tasks.length > 1 : false;
}

/** Get the default task for a section (first task, used for single-task sections). */
export function getDefaultWishesTask(
  sectionId: string,
): WishesTask | undefined {
  return getWishesSection(sectionId)?.tasks[0];
}

/**
 * Get all task keys (useful for validation)
 */
export function getAllWishesTaskKeys(): string[] {
  return wishesSections.flatMap((s) => s.tasks.map((t) => t.taskKey));
}

/**
 * Get count of tasks in a section
 */
export function getWishesSectionTaskCount(sectionId: string): number {
  return getWishesSection(sectionId)?.tasks.length ?? 0;
}

// Re-export choice data from wishes-structure
export {
  advanceDirectiveDocTypes,
  faithTraditions,
  qualityOfLifeConditions,
  whatMattersMostValues,
} from "./wishes-structure";

// ============================================================================
// Reactive Hooks (Perspective-Aware)
// ============================================================================

/**
 * Hook that returns wishes sections with current perspective translations.
 * Re-renders when perspective changes via the dev menu.
 */
export function useWishesSections(): WishesSection[] {
  const translations = useTranslations();
  return useMemo(
    () => getWishesSectionsWithText(translations.wishes),
    [translations.wishes],
  );
}

/**
 * Hook to get a wishes section by ID with current perspective translations.
 */
export function useWishesSection(
  sectionId: string,
): WishesSection | undefined {
  const sections = useWishesSections();
  return useMemo(
    () => sections.find((s) => s.id === sectionId),
    [sections, sectionId],
  );
}

/**
 * Hook to get a wishes task with current perspective translations.
 */
export function useWishesTask(
  sectionId: string,
  taskId: string,
): WishesTask | undefined {
  const section = useWishesSection(sectionId);
  return useMemo(
    () => section?.tasks.find((t) => t.id === taskId),
    [section, taskId],
  );
}

/**
 * Hook to get a wishes section by task key with current perspective translations.
 */
export function useWishesSectionByTaskKey(
  taskKey: string,
): WishesSection | undefined {
  const sections = useWishesSections();
  return useMemo(
    () => sections.find((s) => s.tasks.some((t) => t.taskKey === taskKey)),
    [sections, taskKey],
  );
}

// Also export structural types for new code
export type {
  WishesSection as StructuralWishesSection,
  WishesTask as StructuralWishesTask,
} from "./wishes-structure";
