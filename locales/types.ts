/**
 * i18n Types - Type definitions for internationalization
 *
 * This file defines the structure of translations and ensures type safety
 * across all locale files.
 */

export type Perspective = "owner" | "family";
export type FamilyTense = "present" | "past";
export type Locale = "en"; // Add 'es' | 'fr' | etc. later

/**
 * Task text that can be translated for different perspectives
 */
export interface TaskText {
  title: string;
  description: string;
  triggerText?: string;
  guidanceHeading?: string;
  guidance: string;
  tips?: string[];
  pacingNote?: string;
}

/**
 * Section text that can be translated for different perspectives
 */
export interface SectionText {
  title: string;
  description: string;
  tasks: Record<string, TaskText>;
}

/**
 * Complete translation structure for all content
 */
export interface Translations {
  vault: {
    contacts: SectionText;
    people: SectionText;
    finances: SectionText;
    insurance: SectionText;
    documents: SectionText;
    property: SectionText;
    pets: SectionText;
    digital: SectionText;
  };
  wishes: {
    carePrefs: SectionText;
    endOfLife: SectionText;
    values: SectionText;
  };
  pages: {
    home: {
      pageTitle: string;
      greeting: string;
      information: string;
      wishes: string;
      legacy: string;
      family: string;
    };
    information: {
      description: string;
    };
    wishes: {
      description: string;
    };
    family: {
      title: string;
      description: string;
      trustedContactsHeader: string;
      sharedWithMeHeader: string;
      emptyTitle: string;
      emptyDescription: string;
      emptyButton: string;
      sharedWithMeEmpty: string;
    };
  };
  common: {
    buttons: {
      save: string;
      delete: string;
      cancel: string;
      markComplete: string;
      markIncomplete: string;
      comeBackLater: string;
      addContact: string;
      addAccount: string;
      addPolicy: string;
      addDocument: string;
      addProperty: string;
      addPet: string;
      addAccount_digital: string;
    };
    emptyStates: {
      contacts: { title: string; description: string };
      people: { title: string; description: string };
      financial: { title: string; description: string };
      insurance: { title: string; description: string };
      documents: { title: string; description: string };
      property: { title: string; description: string };
      pets: { title: string; description: string };
      digital: { title: string; description: string };
    };
    progress: {
      notStarted: string;
      itemsAdded: (count: number) => string;
      completed: string;
    };
  };
}
