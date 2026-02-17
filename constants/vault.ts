/**
 * Vault - Combines structure and translations for the Information Vault
 *
 * This file merges the structural data (IDs, icons) with translated text
 * based on the current locale and perspective.
 *
 * DEPRECATED INTERFACES: VaultTask and VaultSection with text fields are
 * maintained for backward compatibility but should be migrated to use
 * the new translation system.
 */

import { useMemo } from "react";

import {
  vaultSections as structuralSections,
  type VaultSection as StructuralVaultSection,
  type VaultTask as StructuralVaultTask,
} from "./vault-structure";
import { useTranslations } from "@/contexts/LocaleContext";
import type { Translations } from "@/locales/types";

/**
 * @deprecated Use vault-structure.ts + useTranslations() instead
 */
export interface VaultTask {
  /** Unique identifier within the section */
  id: string;
  /** Key used to identify entries in the backend (e.g., "contacts.primary", "financial") */
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
 * @deprecated Use vault-structure.ts + useTranslations() instead
 */
export interface VaultSection {
  /** Unique identifier for the section */
  id: string;
  /** Display title shown on dashboard */
  title: string;
  /** Short description shown on dashboard */
  description: string;
  /** Ionicon name */
  ionIcon: string;
  /** Tasks within this section */
  tasks: VaultTask[];
}

/**
 * Get vault sections with translations merged in
 *
 * This function is for backward compatibility. New code should use
 * vault-structure.ts for structure and useTranslations() for text.
 *
 * @param translations - Optional translations object. If not provided, uses English owner perspective
 */
function getVaultSectionsWithText(
  translations?: Translations["vault"],
): VaultSection[] {
  // If no translations provided, use default English owner perspective
  let vaultTranslations = translations;
  if (!vaultTranslations) {
    // Lazy load to avoid circular dependencies
    const { ownerTranslations } = require("@/locales/en");
    vaultTranslations = ownerTranslations.vault;
  }

  return structuralSections.map((section) => ({
    id: section.id,
    ionIcon: section.ionIcon,
    title: vaultTranslations[section.id]?.title || section.id,
    description: vaultTranslations[section.id]?.description || "",
    tasks: section.tasks.map((task) => {
      const taskText = vaultTranslations[section.id]?.tasks[task.id];
      return {
        id: task.id,
        taskKey: task.taskKey,
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
 * @deprecated Use getVaultSectionsWithText() or vault-structure.ts + useTranslations()
 *
 * Legacy constant maintained for backward compatibility.
 * Returns vault sections with English owner perspective text.
 */
export const vaultSections: VaultSection[] = getVaultSectionsWithText();

// ============================================================================
// Helper Functions (Backward Compatible)
// ============================================================================

/**
 * Get a section by its ID (with text)
 * @deprecated Use vault-structure.ts + useTranslations() instead
 */
export function getSection(sectionId: string): VaultSection | undefined {
  return vaultSections.find((s) => s.id === sectionId);
}

/**
 * Get a task by section ID and task ID (with text)
 * @deprecated Use vault-structure.ts + useTranslations() instead
 */
export function getTask(
  sectionId: string,
  taskId: string,
): VaultTask | undefined {
  return getSection(sectionId)?.tasks.find((t) => t.id === taskId);
}

/**
 * Get a task by its taskKey (with text)
 * @deprecated Use vault-structure.ts + useTranslations() instead
 */
export function getTaskByKey(taskKey: string): VaultTask | undefined {
  return vaultSections
    .flatMap((s) => s.tasks)
    .find((t) => t.taskKey === taskKey);
}

/**
 * Get the section that contains a given task key (with text)
 * @deprecated Use vault-structure.ts + useTranslations() instead
 */
export function getSectionByTaskKey(taskKey: string): VaultSection | undefined {
  return vaultSections.find((s) => s.tasks.some((t) => t.taskKey === taskKey));
}

/**
 * Check if a section has multiple tasks (requires task picker screen)
 */
export function sectionHasMultipleTasks(sectionId: string): boolean {
  const section = getSection(sectionId);
  return section ? section.tasks.length > 1 : false;
}

/**
 * Get the default task for a section (first task, used for single-task sections)
 * @deprecated Use vault-structure.ts + useTranslations() instead
 */
export function getDefaultTask(sectionId: string): VaultTask | undefined {
  return getSection(sectionId)?.tasks[0];
}

/**
 * Get all task keys (useful for validation)
 */
export function getAllTaskKeys(): string[] {
  return vaultSections.flatMap((s) => s.tasks.map((t) => t.taskKey));
}

// ============================================================================
// Reactive Hooks (Perspective-Aware)
// ============================================================================

/**
 * Hook that returns vault sections with current perspective translations.
 * Re-renders when perspective changes via the dev menu.
 */
export function useVaultSections(): VaultSection[] {
  const translations = useTranslations();
  return useMemo(
    () => getVaultSectionsWithText(translations.vault),
    [translations.vault],
  );
}

/**
 * Hook to get a section by ID with current perspective translations.
 */
export function useVaultSection(sectionId: string): VaultSection | undefined {
  const sections = useVaultSections();
  return useMemo(
    () => sections.find((s) => s.id === sectionId),
    [sections, sectionId],
  );
}

/**
 * Hook to get a task by section ID and task ID with current perspective translations.
 */
export function useVaultTask(
  sectionId: string,
  taskId: string,
): VaultTask | undefined {
  const section = useVaultSection(sectionId);
  return useMemo(
    () => section?.tasks.find((t) => t.id === taskId),
    [section, taskId],
  );
}

// Also export structural types for new code
export type {
  VaultSection as StructuralVaultSection,
  VaultTask as StructuralVaultTask,
} from "./vault-structure";
