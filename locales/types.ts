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
  legacy: {
    people: SectionText;
    story: SectionText;
    future: SectionText;
  };
  pages: {
    home: {
      pageTitle: string;
      greeting: string | string[];
      information: string;
      wishes: string;
      legacy: string;
      family: string;
      /** Action-oriented short descriptions for pillar cards */
      pillarActions: {
        information: string;
        wishes: string;
        legacy: string;
        family: string;
        comingSoon: string;
      };
      /** Action-oriented labels for quick action pills */
      quickActions: {
        contacts: string;
        people: string;
        finances: string;
        insurance: string;
        documents: string;
        property: string;
        pets: string;
        digital: string;
        carePrefs: string;
        endOfLife: string;
        values: string;
        legacyPeople: string;
        legacyStory: string;
        legacyFuture: string;
        addTrustedContact: string;
      };
      /** Adaptive guidance section strings */
      guidance: {
        allComplete: { title: string; body: string; cta: string };
        vaultComplete: { title: string; body: string; cta: string };
        wishesComplete: { title: string; body: string; cta: string };
        legacyComplete: { title: string; body: string; cta: string };
        makingProgress: { title: string; body: string; cta: string };
        addTrustedContact: {
          title: string;
          body: string;
          cta: string;
          secondaryCta: string;
        };
        continue: { title: string; body: string; cta: string };
        startedVault: { title: string; body: string; cta: string };
        startedWishes: { title: string; body: string; cta: string };
        startedLegacy: { title: string; body: string; cta: string };
        brandNew: { title: string; body: string; cta: string };
        sharedPlan: { title: string; body: string };
      };
    };
    information: {
      description: string;
    };
    wishes: {
      description: string;
    };
    legacy: {
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
    notApplicable: {
      /** "Doesn't apply to me" */
      button: string;
      /** "Change my mind" */
      changeMyMind: string;
      /** "You've marked this as not applicable" */
      title: string;
      /** "If things change, you can always come back." */
      description: string;
      /** "Marked as not applicable" */
      marked: string;
    };
  };
}
