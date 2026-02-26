/**
 * Owner Perspective - Page-Level Translations (en)
 *
 * Text content for tab pages from the owner's perspective (you/your).
 */

import type { Translations } from "../../types";

export const ownerPages: Translations["pages"] = {
  home: {
    pageTitle: "Your Progress",
    greeting: "You\u2019ve started something meaningful.",
    information: "Accounts, documents, and key contacts \u2014 all in one place.",
    wishes: "Your healthcare values and end-of-life preferences.",
    legacy: "Letters, videos, and memories for the people you love.",
    family: "Share access and keep loved ones in the loop.",
  },
  information: {
    description:
      "Accounts, documents, and contacts \u2014\norganized for when it matters",
  },
  wishes: {
    description:
      "Your values, preferences, and words\nfor those who matter most",
  },
  family: {
    title: "Family Access",
    description: "Choose who can access your\nplan \u2014 and when.",
    trustedContactsHeader: "YOUR TRUSTED CONTACTS",
    sharedWithMeHeader: "SHARED WITH ME",
    emptyTitle: "Share your plan with\nsomeone you trust",
    emptyDescription:
      "Give a family member, friend, or advisor access so they\u2019re never left guessing.",
    emptyButton: "Add Trusted Contact",
    sharedWithMeEmpty:
      "When someone shares their plan with you, it will appear here.",
  },
};
