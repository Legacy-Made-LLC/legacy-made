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
  },
  information: {
    description:
      "Their accounts, documents, and contacts \u2014\norganized for when it matters",
  },
  wishes: {
    description:
      "Their values, preferences, and words\nfor those who matter most",
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
