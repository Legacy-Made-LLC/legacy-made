/**
 * Wishes Structure - Defines the Wishes & Guidance sections and tasks
 *
 * This file contains ONLY structural data (IDs, icons, task relationships).
 * All text content has been moved to locales/ for i18n support.
 */

export interface WishesTask {
  /** Unique identifier within the section */
  id: string;
  /** Key used to identify wishes in the backend (e.g., "wishes.carePrefs.whatMatters") */
  taskKey: string;
  /** Ionicon name (if task-specific) */
  ionIcon?: string;
}

export interface WishesSection {
  /** Unique identifier for the section */
  id: string;
  /** Ionicon name */
  ionIcon: string;
  /** Tasks within this section */
  tasks: WishesTask[];
}

export const wishesSections: WishesSection[] = [
  // ============================================================================
  // CARE PREFERENCES
  // ============================================================================
  {
    id: "carePrefs",
    ionIcon: "heart-outline",
    tasks: [
      {
        id: "whatMatters",
        taskKey: "wishes.carePrefs.whatMatters",
      },
      {
        id: "qualityOfLife",
        taskKey: "wishes.carePrefs.qualityOfLife",
      },
      {
        id: "comfortVsTreatment",
        taskKey: "wishes.carePrefs.comfortVsTreatment",
      },
      {
        id: "advanceDirective",
        taskKey: "wishes.carePrefs.advanceDirective",
      },
    ],
  },

  // ============================================================================
  // END-OF-LIFE & AFTER-DEATH
  // ============================================================================
  {
    id: "endOfLife",
    ionIcon: "leaf-outline",
    tasks: [
      {
        id: "setting",
        taskKey: "wishes.endOfLife.setting",
      },
      {
        id: "afterDeath",
        taskKey: "wishes.endOfLife.afterDeath",
      },
      {
        id: "service",
        taskKey: "wishes.endOfLife.service",
      },
      {
        id: "organDonation",
        taskKey: "wishes.endOfLife.organDonation",
      },
    ],
  },

  // ============================================================================
  // PERSONAL VALUES & GUIDANCE
  // ============================================================================
  {
    id: "values",
    ionIcon: "trail-sign-outline",
    tasks: [
      {
        id: "lovedOnesKnow",
        taskKey: "wishes.values.lovedOnesKnow",
      },
      {
        id: "faith",
        taskKey: "wishes.values.faith",
      },
      {
        id: "hardSituations",
        taskKey: "wishes.values.hardSituations",
        ionIcon: "chatbubble-ellipses-outline",
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
export function getWishesSection(sectionId: string): WishesSection | undefined {
  return wishesSections.find((s) => s.id === sectionId);
}

/**
 * Get a task by section ID and task ID
 */
export function getWishesTask(
  sectionId: string,
  taskId: string,
): WishesTask | undefined {
  return getWishesSection(sectionId)?.tasks.find((t) => t.id === taskId);
}

/**
 * Get a task by its taskKey
 */
export function getWishesTaskByKey(taskKey: string): WishesTask | undefined {
  return wishesSections
    .flatMap((s) => s.tasks)
    .find((t) => t.taskKey === taskKey);
}

/**
 * Get the section that contains a given task key
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

// ============================================================================
// Choice Data for Forms
// ============================================================================

/**
 * Value choices for "What Matters Most" form
 */
export const whatMattersMostValues = [
  {
    id: "comfort",
    label: "Being comfortable and free of pain",
    icon: "leaf-outline",
    description: "Physical comfort is a top priority for me",
  },
  {
    id: "alert",
    label: "Being awake and aware",
    icon: "bulb-outline",
    description: "I want to be present, even if it means some discomfort",
  },
  {
    id: "independent",
    label: "Living independently",
    icon: "home-outline",
    description: "If I can't care for myself, that changes things",
  },
  {
    id: "connected",
    label: "Being with people I love",
    icon: "heart-outline",
    description: "Connection with family and friends matters most",
  },
  {
    id: "dignity",
    label: "Maintaining my dignity",
    icon: "star-outline",
    description: "How I'm seen and treated matters deeply to me",
  },
  {
    id: "fighting",
    label: "Fighting for every moment",
    icon: "fitness-outline",
    description: "I want every possible treatment, no matter what",
  },
  {
    id: "peaceful",
    label: "A peaceful, natural end",
    icon: "flower-outline",
    description: "When it's time, I want to go gently",
  },
  {
    id: "noburden",
    label: "Not being a burden",
    icon: "people-outline",
    description: "I don't want my care to overwhelm my family",
  },
];

/**
 * Condition choices for "Quality of Life" form
 */
export const qualityOfLifeConditions = [
  {
    id: "terminal",
    label: "Diagnosed with a terminal illness",
    icon: "document-text-outline",
    description: "When recovery is no longer possible",
  },
  {
    id: "coma",
    label: "In a persistent coma or vegetative state",
    icon: "moon-outline",
    description: "No awareness of surroundings with little chance of recovery",
  },
  {
    id: "noRecognize",
    label: "Unable to recognize loved ones",
    icon: "heart-dislike-outline",
    description: "When connections that matter most are lost",
  },
  {
    id: "noCommunicate",
    label: "Unable to communicate",
    icon: "volume-mute-outline",
    description: "When I can't express what I'm feeling or thinking",
  },
  {
    id: "fullCare",
    label: "Requiring full-time care for basic needs",
    icon: "bed-outline",
    description: "When I can no longer feed, bathe, or care for myself",
  },
  {
    id: "repeatedHospital",
    label: "In and out of the hospital constantly",
    icon: "medkit-outline",
    description:
      "When treatment feels like it's prolonging suffering, not life",
  },
  {
    id: "noImprove",
    label: "With no realistic chance of improvement",
    icon: "trending-down-outline",
    description: "When medical consensus is that things won't get better",
  },
];

/**
 * Document types for "Advance Directive" form
 */
export const advanceDirectiveDocTypes = [
  "Living Will",
  "Healthcare Power of Attorney",
  "POLST/MOLST",
  "DNR Order",
  "Five Wishes",
  "Other",
];

/**
 * Faith/spiritual tradition options
 */
export const faithTraditions = [
  { value: "christian", label: "Christian" },
  { value: "catholic", label: "Catholic" },
  { value: "jewish", label: "Jewish" },
  { value: "muslim", label: "Muslim" },
  { value: "buddhist", label: "Buddhist" },
  { value: "hindu", label: "Hindu" },
  { value: "spiritual", label: "Spiritual but not religious" },
  { value: "none", label: "No religious affiliation" },
  { value: "other", label: "Other" },
];
