import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import { LibreBaskerville_400Regular, LibreBaskerville_500Medium, LibreBaskerville_600SemiBold, LibreBaskerville_700Bold } from "@expo-google-fonts/libre-baskerville";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { DevMenu } from "@/components/dev/DevMenu";
import Loader from "@/components/ui/Loader";
import { OnboardingProvider } from "@/data/OnboardingContext";
import { PlanProvider } from "@/data/PlanProvider";
import { QueryProvider } from "@/providers/QueryProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    LibreBaskerville_400Regular,
    LibreBaskerville_500Medium,
    LibreBaskerville_600SemiBold,
    LibreBaskerville_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <Loader />
    );
  }

  return (
    <OnboardingProvider>
      <ClerkProvider tokenCache={tokenCache} publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}>
        <QueryProvider>
          <PlanProvider>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              {/* <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} /> */}
            </Stack>
            <StatusBar style="dark" />
            <DevMenu />
          </PlanProvider>
        </QueryProvider>
      </ClerkProvider>
    </OnboardingProvider>
  );
}
