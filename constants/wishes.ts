/**
 * Wishes - Combines structure and translations for the Wishes & Guidance pillar
 *
 * This file merges the structural data (IDs, icons) with translated text
 * based on the current locale and perspective.
 *
 * DEPRECATED INTERFACES: WishesTask and WishesSection with text fields are
 * maintained for backward compatibility but should be migrated to use
 * the new translation system.
 */

import {
  wishesSections as structuralSections,
  type WishesSection as StructuralWishesSection,
  type WishesTask as StructuralWishesTask,
} from "./wishes-structure";
import type { Translations } from "@/locales/types";

/**
 * @deprecated Use wishes-structure.ts + useTranslations() instead
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
 * @deprecated Use wishes-structure.ts + useTranslations() instead
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
 * Get wishes sections with translations merged in
 *
 * This function is for backward compatibility. New code should use
 * wishes-structure.ts for structure and useTranslations() for text.
 *
 * @param translations - Optional translations object. If not provided, uses English owner perspective
 */
function getWishesSectionsWithText(
  translations?: Translations["wishes"],
): WishesSection[] {
  // If no translations provided, use default English owner perspective
  let wishesTranslations = translations;
  if (!wishesTranslations) {
    // Lazy load to avoid circular dependencies
    const { ownerTranslations } = require("@/locales/en");
    wishesTranslations = ownerTranslations.wishes;
  }

  return structuralSections.map((section) => ({
    id: section.id,
    ionIcon: section.ionIcon,
    title: wishesTranslations[section.id]?.title || section.id,
    description: wishesTranslations[section.id]?.description || "",
    tasks: section.tasks.map((task) => {
      const taskText = wishesTranslations[section.id]?.tasks[task.id];
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
  }));
}

/**
 * @deprecated Use getWishesSectionsWithText() or wishes-structure.ts + useTranslations()
 *
 * Legacy constant maintained for backward compatibility.
 * Returns wishes sections with English owner perspective text.
 */
export const wishesSections: WishesSection[] = getWishesSectionsWithText();

// ============================================================================
// Helper Functions (Backward Compatible)
// ============================================================================

/**
 * Get a section by its ID (with text)
 * @deprecated Use wishes-structure.ts + useTranslations() instead
 */
export function getWishesSection(sectionId: string): WishesSection | undefined {
  return wishesSections.find((s) => s.id === sectionId);
}

/**
 * Get a task by section ID and task ID (with text)
 * @deprecated Use wishes-structure.ts + useTranslations() instead
 */
export function getWishesTask(
  sectionId: string,
  taskId: string,
): WishesTask | undefined {
  return getWishesSection(sectionId)?.tasks.find((t) => t.id === taskId);
}

/**
 * Get a task by its taskKey (with text)
 * @deprecated Use wishes-structure.ts + useTranslations() instead
 */
export function getWishesTaskByKey(taskKey: string): WishesTask | undefined {
  return wishesSections
    .flatMap((s) => s.tasks)
    .find((t) => t.taskKey === taskKey);
}

/**
 * Get the section that contains a given task key (with text)
 * @deprecated Use wishes-structure.ts + useTranslations() instead
 */
export function getWishesSectionByTaskKey(
  taskKey: string,
): WishesSection | undefined {
  return wishesSections.find((s) => s.tasks.some((t) => t.taskKey === taskKey));
}

/**
 * Check if a section has multiple tasks (requires task picker screen)
 */
export function wishesSectionHasMultipleTasks(sectionId: string): boolean {
  const section = getWishesSection(sectionId);
  return section ? section.tasks.length > 1 : false;
}

/**
 * Get the default task for a section (first task, used for single-task sections)
 * @deprecated Use wishes-structure.ts + useTranslations() instead
 */
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

// Also export structural types for new code
export type {
  WishesSection as StructuralWishesSection,
  WishesTask as StructuralWishesTask,
} from "./wishes-structure";
