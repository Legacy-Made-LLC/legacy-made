/**
 * Family Perspective - Vault Translations (en)
 *
 * Text content for the Information Vault from the family's perspective (they/their).
 */

import type { Translations } from "../../types";

export const familyVault: Translations["vault"] = {
  contacts: {
    title: "Who to Contact First",
    description: "The first calls to make",
    tasks: {
      primary: {
        title: "Primary Contacts",
        description: "The people to call first",
        triggerText: "Who should be contacted first?",
        guidanceHeading: "These are the first calls to make.",
        guidance:
          "These are the people they've chosen to call first in an emergency — people who can help coordinate what comes next.",
        tips: [
          "They picked someone who lives nearby or can travel quickly if needed.",
          "These contacts know they're the primary people to call.",
          "They may have chosen both family members and close friends.",
        ],
      },
      backup: {
        title: "Backup Contacts",
        description: "Attorney, financial advisor, close friends",
        triggerText: "Who else should know right away?",
        guidanceHeading: "Who else should know right away?",
        guidance:
          "These are the other people to contact early — relatives, close friends, or professionals who should know.",
        tips: [
          "This may include their attorney, financial advisor, and accountant.",
          "These are close friends who should hear the news personally, not secondhand.",
          "It may include their employer or business partner if relevant.",
        ],
      },
    },
  },

  people: {
    title: "Important People",
    description: "Everyone else to know about",
    tasks: {
      people: {
        title: "Important People",
        description: "Everyone else to know about",
        triggerText: "Who else mattered in their life?",
        guidanceHeading: "Who else mattered in their life?",
        guidance:
          "Beyond family, there are people who should know — and people they wanted you to know about.",
        tips: [
          "This may include neighbors, coworkers, or community members who mattered to them.",
          "Some people might be waiting to hear from them regularly.",
          "Some people may have their belongings or keys.",
        ],
      },
    },
  },

  finances: {
    title: "Financial Accounts",
    description: "Bank, investment, and retirement accounts",
    tasks: {
      accounts: {
        title: "Financial Accounts",
        description: "Bank, investment, and retirement accounts",
        triggerText: "What accounts are listed?",
        guidanceHeading: "These are the accounts that exist.",
        guidance:
          "They've listed enough information to contact the right institutions and locate these accounts.",
        tips: [
          "This includes checking, savings, and any investment accounts.",
          "Don't forget retirement accounts like 401(k)s and IRAs.",
          "Some accounts may have automatic deposits or withdrawals.",
          "This also includes debts — mortgages, loans, and credit cards.",
        ],
      },
    },
  },

  insurance: {
    title: "Insurance Policies",
    description: "Coverage to know about",
    tasks: {
      policies: {
        title: "Insurance Policies",
        description: "Coverage to know about",
        triggerText: "What policies are included?",
        guidanceHeading: "These are the insurance policies that exist.",
        guidance:
          "Many families miss out on coverage they're entitled to simply because they didn't know about it. These are the policies to claim.",
        tips: [
          "This includes life, health, home, auto, and any umbrella policies.",
          "Some policies may be through their employer.",
          "Policy numbers and agent contact information should be included.",
          "Check for accidental death coverage on credit cards or memberships.",
        ],
      },
    },
  },

  documents: {
    title: "Documents",
    description: "Legal papers and important records",
    tasks: {
      legal: {
        title: "Legal Documents",
        description: "Wills, trusts, and powers of attorney",
        triggerText: "Which documents matter most?",
        guidanceHeading: "These documents provide the authority to act.",
        guidance:
          "They've noted where each document is stored so they can be found quickly when needed.",
        tips: [
          "This includes their will, trust, and any powers of attorney.",
          "Both physical locations and digital copies should be noted.",
          "The executor knows where to find these.",
          "Their attorney may have copies as well.",
        ],
        pacingNote: "Take your time with this information.",
      },
      other: {
        title: "Other Documents",
        description: "Birth certificates, passports, and other records",
        triggerText: "What other records are noted?",
        guidanceHeading: "These are the records that may be needed.",
        guidance:
          "Important personal documents like birth certificates, passports, and Social Security cards are listed here. They've noted where originals are stored.",
        tips: [
          "This includes birth certificates, marriage certificates, and divorce decrees.",
          "Passport and Social Security card locations are noted.",
          "Military records, naturalization papers, or adoption records may be included if relevant.",
        ],
      },
    },
  },

  property: {
    title: "Property & Vehicles",
    description: "Real estate, vehicles, and physical assets",
    tasks: {
      property: {
        title: "Property & Vehicles",
        description: "Real estate, vehicles, and physical assets",
        triggerText: "What property is included?",
        guidanceHeading: "These are the properties and assets that exist.",
        guidance:
          "Properties, vehicles, storage units — if there's a key, a title, or a code, it's noted here.",
        tips: [
          "This includes all real estate, even vacation properties or land.",
          "Titles and deeds locations are noted.",
          "Don't forget storage units, safe deposit boxes, or rental properties.",
          "This includes any vehicles — cars, boats, motorcycles, RVs.",
        ],
      },
    },
  },

  pets: {
    title: "Pets",
    description: "Care instructions for their animal companions",
    tasks: {
      pets: {
        title: "Pets",
        description: "Care instructions for their animal companions",
        triggerText: "How should their pets be cared for?",
        guidanceHeading: "These pets need care and a plan.",
        guidance:
          "Each pet's care needs, veterinarian information, and designated caregiver are listed here. This ensures they're looked after by someone who knows what they need.",
        tips: [
          "Someone has agreed in advance to care for these pets.",
          "Feeding schedules, medications, and special needs are included.",
          "The veterinarian's contact information is noted.",
          "Favorite toys, treats, or routines may be mentioned.",
        ],
        pacingNote: "They cared deeply about these companions.",
      },
    },
  },

  digital: {
    title: "Digital Access",
    description: "How to access their online accounts",
    tasks: {
      email: {
        title: "Email",
        description: "Primary email accounts",
        triggerText: "Why is email access so important?",
        guidanceHeading: "Email is often the key to everything else.",
        guidance:
          "Their email accounts are listed here, especially their primary one. Email is often the key to recovering other accounts, so this is critical information.",
        tips: [
          "Their primary email can reset passwords for most other accounts.",
          "Recovery emails or phone numbers may be noted.",
          "They may have set up a legacy contact if their provider offers it.",
        ],
      },
      passwords: {
        title: "Passwords & Access",
        description: "Password managers and access methods",
        triggerText: "How can access be found?",
        guidanceHeading: "Passwords aren't stored here — but access methods are explained.",
        guidance:
          "They've noted where passwords are stored (password manager, written down, etc.) and how to access them. Actual passwords aren't stored here — just instructions on how to find them.",
        tips: [
          "If they used a password manager, instructions on accessing it are here.",
          "There may be a physical backup like an emergency kit.",
          "They may have shared access with a trusted person already.",
        ],
      },
      devices: {
        title: "Devices",
        description: "Phones, computers, and tablets",
        triggerText: "What devices are noted?",
        guidanceHeading: "Their devices may hold important information.",
        guidance:
          "Their devices and how to access them are listed here. Passcodes or where to find them, and any important data stored locally, are included.",
        tips: [
          "This includes phones, computers, tablets, and any smart home devices.",
          "Passcodes or where to find them securely are noted.",
          "Important files stored only on specific devices may be mentioned.",
        ],
      },
      social: {
        title: "Social Media",
        description: "Social media and online accounts",
        triggerText: "What about their online presence?",
        guidanceHeading: "What should happen to their online presence?",
        guidance:
          "Their social media accounts and any memorialization or legacy contact settings are listed here. They've noted which accounts should be deactivated or preserved.",
        tips: [
          "Many platforms offer memorialization or legacy contact options.",
          "They've noted which accounts they wanted preserved vs. deleted.",
          "This includes subscriptions, streaming services, and online memberships.",
        ],
      },
    },
  },
};
