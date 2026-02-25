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
  },
  information: {
    description:
      "Their accounts, documents, and contacts \u2014\norganized for when it matters",
  },
  wishes: {
    description:
      "Their values, preferences, and words\nfor those who mattered most",
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
