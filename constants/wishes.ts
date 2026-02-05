/**
 * Wishes Structure - Defines the Wishes & Guidance sections and tasks
 *
 * This is the single source of truth for how the Wishes pillar is organized.
 * The backend stores wishes with a `taskKey` field that maps to tasks defined here.
 *
 * Follows same pattern as vault.ts for consistency.
 *
 * Task key format: "wishes.{sectionId}.{taskId}"
 * Examples: "wishes.carePrefs.whatMatters", "wishes.endOfLife.setting"
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

export const wishesSections: WishesSection[] = [
  // ============================================================================
  // CARE PREFERENCES
  // ============================================================================
  {
    id: "carePrefs",
    title: "Care Preferences",
    description: "What matters when health decisions are being made",
    ionIcon: "heart-outline",
    tasks: [
      {
        id: "whatMatters",
        taskKey: "wishes.carePrefs.whatMatters",
        title: "What Matters Most",
        description: "Your priorities for care",
        triggerText: "Take your time with this",
        guidanceHeading:
          "When it comes to medical care, what matters most to you?",
        guidance:
          "There's no right answer here. This is about helping your family understand what a meaningful life looks like to you.",
        tips: [
          "Think about what makes a day feel worth living — connection? Comfort? Being present?",
          "Some people prioritize length of life, others prioritize quality. Both are valid.",
          "If you're unsure, imagine your family asking: 'What would they want?' What would you hope they'd say?",
        ],
        pacingNote: "These are big questions. It's okay to come back later.",
      },
      {
        id: "qualityOfLife",
        taskKey: "wishes.carePrefs.qualityOfLife",
        title: "Quality of Life",
        description: "When to shift focus",
        triggerText:
          "Are there circumstances where you'd want to let nature take its course?",
        guidanceHeading:
          "Are there circumstances where you'd want to let nature take its course?",
        guidance:
          "This isn't about giving up — it's about giving your family clarity during an impossible time.",
        tips: [
          "Without your guidance, families often feel guilty no matter what they decide. Your words can lift that weight.",
          "You're not making a medical decision right now. You're sharing values that can help guide decisions later.",
          "It's okay to be uncertain. Even partial guidance helps more than silence.",
        ],
      },
      {
        id: "comfortVsTreatment",
        taskKey: "wishes.carePrefs.comfortVsTreatment",
        title: "Comfort vs Treatment",
        description: "Pain, alertness, dignity",
        triggerText: "How should comfort and treatment be balanced?",
        guidanceHeading: "How should comfort and treatment be balanced?",
        guidance:
          "There's no wrong answer. Some people want every possible treatment; others prioritize peace and comfort. What matters is that your family knows what you'd want.",
        tips: [
          "Think about what matters more to you: more time or better quality time?",
          "Pain medication can make you drowsy — how much does staying alert matter?",
          "It's okay to say 'I trust my care team to decide.' That's a valid preference.",
        ],
      },
      {
        id: "advanceDirective",
        taskKey: "wishes.carePrefs.advanceDirective",
        title: "Advance Directive",
        description: "Formal documents on file",
        triggerText: "Do you have advance directive documents?",
        guidanceHeading:
          "Legal documents give your family the authority to act.",
        guidance:
          "An advance directive or healthcare proxy ensures your wishes are followed — and that someone you trust can make decisions if you can't.",
        tips: [
          "A healthcare proxy names someone to make medical decisions for you.",
          "A living will states what treatments you do or don't want.",
          "Even if you don't have documents yet, naming your preferred decision-maker helps.",
        ],
      },
    ],
  },

  // ============================================================================
  // END-OF-LIFE & AFTER-DEATH
  // ============================================================================
  {
    id: "endOfLife",
    title: "End-of-Life & After-Death",
    description: "What should happen when life is ending or has ended",
    ionIcon: "leaf-outline",
    tasks: [
      {
        id: "setting",
        taskKey: "wishes.endOfLife.setting",
        title: "End-of-Life Setting",
        description: "Home, hospital, hospice",
        triggerText: "Where would you want to be, if you could choose?",
        guidanceHeading: "Where would you want to be, if you could choose?",
        guidance:
          "Home, hospice, hospital — each has trade-offs. Knowing your preference helps your family honor your wishes when decisions need to be made quickly.",
        tips: [
          "Home care is possible for many situations, but requires family support.",
          "Hospice facilities specialize in comfort care and often allow more visitors.",
          "It's okay to say 'wherever makes sense at the time' — flexibility is valid.",
        ],
      },
      {
        id: "afterDeath",
        taskKey: "wishes.endOfLife.afterDeath",
        title: "After-Death Preferences",
        description: "Burial, cremation, other",
        triggerText: "Saying this clearly is a gift to your family.",
        guidanceHeading: "Saying this clearly is a gift to your family.",
        guidance:
          "Burial, cremation, green burial — whatever you choose, stating it removes a heavy decision during an already difficult time.",
        tips: [
          "If you have strong preferences, stating them clearly removes guilt from the decision.",
          "If you're flexible, saying so is equally valuable. 'Whatever brings comfort' is valid.",
          "Pre-arrangements can save your family money and stress, but aren't required.",
        ],
      },
      {
        id: "service",
        taskKey: "wishes.endOfLife.service",
        title: "Service or Remembrance",
        description: "Ceremony and memorial wishes",
        triggerText: "How would you want to be remembered?",
        guidanceHeading: "How would you want to be remembered?",
        guidance:
          "A quiet gathering, a big celebration, or nothing at all — your family will feel more at peace knowing what you'd want.",
        tips: [
          "Think about gatherings you've attended — what felt right, and what didn't?",
          "Some people want celebration; others prefer quiet. Both are meaningful.",
          "If there's a song or reading that matters to you, mention it — your family may not know.",
          "Even 'keep it simple' or 'make it a party' gives helpful direction.",
        ],
      },
      {
        id: "organDonation",
        taskKey: "wishes.endOfLife.organDonation",
        title: "Organ Donation",
        description: "Your wishes on donation",
        triggerText: "One decision could save several lives.",
        guidanceHeading: "One decision could save several lives.",
        guidance:
          "Organ donation happens quickly after death, so your family needs to know your wishes in advance. Stating them clearly removes doubt during an already difficult time.",
        tips: [
          "You can choose to donate everything, specific organs only, or nothing at all.",
          "Being on the registry helps, but your family still needs to know your wishes.",
          "Religious and cultural considerations are respected — share any concerns here.",
        ],
      },
    ],
  },

  // ============================================================================
  // PERSONAL VALUES & GUIDANCE
  // ============================================================================
  {
    id: "values",
    title: "Personal Values & Guidance",
    description: "Emotional and relational guidance for your family",
    ionIcon: "trail-sign-outline",
    tasks: [
      {
        id: "lovedOnesKnow",
        taskKey: "wishes.values.lovedOnesKnow",
        title: "What Loved Ones Should Know",
        description: "Final words and reminders",
        triggerText: "What would you say if you couldn't say it later?",
        guidanceHeading: "What would you say if you couldn't say it later?",
        guidance:
          "These words are a gift — to you for saying them, and to your family for receiving them.",
        tips: [
          "Think about what you'd want someone to say to you if they couldn't say it later.",
          "Gratitude is powerful. Naming specific moments means more than general praise.",
          "If there are apologies or regrets, this is a chance to release them.",
          "You don't have to fill everything. Even one honest paragraph is valuable.",
        ],
      },
      {
        id: "faith",
        taskKey: "wishes.values.faith",
        title: "Faith & Spiritual Preferences",
        description: "Beliefs and traditions",
        triggerText: "What traditions or beliefs should be honored?",
        guidanceHeading: "What traditions or beliefs should be honored?",
        guidance:
          "Whether deeply religious, casually spiritual, or secular — your family will want to respect what matters to you.",
        tips: [
          "Include any rituals, prayers, or customs that should be observed.",
          "If you have a religious leader or congregation, note their contact info.",
          "Even 'no religious service' is helpful guidance.",
        ],
      },
      {
        id: "hardSituations",
        ionIcon: "chatbubble-ellipses-outline",
        taskKey: "wishes.values.hardSituations",
        title: "Hard Situations",
        description: "Guidance for conflict",
        triggerText: "Need help getting started?",
        guidanceHeading:
          "Your words can prevent conflict during an already difficult time.",
        guidance:
          "Grief makes people reactive. If you name who should decide, how to handle disagreements, and what matters most — you give your family a way forward.",
        tips: [
          "Name a primary decision-maker and explain why you trust them.",
          "Acknowledge that people might disagree — and give guidance for how to resolve it.",
          "What matters more than getting things 'right'? Family harmony? Honoring your memory?",
        ],
        pacingNote:
          "This can bring up strong emotions. It's okay to take breaks.",
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
