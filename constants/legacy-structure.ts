/**
 * Legacy Structure - Defines the Legacy Messages sections and tasks
 *
 * This file contains ONLY structural data (IDs, icons, task relationships).
 * All text content lives in locales/ for i18n support.
 *
 * The Legacy Messages pillar is a hybrid:
 * - messages.people and messages.future are list-based (multiple entries per task)
 * - messages.story is singleton (one entry per task, like wishes)
 */

export type LegacyTaskType = "list" | "singleton";

export interface LegacyTask {
  /** Unique identifier within the section */
  id: string;
  /** Key used to identify messages in the backend (e.g., "messages.people") */
  taskKey: string;
  /** Ionicon name (if task-specific) */
  ionIcon?: string;
  /** Whether this task uses list-of-entries or singleton pattern */
  taskType: LegacyTaskType;
}

export interface LegacySection {
  /** Unique identifier for the section */
  id: string;
  /** Ionicon name */
  ionIcon: string;
  /** Tasks within this section */
  tasks: LegacyTask[];
}

export const legacySections: LegacySection[] = [
  // ============================================================================
  // MESSAGES TO PEOPLE
  // ============================================================================
  {
    id: "people",
    ionIcon: "heart-outline",
    tasks: [
      {
        id: "people",
        taskKey: "messages.people",
        taskType: "list",
      },
    ],
  },

  // ============================================================================
  // YOUR STORY
  // ============================================================================
  {
    id: "story",
    ionIcon: "book-outline",
    tasks: [
      {
        id: "story",
        taskKey: "messages.story",
        taskType: "singleton",
      },
    ],
  },

  // ============================================================================
  // FUTURE MOMENTS
  // ============================================================================
  {
    id: "future",
    ionIcon: "gift-outline",
    tasks: [
      {
        id: "future",
        taskKey: "messages.future",
        taskType: "list",
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
export function getLegacySection(sectionId: string): LegacySection | undefined {
  return legacySections.find((s) => s.id === sectionId);
}

/**
 * Get a task by section ID and task ID
 */
export function getLegacyTask(
  sectionId: string,
  taskId: string,
): LegacyTask | undefined {
  return getLegacySection(sectionId)?.tasks.find((t) => t.id === taskId);
}

/**
 * Get a task by its taskKey
 */
export function getLegacyTaskByKey(taskKey: string): LegacyTask | undefined {
  return legacySections
    .flatMap((s) => s.tasks)
    .find((t) => t.taskKey === taskKey);
}

/**
 * Get the section that contains a given task key
 */
export function getLegacySectionByTaskKey(
  taskKey: string,
): LegacySection | undefined {
  return legacySections.find((s) => s.tasks.some((t) => t.taskKey === taskKey));
}

/**
 * Check if a section has multiple tasks (requires task picker screen)
 */
export function legacySectionHasMultipleTasks(sectionId: string): boolean {
  const section = getLegacySection(sectionId);
  return section ? section.tasks.length > 1 : false;
}

/**
 * Get the default task for a section (first task, used for single-task sections)
 */
export function getDefaultLegacyTask(
  sectionId: string,
): LegacyTask | undefined {
  return getLegacySection(sectionId)?.tasks[0];
}

/**
 * Get all task keys (useful for validation)
 */
export function getAllLegacyTaskKeys(): string[] {
  return legacySections.flatMap((s) => s.tasks.map((t) => t.taskKey));
}

/**
 * Get count of tasks in a section
 */
export function getLegacySectionTaskCount(sectionId: string): number {
  return getLegacySection(sectionId)?.tasks.length ?? 0;
}

/**
 * Check if a task is a singleton (like wishes) or list-based (like vault)
 */
export function isLegacyTaskSingleton(taskKey: string): boolean {
  const task = getLegacyTaskByKey(taskKey);
  return task?.taskType === "singleton";
}
