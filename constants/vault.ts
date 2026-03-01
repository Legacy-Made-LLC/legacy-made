/**
 * Vault - Combines structure and translations for the Information Vault
 *
 * This file merges the structural data (IDs, icons) with translated text
 * based on the current locale and perspective.
 *
 * These "combined" types (VaultSection, VaultTask) include both structural
 * fields and translated text. For structure-only access (no text needed),
 * use vault-structure.ts directly.
 */

import { useMemo } from "react";

import { useTranslations } from "@/contexts/LocaleContext";
import { ownerTranslations } from "@/locales/en";
import type { Translations } from "@/locales/types";
import { vaultSections as structuralSections } from "./vault-structure";

/**
 * Vault task with translated text fields merged in.
 * For structure-only access, use VaultTask from vault-structure.ts.
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
 * Vault section with translated text fields merged in.
 * For structure-only access, use VaultSection from vault-structure.ts.
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
 * Get vault sections with translations merged in.
 *
 * @param translations - Optional translations object. If not provided, uses English owner perspective.
 */
type VaultTranslations = Translations["vault"];
type VaultSectionKey = keyof VaultTranslations;

function getVaultSectionsWithText(
  translations?: VaultTranslations,
): VaultSection[] {
  // If no translations provided, use default English owner perspective
  const vaultTranslations: VaultTranslations =
    translations ?? ownerTranslations.vault;

  return structuralSections.map((section) => {
    const sectionKey = section.id as VaultSectionKey;
    const sectionText = vaultTranslations[sectionKey];

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
 * Vault sections with English owner perspective text.
 * For reactive, perspective-aware access, use the useVaultSections() hook instead.
 */
export const vaultSections: VaultSection[] = getVaultSectionsWithText();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a section by its ID (with text).
 * Note: Uses the static English owner constant. For perspective-aware access, use useVaultSection().
 */
export function getSection(sectionId: string): VaultSection | undefined {
  return vaultSections.find((s) => s.id === sectionId);
}

/**
 * Get a task by section ID and task ID (with text).
 * Note: Uses the static English owner constant. For perspective-aware access, use useVaultTask().
 */
export function getTask(
  sectionId: string,
  taskId: string,
): VaultTask | undefined {
  return getSection(sectionId)?.tasks.find((t) => t.id === taskId);
}

/** Get a task by its taskKey (with text). */
export function getTaskByKey(taskKey: string): VaultTask | undefined {
  return vaultSections
    .flatMap((s) => s.tasks)
    .find((t) => t.taskKey === taskKey);
}

/** Get the section that contains a given task key (with text). */
export function getSectionByTaskKey(taskKey: string): VaultSection | undefined {
  return vaultSections.find((s) => s.tasks.some((t) => t.taskKey === taskKey));
}

/** Check if a section has multiple tasks (requires task picker screen). */
export function sectionHasMultipleTasks(sectionId: string): boolean {
  const section = getSection(sectionId);
  return section ? section.tasks.length > 1 : false;
}

/** Get the default task for a section (first task, used for single-task sections). */
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
