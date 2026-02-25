/**
 * Locales - Main i18n Infrastructure
 *
 * Provides translation loading and type-safe access to translated content.
 */

import type { FamilyTense, Locale, Perspective, Translations } from "./types";
import {
  familyPastTranslations,
  familyTranslations,
  ownerTranslations,
} from "./en";

/**
 * Get translations for a specific locale, perspective, and family tense
 */
export function getTranslations(
  locale: Locale,
  perspective: Perspective,
  familyTense: FamilyTense = "present",
): Translations {
  // Currently only English is supported
  if (locale !== "en") {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  if (perspective === "owner") {
    return ownerTranslations;
  }

  return familyTense === "past" ? familyPastTranslations : familyTranslations;
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): Locale[] {
  return ["en"];
}

/**
 * Get all available perspectives
 */
export function getAvailablePerspectives(): Perspective[] {
  return ["owner", "family"];
}

/**
 * Get all available family tenses
 */
export function getAvailableFamilyTenses(): FamilyTense[] {
  return ["present", "past"];
}

// Re-export types for convenience
export type { FamilyTense, Locale, Perspective, Translations } from "./types";
