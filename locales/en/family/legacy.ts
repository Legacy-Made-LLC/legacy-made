/**
 * Family Perspective (Present Tense) - Legacy Messages Translations (en)
 *
 * Text content from the family's perspective (they/their, person is alive).
 */

import type { Translations } from "../../types";

export const familyLegacy: Translations["legacy"] = {
  people: {
    title: "Messages to People",
    description: "Personal messages they\u2019ve recorded for loved ones",
    tasks: {
      people: {
        title: "Messages to People",
        description: "Video or written messages for specific loved ones",
        guidance:
          "These are personal messages they\u2019ve recorded for the people they care about.",
      },
    },
  },
  story: {
    title: "Their Story",
    description: "Who they are \u2014 in their own words",
    tasks: {
      story: {
        title: "Their Story",
        description: "A video or written reflection on their life",
        guidance:
          "This is their story, shared in their own words.",
      },
    },
  },
  future: {
    title: "Future Moments",
    description: "Messages they\u2019ve left for future milestones",
    tasks: {
      future: {
        title: "Future Moments",
        description: "Messages for graduations, weddings, birthdays, and more",
        guidance:
          "These are messages they\u2019ve prepared for future moments they wanted to be part of.",
      },
    },
  },
};
