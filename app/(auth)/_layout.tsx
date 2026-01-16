import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";

import { colors } from "@/constants/theme";

export default function AuthLayout() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    />
  );
}
