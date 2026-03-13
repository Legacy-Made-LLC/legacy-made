/**
 * Family Perspective (Present Tense) - Page-Level Translations (en)
 *
 * Text content for tab pages from the family's perspective (they/their, person is alive).
 */

import type { Translations } from "../../types";

export const familyPages: Translations["pages"] = {
  home: {
    pageTitle: "Their Progress",
    greeting: "You\u2019re helping preserve what matters.",
    information:
      "Their accounts, documents, and key contacts \u2014 all in one place.",
    wishes: "Their healthcare values and end-of-life preferences.",
    legacy: "Letters, videos, and memories for the people they love.",
    family: "Shared access and keeping loved ones in the loop.",
    pillarActions: {
      information: "Their accounts and contacts",
      wishes: "Their wishes and values",
      legacy: "Their messages and memories",
      family: "Shared access and trusted contacts",
      comingSoon: "Coming soon",
    },
    quickActions: {
      contacts: "View contacts",
      people: "View people",
      finances: "View accounts",
      insurance: "View policies",
      documents: "View documents",
      property: "View property",
      pets: "View pets",
      digital: "View digital access",
      carePrefs: "View care preferences",
      endOfLife: "View end-of-life wishes",
      values: "View their values",
      legacyPeople: "View their messages",
      legacyStory: "View their story",
      legacyFuture: "View future moments",
      addTrustedContact: "Share your plan",
    },
    guidance: {
      allComplete: {
        title: "Everything is covered",
        body: "Their plan is complete.",
        cta: "Review their plan",
      },
      vaultComplete: {
        title: "Their information is organized",
        body: "Their wishes and values are also available.",
        cta: "View Wishes",
      },
      wishesComplete: {
        title: "Their wishes are recorded",
        body: "Their accounts and contacts are also available.",
        cta: "View Information",
      },
      legacyComplete: {
        title: "Their messages are ready",
        body: "They left messages and memories for loved ones.",
        cta: "View their messages",
      },
      makingProgress: {
        title: "Good progress so far",
        body: "They\u2019ve been organizing important information.",
        cta: "See details",
      },
      backupKey: {
        title: "Protect your data",
        body: "Back up your encryption key so you never lose access to your information.",
        cta: "Back up key",
        secondaryCta: "Not now",
      },
      addTrustedContact: {
        title: "Share their plan with someone they trust",
        body: "Adding a trusted contact means the right person can access their plan when it matters most.",
        cta: "Add Trusted Contact",
        secondaryCta: "Not now",
      },
      continue: {
        title: "Recent activity",
        body: "They were working on {sectionTitle}",
        cta: "View",
      },
      startedVault: {
        title: "Information is in progress",
        body: "They\u2019ve started organizing their information.",
        cta: "View Wishes",
      },
      startedWishes: {
        title: "Wishes are in progress",
        body: "They\u2019ve started recording their wishes.",
        cta: "View Information",
      },
      startedLegacy: {
        title: "Messages are in progress",
        body: "They\u2019ve started leaving messages for loved ones.",
        cta: "View Messages",
      },
      brandNew: {
        title: "Just getting started",
        body: "They haven\u2019t added any information yet. Check back later.",
        cta: "View contacts",
      },
      sharedPlan: {
        title: "{name}\u2019s Progress",
        body: "Here is what they\u2019ve organized so far.",
      },
    },
  },
  information: {
    description:
      "Their accounts, documents, and contacts \u2014\norganized for when it matters",
  },
  wishes: {
    description:
      "Their values, preferences, and words\nfor those who matter most",
  },
  legacy: {
    description:
      "Letters, videos, and memories\nfor the people they love",
  },
  family: {
    title: "Family Access",
    description:
      "See who has access to this\nplan and manage shared plans.",
    trustedContactsHeader: "TRUSTED CONTACTS",
    sharedWithMeHeader: "SHARED WITH ME",
    emptyTitle: "No trusted contacts yet",
    emptyDescription:
      "Trusted contacts will appear here once they\u2019re added to this plan.",
    emptyButton: "Add Trusted Contact",
    sharedWithMeEmpty:
      "When someone shares their plan with you, it will appear here.",
  },
};
