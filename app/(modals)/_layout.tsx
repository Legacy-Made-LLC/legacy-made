import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";

import { colors } from "@/constants/theme";

/**
 * Modals route group — sits alongside (app) so fullScreenModal presentations
 * aren't painted *under* the app-level Header. Android's fullScreenModal
 * stays within its parent layout tree, so a sibling Header in (app) leaks
 * through on top of the modal. Rendering modals from the root Stack avoids
 * that entirely.
 */
export default function ModalsLayout() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="paywall"
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="paywall-activating"
        options={{
          presentation: "fullScreenModal",
          gestureEnabled: false,
          animation: "fade",
        }}
      />
    </Stack>
  );
}
