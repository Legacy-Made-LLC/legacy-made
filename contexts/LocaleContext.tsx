/**
 * Locale Context - Manages i18n and perspective switching
 *
 * Provides translations and perspective switching functionality throughout the app.
 */

import React, { createContext, useContext, useMemo, useState } from "react";

import {
  getTranslations,
  type Locale,
  type Perspective,
  type Translations,
} from "@/locales";

interface LocaleContextValue {
  locale: Locale;
  perspective: Perspective;
  translations: Translations;
  setLocale: (locale: Locale) => void;
  setPerspective: (perspective: Perspective) => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

interface LocaleProviderProps {
  children: React.ReactNode;
  defaultLocale?: Locale;
  defaultPerspective?: Perspective;
}

/**
 * Locale Provider - Wraps the app to provide i18n functionality
 */
export function LocaleProvider({
  children,
  defaultLocale = "en",
  defaultPerspective = "owner",
}: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [perspective, setPerspective] = useState<Perspective>(defaultPerspective);

  const translations = useMemo(
    () => getTranslations(locale, perspective),
    [locale, perspective],
  );

  const value = useMemo(
    () => ({
      locale,
      perspective,
      translations,
      setLocale,
      setPerspective,
    }),
    [locale, perspective, translations],
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
} {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("usePerspective must be used within a LocaleProvider");
  }

  return {
    perspective: context.perspective,
    setPerspective: context.setPerspective,
    isOwner: context.perspective === "owner",
    isFamily: context.perspective === "family",
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
