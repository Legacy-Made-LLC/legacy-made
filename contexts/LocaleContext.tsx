/**
 * Locale Context - Manages i18n and perspective switching
 *
 * Provides translations and perspective switching functionality throughout the app.
 * Supports family tense (present/past) for when the plan owner is alive vs. has passed.
 */

import React, { createContext, useContext, useMemo, useState } from "react";

import {
  getTranslations,
  type FamilyTense,
  type Locale,
  type Perspective,
  type Translations,
} from "@/locales";

interface LocaleContextValue {
  locale: Locale;
  perspective: Perspective;
  familyTense: FamilyTense;
  translations: Translations;
  setLocale: (locale: Locale) => void;
  setPerspective: (perspective: Perspective) => void;
  setFamilyTense: (tense: FamilyTense) => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

interface LocaleProviderProps {
  children: React.ReactNode;
  defaultLocale?: Locale;
  defaultPerspective?: Perspective;
  defaultFamilyTense?: FamilyTense;
}

/**
 * Locale Provider - Wraps the app to provide i18n functionality
 */
export function LocaleProvider({
  children,
  defaultLocale = "en",
  defaultPerspective = "owner",
  defaultFamilyTense = "present",
}: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [perspective, setPerspective] = useState<Perspective>(defaultPerspective);
  const [familyTense, setFamilyTense] = useState<FamilyTense>(defaultFamilyTense);

  const translations = useMemo(
    () => getTranslations(locale, perspective, familyTense),
    [locale, perspective, familyTense],
  );

  const value = useMemo(
    () => ({
      locale,
      perspective,
      familyTense,
      translations,
      setLocale,
      setPerspective,
      setFamilyTense,
    }),
    [locale, perspective, familyTense, translations],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

/**
 * Hook to access translations and locale settings
 */
export function useTranslations(): Translations {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useTranslations must be used within a LocaleProvider");
  }
  return context.translations;
}

/**
 * Hook to access and control perspective
 */
export function usePerspective(): {
  perspective: Perspective;
  setPerspective: (perspective: Perspective) => void;
  isOwner: boolean;
  isFamily: boolean;
  familyTense: FamilyTense;
  setFamilyTense: (tense: FamilyTense) => void;
  isFamilyPresent: boolean;
  isFamilyPast: boolean;
} {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("usePerspective must be used within a LocaleProvider");
  }

  const isFamily = context.perspective === "family";

  return {
    perspective: context.perspective,
    setPerspective: context.setPerspective,
    isOwner: context.perspective === "owner",
    isFamily,
    familyTense: context.familyTense,
    setFamilyTense: context.setFamilyTense,
    isFamilyPresent: isFamily && context.familyTense === "present",
    isFamilyPast: isFamily && context.familyTense === "past",
  };
}

/**
 * Hook to access locale and locale settings
 */
export function useLocale(): {
  locale: Locale;
  setLocale: (locale: Locale) => void;
} {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }

  return {
    locale: context.locale,
    setLocale: context.setLocale,
  };
}
