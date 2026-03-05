import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  undefined
);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  // Onboarding completion state (persisted to AsyncStorage)
  const [hasCompletedInitialOnboarding, setHasCompletedInitialOnboardingState] =
    useState(false);
  const [isOnboardingStateLoaded, setIsOnboardingStateLoaded] = useState(false);
  const [pendingContact, setPendingContact] = useState<PendingContact | null>(
    null
  );

  // Load persisted onboarding state on mount
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        if (storedValue === "true") {
          setHasCompletedInitialOnboardingState(true);
        }
      } catch (error) {
        logger.error("Failed to load onboarding state", error);
      } finally {
        setIsOnboardingStateLoaded(true);
      }
    };

    loadOnboardingState();
  }, []);

  // Wrapper function that persists to AsyncStorage
  const setHasCompletedInitialOnboarding = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(
        ONBOARDING_COMPLETE_KEY,
        value ? "true" : "false"
      );
      setHasCompletedInitialOnboardingState(value);
    } catch (error) {
      logger.error("Failed to save onboarding state", error);
      // Still update state even if persistence fails
      setHasCompletedInitialOnboardingState(value);
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
        isOnboardingStateLoaded,
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
      "useOnboardingContext must be used within an OnboardingProvider"
    );
  }
  return context;
}
