import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import {
  LibreBaskerville_400Regular,
  LibreBaskerville_500Medium,
  LibreBaskerville_600SemiBold,
  LibreBaskerville_700Bold,
} from "@expo-google-fonts/libre-baskerville";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";

import { DevMenu } from "@/components/dev/DevMenu";
import { GlobalUpgradePrompt } from "@/components/entitlements";
import Loader from "@/components/ui/Loader";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { EntitlementsProvider } from "@/data/EntitlementsProvider";
import { OnboardingProvider } from "@/data/OnboardingContext";
import { PlanProvider } from "@/data/PlanProvider";
import { UpgradePromptProvider } from "@/data/UpgradePromptContext";
import { QueryProvider } from "@/providers/QueryProvider";
import Constants from "expo-constants";

SplashScreen.preventAutoHideAsync();

const CLERK_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.clerkPublishableKey;

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
    return <Loader />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <BottomSheetModalProvider>
          <LocaleProvider>
            <UpgradePromptProvider>
              <OnboardingProvider>
                <ClerkProvider
                  tokenCache={tokenCache}
                  publishableKey={CLERK_PUBLISHABLE_KEY}
                >
                  <QueryProvider>
                    <PlanProvider>
                      <EntitlementsProvider>
                        <Stack
                          screenOptions={{
                            headerShown: false,
                            animation: "fade",
                          }}
                        >
                          {/* <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} /> */}
                        </Stack>
                        <StatusBar style="dark" />
                        <DevMenu />
                      </EntitlementsProvider>
                    </PlanProvider>
                  </QueryProvider>
                </ClerkProvider>
              </OnboardingProvider>
              <GlobalUpgradePrompt />
            </UpgradePromptProvider>
          </LocaleProvider>
        </BottomSheetModalProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
