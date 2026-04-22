import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import {
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import {
  LibreBaskerville_400Regular,
  LibreBaskerville_400Regular_Italic,
  LibreBaskerville_500Medium,
  LibreBaskerville_600SemiBold,
  LibreBaskerville_700Bold,
} from "@expo-google-fonts/libre-baskerville";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, useNavigationContainerRef } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";

import { DevMenu } from "@/components/dev/DevMenu";
import { GlobalUpgradePrompt } from "@/components/entitlements";
import Loader from "@/components/ui/Loader";
import { PausedMutationBanner } from "@/components/ui/PausedMutationBanner";
import { Toast } from "@/components/ui/Toast";
import { KeyValueProvider } from "@/contexts/KeyValueContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { NotificationPromptProvider } from "@/contexts/NotificationPromptContext";
import { PlanTransitionProvider } from "@/contexts/PlanTransitionContext";
import { EntitlementsProvider } from "@/data/EntitlementsProvider";
import { OnboardingProvider } from "@/data/OnboardingContext";
import { PlanProvider } from "@/data/PlanProvider";
import { UpgradePromptProvider } from "@/data/UpgradePromptContext";
import { CryptoProvider } from "@/lib/crypto/CryptoProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { RCEntitlementSync } from "@/providers/RCEntitlementSync";
import { RevenueCatProvider } from "@/providers/RevenueCatProvider";
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const navigationIntegration = Sentry.reactNavigationIntegration();

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
    navigationIntegration,
    // Safety net: capture console.warn/error from third-party libs as Sentry logs
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],

  // Filter out noisy trace/debug logs in production
  beforeSendLog(log) {
    if (!__DEV__ && (log.level === "trace" || log.level === "debug")) {
      return null;
    }
    return log;
  },

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  spotlight: __DEV__,
});

SplashScreen.preventAutoHideAsync();

const CLERK_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.clerkPublishableKey;

export default Sentry.wrap(function RootLayout() {
  const navigationRef = useNavigationContainerRef();

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_400Regular_Italic,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    LibreBaskerville_400Regular,
    LibreBaskerville_400Regular_Italic,
    LibreBaskerville_500Medium,
    LibreBaskerville_600SemiBold,
    LibreBaskerville_700Bold,
  });

  useEffect(() => {
    if (navigationRef.current) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

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
              <ClerkProvider
                tokenCache={tokenCache}
                publishableKey={CLERK_PUBLISHABLE_KEY}
              >
                <RevenueCatProvider>
                  <QueryProvider>
                    <RCEntitlementSync />
                    <KeyValueProvider>
                      <OnboardingProvider>
                        <PlanProvider>
                          <NotificationPromptProvider>
                            <CryptoProvider>
                              <EntitlementsProvider>
                                <PlanTransitionProvider>
                                  <Stack
                                    screenOptions={{
                                      headerShown: false,
                                      animation: "fade",
                                    }}
                                    initialRouteName="index"
                                  >
                                    <Stack.Screen name="index" />
                                    <Stack.Screen name="(app)" />
                                    <Stack.Screen name="(auth)" />
                                    <Stack.Screen
                                      name="(onboarding)"
                                      options={{ animation: "fade" }}
                                    />
                                    <Stack.Screen
                                      name="invitations/[token]"
                                      options={{
                                        headerShown: false,
                                      }}
                                    />
                                    <Stack.Screen
                                      name="settings"
                                      options={{ headerShown: false }}
                                    />
                                  </Stack>
                                  <StatusBar style="dark" />
                                  <Toast />
                                  <PausedMutationBanner />
                                  <DevMenu />
                                </PlanTransitionProvider>
                              </EntitlementsProvider>
                            </CryptoProvider>
                          </NotificationPromptProvider>
                        </PlanProvider>
                      </OnboardingProvider>
                    </KeyValueProvider>
                  </QueryProvider>
                  {/* Rendered inside RevenueCatProvider so the upgrade
                      prompt's useRevenueCat() call resolves; rendered
                      after QueryProvider so it overlays everything. */}
                  <GlobalUpgradePrompt />
                </RevenueCatProvider>
              </ClerkProvider>
            </UpgradePromptProvider>
          </LocaleProvider>
        </BottomSheetModalProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
});
