import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import { DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import "react-native-reanimated";

import { Onboarding } from "@/components/onboarding/Onboarding";
import { Header } from "@/components/ui/Header";
import { Menu } from "@/components/ui/Menu";
import { colors, typography } from "@/constants/theme";
import { AppProvider } from "@/data/store";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  if (!onboardingComplete) {
    return (
      <>
        <Onboarding onComplete={() => setOnboardingComplete(true)} />
        <StatusBar style="dark" />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <Header onMenuPress={() => setMenuVisible(true)} />
      <Menu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <View style={styles.content}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.primary,
            headerTitleStyle: {
              fontWeight: typography.weights.semibold,
              fontSize: typography.sizes.titleMedium,
            },
            headerBackButtonDisplayMode: "minimal",
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="contacts/index"
            options={{
              title: "Key Contacts",
            }}
          />
          <Stack.Screen
            name="contacts/[id]"
            options={{
              title: "Contact",
            }}
          />
          <Stack.Screen
            name="finances/index"
            options={{
              title: "Financial Accounts",
            }}
          />
          <Stack.Screen
            name="finances/[id]"
            options={{
              title: "Account",
            }}
          />
          <Stack.Screen
            name="insurance/index"
            options={{
              title: "Insurance",
            }}
          />
          <Stack.Screen
            name="insurance/[id]"
            options={{
              title: "Policy",
            }}
          />
          <Stack.Screen
            name="documents/index"
            options={{
              title: "Legal Documents",
            }}
          />
          <Stack.Screen
            name="documents/[id]"
            options={{
              title: "Document",
            }}
          />
          <Stack.Screen
            name="home-responsibilities/index"
            options={{
              title: "Home & Responsibilities",
            }}
          />
          <Stack.Screen
            name="home-responsibilities/[id]"
            options={{
              title: "Item",
            }}
          />
          <Stack.Screen
            name="digital/index"
            options={{
              title: "Digital Access",
            }}
          />
          <Stack.Screen
            name="digital/[id]"
            options={{
              title: "Account",
            }}
          />
        </Stack>
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSerifDisplay_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <ClerkProvider tokenCache={tokenCache}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
