import { Stack } from "expo-router";

import { colors } from "@/constants/theme";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: "default",
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      {/* <Stack.Screen
        name="index"
        options={{
          animation: 'fade' // Override just for index
        }}
      /> */}
    </Stack>
  );
}
