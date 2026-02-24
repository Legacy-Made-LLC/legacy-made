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
import { Toast } from "@/components/ui/Toast";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { EntitlementsProvider } from "@/data/EntitlementsProvider";
import { OnboardingProvider } from "@/data/OnboardingContext";
import { PlanProvider } from "@/data/PlanProvider";
import { UpgradePromptProvider } from "@/data/UpgradePromptContext";
import { QueryProvider } from "@/providers/QueryProvider";
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

Sentry.init({
  dsn: "https://bc0cf3ca18817776fc04823498d95d4c@o4510902712401920.ingest.us.sentry.io/4510902721380352",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  spotlight: __DEV__,
});

SplashScreen.preventAutoHideAsync();

const CLERK_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.clerkPublishableKey;

export default Sentry.wrap(function RootLayout() {
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
                        <Toast />
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
});
