/**
 * Owner Perspective - Common UI Translations (en)
 *
 * Common UI strings (buttons, empty states, progress text) from the owner's perspective.
 */

import type { Translations } from "../../types";

export const ownerCommon: Translations["common"] = {
  buttons: {
    save: "Save",
    delete: "Delete",
    cancel: "Cancel",
    markComplete: "Mark Complete",
    markIncomplete: "Mark Incomplete",
    comeBackLater: "I'll Come Back Later",
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
      title: "No contacts added yet",
      description:
        "Add the people to contact first in an emergency.",
    },
    people: {
      title: "No people added yet",
      description:
        "Add the important people in your life that those closest to you should know about.",
    },
    financial: {
      title: "No accounts added yet",
      description:
        "Add your bank accounts, investments, and other financial accounts.",
    },
    insurance: {
      title: "No policies added yet",
      description:
        "Add your insurance policies so others know what coverage exists.",
    },
    documents: {
      title: "No documents added yet",
      description:
        "Add important documents and note where others can find them.",
    },
    property: {
      title: "No property added yet",
      description:
        "Add your real estate, vehicles, and other physical assets.",
    },
    pets: {
      title: "No pets added yet",
      description:
        "Add your pets and include care instructions for whoever will look after them.",
    },
    digital: {
      title: "No accounts added yet",
      description:
        "Add digital accounts and explain how others can access them.",
    },
  },

  progress: {
    notStarted: "Not started",
    itemsAdded: (count: number) =>
      `${count} ${count === 1 ? "item" : "items"} added`,
    completed: "Completed",
  },

  notApplicable: {
    button: "Doesn't apply to me",
    changeMyMind: "Undo",
    title: "You've marked this as not applicable",
    description: "If things change, you can always come back.",
    marked: "Marked as not applicable",
  },
};
