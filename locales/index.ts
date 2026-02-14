/**
 * Locales - Main i18n Infrastructure
 *
 * Provides translation loading and type-safe access to translated content.
 */

import type { Locale, Perspective, Translations } from "./types";
import { familyTranslations, ownerTranslations } from "./en";

/**
 * Get translations for a specific locale and perspective
 */
export function getTranslations(
  locale: Locale,
  perspective: Perspective,
): Translations {
  // Currently only English is supported
  if (locale !== "en") {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  return perspective === "owner" ? ownerTranslations : familyTranslations;
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

// Re-export types for convenience
export type { Locale, Perspective, Translations } from "./types";
