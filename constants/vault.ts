/**
 * Vault Structure - Defines the Information Vault sections and tasks
 *
 * This is the single source of truth for how the vault is organized.
 * The backend stores entries with a `taskKey` field that maps to tasks defined here.
 *
 * Task key format:
 * - Single-task sections: "financial", "insurance", etc. (no dot)
 * - Multi-task sections: "contacts.primary", "contacts.backup" (with dot)
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
  /** Longer guidance text shown on the task screen */
  guidance: string;
}

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

export const vaultSections: VaultSection[] = [
  {
    id: 'contacts',
    title: 'Who to Contact First',
    description: 'The first calls your family should make',
    ionIcon: 'call-outline',
    tasks: [
      {
        id: 'primary',
        taskKey: 'contacts.primary',
        title: 'Primary Contacts',
        description: 'The people to call first',
        guidance:
          'Start with one primary contact — the person who should be called first. This is typically a spouse, sibling, or close friend who can help coordinate everything else.',
      },
      {
        id: 'backup',
        taskKey: 'contacts.backup',
        title: 'Backup Contacts',
        description: 'Attorney, financial advisor, close friends',
        guidance:
          'Add backup contacts like your attorney, financial advisor, or close friends who can help if primary contacts are unavailable.',
      },
    ],
  },
  {
    id: 'people',
    title: 'Important People',
    description: 'Everyone else your family should know about',
    ionIcon: 'person-outline',
    tasks: [
      {
        id: 'people',
        taskKey: 'people',
        title: 'Important People',
        description: 'Everyone else your family should know about',
        guidance:
          'Add other important people like neighbors, friends, employers, or anyone else who should be notified. These are people who matter but may not need to be called immediately.',
      },
    ],
  },
  {
    id: 'finances',
    title: 'Financial Accounts',
    description: 'Bank, investment, and retirement accounts',
    ionIcon: 'cash-outline',
    tasks: [
      {
        id: 'accounts',
        taskKey: 'financial',
        title: 'Financial Accounts',
        description: 'Bank, investment, and retirement accounts',
        guidance:
          "List your bank accounts, investments, and any debts. You don't need account numbers — just enough detail so your family knows where to look.",
      },
    ],
  },
  {
    id: 'insurance',
    title: 'Insurance Policies',
    description: 'Coverage your family should know about',
    ionIcon: 'shield-outline',
    tasks: [
      {
        id: 'policies',
        taskKey: 'insurance',
        title: 'Insurance Policies',
        description: 'Coverage your family should know about',
        guidance:
          'Include life insurance first, then health, home, and auto policies. Note the provider and policy number so claims can be filed.',
      },
    ],
  },
  {
    id: 'documents',
    title: 'Legal Documents',
    description: 'Wills, trusts, and important papers',
    ionIcon: 'document-text-outline',
    tasks: [
      {
        id: 'documents',
        taskKey: 'documents',
        title: 'Legal Documents',
        description: 'Wills, trusts, and important papers',
        guidance:
          'Record where your will, trust, and power of attorney documents are stored. Include who has copies and how to access them.',
      },
    ],
  },
  {
    id: 'property',
    title: 'Property & Vehicles',
    description: 'Real estate, vehicles, and physical assets',
    ionIcon: 'home-outline',
    tasks: [
      {
        id: 'property',
        taskKey: 'property',
        title: 'Property & Vehicles',
        description: 'Real estate, vehicles, and physical assets',
        guidance:
          "Think about what would need attention if you weren't here — property, vehicles, or recurring obligations that someone would need to handle.",
      },
    ],
  },
  {
    id: 'pets',
    title: 'Pets',
    description: 'Care instructions for your animal companions',
    ionIcon: 'paw-outline',
    tasks: [
      {
        id: 'pets',
        taskKey: 'pets',
        title: 'Pets',
        description: 'Care instructions for your animal companions',
        guidance:
          "Include each pet's care needs, veterinarian information, and who has agreed to care for them. This ensures they're looked after by someone who knows what they need.",
      },
    ],
  },
  {
    id: 'digital',
    title: 'Digital Access',
    description: 'How to access your online accounts',
    ionIcon: 'laptop-outline',
    tasks: [
      {
        id: 'accounts',
        taskKey: 'digital',
        title: 'Digital Access',
        description: 'How to access your online accounts',
        guidance:
          "List your important digital accounts and how to access them. Focus on critical accounts like email and password managers first. Don't store passwords here — just note where they can be found.",
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
export function getTask(sectionId: string, taskId: string): VaultTask | undefined {
  return getSection(sectionId)?.tasks.find((t) => t.id === taskId);
}

/**
 * Get a task by its taskKey
 */
export function getTaskByKey(taskKey: string): VaultTask | undefined {
  return vaultSections.flatMap((s) => s.tasks).find((t) => t.taskKey === taskKey);
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
