import React, { createContext, ReactNode, useContext, useState } from "react";

import { useKeyValue, useUserStorageValue } from "@/contexts/KeyValueContext";
import { logger } from "@/lib/logger";

const ONBOARDING_COMPLETE_KEY = "legacy_made_onboarding_complete";

export interface PendingContact {
  firstName: string;
  lastName: string;
  relationship: string;
  phone?: string;
  email?: string;
}

interface OnboardingContextType {
  // Onboarding completion state
  hasCompletedInitialOnboarding: boolean;
  setHasCompletedInitialOnboarding: (value: boolean) => void;
  isOnboardingStateLoaded: boolean;

  // Pending contact for after authentication
  pendingContact: PendingContact | null;
  setPendingContact: (contact: PendingContact | null) => void;
  clearPendingContact: () => void;

  // Contact form state
  contactFirstName: string;
  setContactFirstName: (value: string) => void;
  contactLastName: string;
  setContactLastName: (value: string) => void;
  contactPhone: string;
  setContactPhone: (value: string) => void;
  contactRelationship: string;
  setContactRelationship: (value: string) => void;
  contactEmail: string;
  setContactEmail: (value: string) => void;

  // Account creation state
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  userEmail: string;
  setUserEmail: (value: string) => void;

  // OTP state
  otpCode: string;
  setOtpCode: (value: string) => void;

  // Reset onboarding state (for starting over)
  resetOnboardingState: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [pendingContact, setPendingContact] = useState<PendingContact | null>(
    null,
  );
  const { globalStorage } = useKeyValue();

  const hasCompletedInitialOnboarding = useUserStorageValue({
    key: ONBOARDING_COMPLETE_KEY,
    get: (s) => !!s.getBoolean(ONBOARDING_COMPLETE_KEY),
  });

  // Wrapper function that persists to key-value storage
  const setHasCompletedInitialOnboarding = (value: boolean) => {
    try {
      // Use string "true" instead of boolean true for backwards compatibility.
      globalStorage.set(ONBOARDING_COMPLETE_KEY, value ? "true" : "false");
    } catch (error) {
      logger.error("Failed to save onboarding state", error);
    }
  };

  // Contact form state
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRelationship, setContactRelationship] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Account creation state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // OTP state
  const [otpCode, setOtpCode] = useState("");

  const clearPendingContact = () => {
    setPendingContact(null);
  };

  const resetOnboardingState = () => {
    setContactFirstName("");
    setContactLastName("");
    setContactPhone("");
    setContactRelationship("");
    setContactEmail("");
    setFirstName("");
    setLastName("");
    setUserEmail("");
    setOtpCode("");
  };

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedInitialOnboarding,
        setHasCompletedInitialOnboarding,
        isOnboardingStateLoaded: true,
        pendingContact,
        setPendingContact,
        clearPendingContact,
        contactFirstName,
        setContactFirstName,
        contactLastName,
        setContactLastName,
        contactPhone,
        setContactPhone,
        contactRelationship,
        setContactRelationship,
        contactEmail,
        setContactEmail,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        userEmail,
        setUserEmail,
        otpCode,
        setOtpCode,
        resetOnboardingState,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error(
      "useOnboardingContext must be used within an OnboardingProvider",
    );
  }
  return context;
}
