/**
 * Family Perspective - Common UI Translations (en)
 *
 * Common UI strings (buttons, empty states, progress text) from the family's perspective.
 */

import type { Translations } from "../../types";

export const familyCommon: Translations["common"] = {
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
        "They haven't added information about who to contact first yet.",
    },
    people: {
      title: "No people listed",
      description: "They haven't added information about important people yet.",
    },
    financial: {
      title: "No accounts listed",
      description:
        "They haven't added information about financial accounts yet.",
    },
    insurance: {
      title: "No policies listed",
      description:
        "They haven't added information about insurance policies yet.",
    },
    documents: {
      title: "No documents listed",
      description:
        "They haven't added information about important documents yet.",
    },
    property: {
      title: "No property listed",
      description:
        "They haven't added information about property and vehicles yet.",
    },
    pets: {
      title: "No pets listed",
      description: "They haven't added information about pets yet.",
    },
    digital: {
      title: "No accounts listed",
      description: "They haven't added information about digital access yet.",
    },
  },

  progress: {
    notStarted: "Not started",
    itemsAdded: (count: number) =>
      `${count} ${count === 1 ? "item" : "items"} added`,
    completed: "Completed",
  },

  notApplicable: {
    button: "Doesn't apply",
    changeMyMind: "Change back",
    title: "They've marked this as not applicable",
    description: "If things change, they can always come back.",
    marked: "Marked as not applicable",
  },
};
