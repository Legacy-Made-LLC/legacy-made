/**
 * Family Perspective (Past Tense) - Common UI Translations (en)
 *
 * Common UI strings (buttons, empty states, progress text) from the family's perspective
 * when the plan owner has passed (past tense).
 */

import type { Translations } from "../../types";

export const familyPastCommon: Translations["common"] = {
  buttons: {
    save: "Save",
    delete: "Delete",
    cancel: "Cancel",
    markComplete: "Mark Complete",
    markIncomplete: "Mark Incomplete",
    comeBackLater: "Come Back Later",
    addContact: "Add Contact",
    addAccount: "Add Account",
    addPolicy: "Add Policy",
    addDocument: "Add Document",
    addProperty: "Add Property",
    addPet: "Add Pet",
    addAccount_digital: "Add Account",
  },

  emptyStates: {
    contacts: {
      title: "No contacts listed",
      description:
        "They didn't add information about who to contact first.",
    },
    people: {
      title: "No people listed",
      description:
        "They didn't add information about important people.",
    },
    financial: {
      title: "No accounts listed",
      description:
        "They didn't add information about financial accounts.",
    },
    insurance: {
      title: "No policies listed",
      description:
        "They didn't add information about insurance policies.",
    },
    documents: {
      title: "No documents listed",
      description:
        "They didn't add information about important documents.",
    },
    property: {
      title: "No property listed",
      description:
        "They didn't add information about property and vehicles.",
    },
    pets: {
      title: "No pets listed",
      description:
        "They didn't add information about pets.",
    },
    digital: {
      title: "No accounts listed",
      description:
        "They didn't add information about digital access.",
    },
  },

  progress: {
    notStarted: "Not started",
    itemsAdded: (count: number) =>
      `${count} ${count === 1 ? "item" : "items"} added`,
    completed: "Completed",
  },
};
