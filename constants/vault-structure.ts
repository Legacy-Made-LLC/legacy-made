/**
 * Vault Structure - Defines the Information Vault sections and tasks
 *
 * This file contains ONLY structural data (IDs, icons, task relationships).
 * All text content has been moved to locales/ for i18n support.
 */

export interface VaultTask {
  /** Unique identifier within the section */
  id: string;
  /** Key used to identify entries in the backend (e.g., "contacts.primary", "financial") */
  taskKey: string;
  /** Ionicon name (if task-specific) */
  ionIcon?: string;
}

export interface VaultSection {
  /** Unique identifier for the section */
  id: string;
  /** Ionicon name */
  ionIcon: string;
  /** Tasks within this section */
  tasks: VaultTask[];
  /** Whether this section can be marked "not applicable". Defaults to true; false for contacts. */
  skippable?: boolean;
}

export const vaultSections: VaultSection[] = [
  {
    id: "contacts",
    ionIcon: "call-outline",
    skippable: false,
    tasks: [
      {
        id: "primary",
        taskKey: "contacts.primary",
      },
      {
        id: "backup",
        taskKey: "contacts.backup",
      },
    ],
  },
  {
    id: "people",
    ionIcon: "person-outline",
    tasks: [
      {
        id: "people",
        taskKey: "people",
      },
    ],
  },
  {
    id: "finances",
    ionIcon: "cash-outline",
    tasks: [
      {
        id: "accounts",
        taskKey: "financial",
      },
    ],
  },
  {
    id: "insurance",
    ionIcon: "shield-outline",
    tasks: [
      {
        id: "policies",
        taskKey: "insurance",
      },
    ],
  },
  {
    id: "documents",
    ionIcon: "document-text-outline",
    tasks: [
      {
        id: "legal",
        taskKey: "documents.legal",
      },
      {
        id: "other",
        taskKey: "documents.other",
      },
    ],
  },
  {
    id: "property",
    ionIcon: "home-outline",
    tasks: [
      {
        id: "property",
        taskKey: "property",
      },
    ],
  },
  {
    id: "pets",
    ionIcon: "paw-outline",
    tasks: [
      {
        id: "pets",
        taskKey: "pets",
      },
    ],
  },
  {
    id: "digital",
    ionIcon: "laptop-outline",
    tasks: [
      {
        id: "email",
        taskKey: "digital.email",
      },
      {
        id: "passwords",
        taskKey: "digital.passwords",
      },
      {
        id: "devices",
        taskKey: "digital.devices",
      },
      {
        id: "social",
        taskKey: "digital.social",
      },
    ],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a section by its ID
 */
export function getSection(sectionId: string): VaultSection | undefined {
  return vaultSections.find((s) => s.id === sectionId);
}

/**
 * Get a task by section ID and task ID
 */
export function getTask(
  sectionId: string,
  taskId: string,
): VaultTask | undefined {
  return getSection(sectionId)?.tasks.find((t) => t.id === taskId);
}

/**
 * Get a task by its taskKey
 */
export function getTaskByKey(taskKey: string): VaultTask | undefined {
  return vaultSections
    .flatMap((s) => s.tasks)
    .find((t) => t.taskKey === taskKey);
}

/**
 * Get the section that contains a given task key
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

/**
 * Check if a vault section can be marked "not applicable".
 * Returns true for all sections except contacts (which is universally relevant).
 */
export function isSectionSkippable(sectionId: string): boolean {
  const section = getSection(sectionId);
  return section?.skippable !== false;
}
