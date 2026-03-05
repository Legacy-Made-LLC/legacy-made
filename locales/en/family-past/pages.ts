/**
 * Family Perspective (Past Tense) - Page-Level Translations (en)
 *
 * Text content for tab pages from the family's perspective (they/their, person has passed).
 */

import type { Translations } from "../../types";

export const familyPastPages: Translations["pages"] = {
  home: {
    pageTitle: "Their Legacy",
    greeting: "Everything they organized is here for you.",
    information:
      "Their accounts, documents, and key contacts \u2014 all in one place.",
    wishes: "Their healthcare values and end-of-life preferences.",
    legacy: "Letters, videos, and memories for the people they loved.",
    family: "Shared access and who was in the loop.",
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
        title: "Everything is here",
        body: "They organized everything for you.",
        cta: "Review their plan",
      },
      vaultComplete: {
        title: "Their information is here",
        body: "Their wishes and values are also available.",
        cta: "View Wishes",
      },
      wishesComplete: {
        title: "Their wishes are here",
        body: "Their accounts and contacts are also available.",
        cta: "View Information",
      },
      legacyComplete: {
        title: "Their messages are here",
        body: "They left messages and memories for the people they loved.",
        cta: "View their messages",
      },
      makingProgress: {
        title: "They made good progress",
        body: "They organized important information for you.",
        cta: "See details",
      },
      addTrustedContact: {
        title: "Share their plan with someone they trusted",
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
        title: "Some information is here",
        body: "They started organizing their information.",
        cta: "View Wishes",
      },
      startedWishes: {
        title: "Some wishes are here",
        body: "They started recording their wishes.",
        cta: "View Information",
      },
      startedLegacy: {
        title: "Some messages are here",
        body: "They started leaving messages for loved ones.",
        cta: "View Messages",
      },
      brandNew: {
        title: "Nothing was added",
        body: "They hadn\u2019t started organizing their information yet.",
        cta: "View contacts",
      },
      sharedPlan: {
        title: "{name}\u2019s Legacy",
        body: "Everything they organized is here.",
      },
    },
  },
  information: {
    description:
      "Their accounts, documents, and contacts \u2014\norganized for when it matters",
  },
  wishes: {
    description:
      "Their values, preferences, and words\nfor those who mattered most",
  },
  legacy: {
    description:
      "Letters, videos, and memories\nfor the people they loved",
  },
  family: {
    title: "Family Access",
    description:
      "See who has access to this\nplan and manage shared plans.",
    trustedContactsHeader: "TRUSTED CONTACTS",
    sharedWithMeHeader: "SHARED WITH ME",
    emptyTitle: "No trusted contacts were added",
    emptyDescription:
      "They didn\u2019t add any trusted contacts to this plan.",
    emptyButton: "Add Trusted Contact",
    sharedWithMeEmpty:
      "When someone shares their plan with you, it will appear here.",
  },
};
