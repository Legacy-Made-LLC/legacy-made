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
    id: "contacts",
    title: "Who to Contact First",
    description: "The first calls your family should make",
    ionIcon: "call-outline",
    tasks: [
      {
        id: "primary",
        taskKey: "contacts.primary",
        title: "Primary Contacts",
        description: "The people to call first",
        triggerText: "Who should be contacted first?",
        guidanceHeading: "This is usually the first call your family will make.",
        guidance:
          "Choose someone who stays calm under pressure and can help coordinate what comes next.",
        tips: [
          "Pick someone who lives nearby or can travel quickly if needed.",
          "Make sure they know they're your primary contact — don't surprise them.",
          "Consider having both a family member and a close friend.",
        ],
      },
      {
        id: "backup",
        taskKey: "contacts.backup",
        title: "Backup Contacts",
        description: "Attorney, financial advisor, close friends",
        triggerText: "Who else should know right away?",
        guidanceHeading: "Who else should know right away?",
        guidance:
          "These are the other people your family should contact early — relatives, close friends, or professionals.",
        tips: [
          "Include your attorney, financial advisor, and accountant if you have them.",
          "Add close friends who should hear the news personally, not secondhand.",
          "Consider including your employer or business partner if relevant.",
        ],
      },
    ],
  },
  {
    id: "people",
    title: "Important People",
    description: "Everyone else your family should know about",
    ionIcon: "person-outline",
    tasks: [
      {
        id: "people",
        taskKey: "people",
        title: "Important People",
        description: "Everyone else your family should know about",
        triggerText: "Who else matters in your life?",
        guidanceHeading: "Who else matters in your life?",
        guidance:
          "Beyond family, there are people who should know — and people your family should know about.",
        tips: [
          "Think about neighbors, coworkers, or community members who matter to you.",
          "Include anyone who might be waiting to hear from you regularly.",
          "Consider people who might have your belongings or keys.",
        ],
      },
    ],
  },
  {
    id: "finances",
    title: "Financial Accounts",
    description: "Bank, investment, and retirement accounts",
    ionIcon: "cash-outline",
    tasks: [
      {
        id: "accounts",
        taskKey: "financial",
        title: "Financial Accounts",
        description: "Bank, investment, and retirement accounts",
        triggerText: "Wondering what accounts to list?",
        guidanceHeading: "Your family just needs to know these accounts exist.",
        guidance:
          "You don't need full account numbers — just enough for them to contact the right institutions.",
        tips: [
          "Include checking, savings, and any investment accounts.",
          "Don't forget retirement accounts like 401(k)s and IRAs.",
          "Note any accounts with automatic deposits or withdrawals.",
          "Include debts too — mortgages, loans, and credit cards.",
        ],
      },
    ],
  },
  {
    id: "insurance",
    title: "Insurance Policies",
    description: "Coverage your family should know about",
    ionIcon: "shield-outline",
    tasks: [
      {
        id: "policies",
        taskKey: "insurance",
        title: "Insurance Policies",
        description: "Coverage your family should know about",
        triggerText: "What policies should you include?",
        guidanceHeading: "Insurance benefits only help if your family knows they exist.",
        guidance:
          "Many families miss out on coverage they're entitled to simply because they didn't know about it.",
        tips: [
          "Include life, health, home, auto, and any umbrella policies.",
          "Note if any policies are through your employer.",
          "Include policy numbers and agent contact information.",
          "Check for accidental death coverage on credit cards or memberships.",
        ],
      },
    ],
  },
  {
    id: "documents",
    title: "Documents",
    description: "Legal papers and important records",
    ionIcon: "document-text-outline",
    tasks: [
      {
        id: "legal",
        taskKey: "documents.legal",
        title: "Legal Documents",
        description: "Wills, trusts, and powers of attorney",
        triggerText: "Which documents matter most?",
        guidanceHeading: "These documents give your family the authority to act.",
        guidance:
          "When the time comes, they'll need to find these quickly. Note where each one is stored.",
        tips: [
          "Include your will, trust, and any powers of attorney.",
          "Note both the physical location and any digital copies.",
          "Make sure your executor knows where to find these.",
          "Consider giving your attorney a copy as well.",
        ],
        pacingNote: "These can be emotional to think about. It's okay to take breaks.",
      },
      {
        id: "other",
        taskKey: "documents.other",
        title: "Other Documents",
        description: "Birth certificates, passports, and other records",
        triggerText: "What other records should you note?",
        guidanceHeading: "These are the records your family may need.",
        guidance:
          "Record important personal documents like birth certificates, passports, and Social Security cards. Note where originals are stored.",
        tips: [
          "Include birth certificates, marriage certificates, and divorce decrees.",
          "Note passport and Social Security card locations.",
          "Add military records, naturalization papers, or adoption records if relevant.",
        ],
      },
    ],
  },
  {
    id: "property",
    title: "Property & Vehicles",
    description: "Real estate, vehicles, and physical assets",
    ionIcon: "home-outline",
    tasks: [
      {
        id: "property",
        taskKey: "property",
        title: "Property & Vehicles",
        description: "Real estate, vehicles, and physical assets",
        triggerText: "What property should you include?",
        guidanceHeading: "Your family won't know what exists unless you tell them.",
        guidance:
          "Properties, vehicles, storage units — if there's a key, a title, or a code, note it here.",
        tips: [
          "Include all real estate, even vacation properties or land.",
          "Note where titles and deeds are stored.",
          "Don't forget storage units, safe deposit boxes, or rental properties.",
          "Include any vehicles — cars, boats, motorcycles, RVs.",
        ],
      },
    ],
  },
  {
    id: "pets",
    title: "Pets",
    description: "Care instructions for your animal companions",
    ionIcon: "paw-outline",
    tasks: [
      {
        id: "pets",
        taskKey: "pets",
        title: "Pets",
        description: "Care instructions for your animal companions",
        triggerText: "How can you plan for your pets?",
        guidanceHeading: "Your pets depend on you — and on a plan.",
        guidance:
          "Include each pet's care needs, veterinarian information, and who has agreed to care for them. This ensures they're looked after by someone who knows what they need.",
        tips: [
          "Ask someone in advance if they'd be willing to care for your pets.",
          "Include feeding schedules, medications, and special needs.",
          "Note your veterinarian's contact information.",
          "Consider including favorite toys, treats, or routines.",
        ],
        pacingNote: "This is a loving thing to do for your companions.",
      },
    ],
  },
  {
    id: "digital",
    title: "Digital Access",
    description: "How to access your online accounts",
    ionIcon: "laptop-outline",
    tasks: [
      {
        id: "email",
        taskKey: "digital.email",
        title: "Email",
        description: "Primary email accounts",
        triggerText: "Why is email access so important?",
        guidanceHeading: "Email is often the key to everything else.",
        guidance:
          "List your email accounts, especially your primary one. Email is often the key to recovering other accounts, so this is critical information.",
        tips: [
          "Your primary email can reset passwords for most other accounts.",
          "Note any recovery emails or phone numbers set up.",
          "Consider setting up a legacy contact if your provider offers it.",
        ],
      },
      {
        id: "passwords",
        taskKey: "digital.passwords",
        title: "Passwords & Access",
        description: "Password managers and access methods",
        triggerText: "How should you share access info?",
        guidanceHeading: "Don't store passwords here — just explain how to find them.",
        guidance:
          "Note where passwords are stored (password manager, written down, etc.) and how to access them. Don't store actual passwords here — just explain how to find them.",
        tips: [
          "If you use a password manager, explain how to access it.",
          "Note if there's a physical backup like an emergency kit.",
          "Consider sharing access with a trusted person now.",
        ],
      },
      {
        id: "devices",
        taskKey: "digital.devices",
        title: "Devices",
        description: "Phones, computers, and tablets",
        triggerText: "What devices should you note?",
        guidanceHeading: "Your devices may hold important information.",
        guidance:
          "List your devices and how to access them. Include passcodes or where to find them, and any important data stored locally.",
        tips: [
          "Include phones, computers, tablets, and any smart home devices.",
          "Note passcodes or where to find them securely.",
          "Mention any important files stored only on specific devices.",
        ],
      },
      {
        id: "social",
        taskKey: "digital.social",
        title: "Social Media",
        description: "Social media and online accounts",
        triggerText: "What about your online presence?",
        guidanceHeading: "What should happen to your online presence?",
        guidance:
          "List social media accounts and any memorialization or legacy contact settings you've configured. Note any accounts you'd want deactivated or preserved.",
        tips: [
          "Many platforms offer memorialization or legacy contact options.",
          "Note which accounts you'd want preserved vs. deleted.",
          "Include subscriptions, streaming services, and online memberships.",
        ],
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
