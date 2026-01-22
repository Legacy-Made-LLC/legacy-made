import Loader from "@/components/ui/Loader";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

export default function RootIndex() {
  const { isSignedIn, isLoaded } = useAuth();
  const { hasCompletedInitialOnboarding, isOnboardingStateLoaded } =
    useOnboardingContext();

  // Wait for Clerk and onboarding state to load before making routing decisions
  if (!isLoaded || !isOnboardingStateLoaded) {
    return <Loader />;
  }

  // If user hasn't completed onboarding, redirect to onboarding
  if (!hasCompletedInitialOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  // After onboarding, check auth status
  if (isSignedIn) {
    return <Redirect href="/(app)" />;
  }

  // User completed onboarding but not signed in, send to auth
  return <Redirect href="/(auth)" />;
}
