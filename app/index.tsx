import Loader from "@/components/ui/Loader";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

export default function RootIndex() {
  const { isSignedIn, isLoaded } = useAuth();
  const {
    hasCompletedInitialOnboarding,
    setHasCompletedInitialOnboarding,
    isOnboardingStateLoaded,
  } = useOnboardingContext();

  // Wait for Clerk and onboarding state to load before making routing decisions
  if (!isLoaded || !isOnboardingStateLoaded) {
    return <Loader branded />;
  }

  // If user is already signed in, they've completed onboarding — ensure the
  // flag is set. This covers the case where a user deletes and reinstalls the
  // app: the Clerk token survives in the Keychain but AsyncStorage is cleared,
  // so hasCompletedInitialOnboarding resets to false.
  if (isSignedIn) {
    if (!hasCompletedInitialOnboarding) {
      setHasCompletedInitialOnboarding(true);
    }
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  // If user hasn't completed onboarding, redirect to onboarding
  if (!hasCompletedInitialOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  // User completed onboarding but not signed in, send to auth
  return <Redirect href="/(auth)" />;
}
