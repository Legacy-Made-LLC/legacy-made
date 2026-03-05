/**
 * Owner Perspective - Page-Level Translations (en)
 *
 * Text content for tab pages from the owner's perspective (you/your).
 */

import type { Translations } from "../../types";

export const ownerPages: Translations["pages"] = {
  home: {
    pageTitle: "Your Progress",
    greeting: [
      "One step at a time.",
      "There\u2019s no rush. You\u2019re doing something meaningful.",
      "A little progress today is more than enough.",
      "You\u2019re taking care of the people you love.",
      "Every small step makes a difference.",
      "This can wait until you\u2019re ready. But you\u2019re here.",
      "What matters is that you\u2019ve started.",
    ],
    information:
      "Accounts, documents, and key contacts \u2014 all in one place.",
    wishes: "Your healthcare values and end-of-life preferences.",
    legacy: "Letters, videos, and memories for the people you love.",
    family: "Share access and keep loved ones in the loop.",
    pillarActions: {
      information: "Organize accounts and contacts",
      wishes: "Record your wishes and values",
      legacy: "Leave messages for loved ones",
      family: "Share access with loved ones",
      comingSoon: "Coming soon",
    },
    quickActions: {
      contacts: "Add a contact",
      people: "Add a person",
      finances: "Add an account",
      insurance: "Add a policy",
      documents: "Add a document",
      property: "Add property",
      pets: "Add a pet",
      digital: "Add digital access",
      carePrefs: "Record care preferences",
      endOfLife: "Record end-of-life wishes",
      values: "Record your values",
      legacyPeople: "Write a message",
      legacyStory: "Tell your story",
      legacyFuture: "Record a future moment",
      addTrustedContact: "Share your plan",
    },
    guidance: {
      allComplete: {
        title: "You\u2019ve covered everything",
        body: "Your plan is complete. Your loved ones will never be left guessing.",
        cta: "Review your plan",
      },
      vaultComplete: {
        title: "Your information is organized",
        body: "Ready to record your wishes and values?",
        cta: "Explore Wishes",
      },
      wishesComplete: {
        title: "Your wishes are recorded",
        body: "Want to make sure your accounts and contacts are organized too?",
        cta: "Explore Information",
      },
      legacyComplete: {
        title: "Your messages are ready",
        body: "The people you love will hear from you when it matters most. Ready to organize the rest?",
        cta: "Keep going",
      },
      makingProgress: {
        title: "You\u2019re making real progress",
        body: "Every section you complete is one less thing your family has to figure out.",
        cta: "Keep going",
      },
      addTrustedContact: {
        title: "Share your plan with someone you trust",
        body: "Adding a trusted contact means the right person can access your plan when it matters most.",
        cta: "Add Trusted Contact",
        secondaryCta: "Not now",
      },
      continue: {
        title: "Continue where you left off",
        body: "You were working on {sectionTitle}",
        cta: "Continue",
      },
      startedVault: {
        title: "Good start on your information",
        body: "When you\u2019re ready, your wishes and values are here too.",
        cta: "Explore Wishes",
      },
      startedWishes: {
        title: "Your wishes are taking shape",
        body: "Adding your accounts and contacts helps complete the picture.",
        cta: "Explore Information",
      },
      startedLegacy: {
        title: "Your messages are taking shape",
        body: "Adding your accounts and contacts helps complete the picture.",
        cta: "Explore Information",
      },
      brandNew: {
        title: "A good place to start",
        body: "Most people begin by adding a key contact or a financial account. There\u2019s no wrong place to start.",
        cta: "Start with contacts",
      },
      sharedPlan: {
        title: "{name}\u2019s Progress",
        body: "Here is what they\u2019ve organized so far.",
      },
    },
  },
  information: {
    description:
      "Accounts, documents, and contacts \u2014\norganized for when it matters",
  },
  wishes: {
    description:
      "Your values, preferences, and words\nfor those who matter most",
  },
  legacy: {
    description: "Letters, videos, and memories\nfor the people you love",
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
