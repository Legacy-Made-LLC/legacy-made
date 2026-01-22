import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Header } from "@/components/ui/Header";
import { Menu } from "@/components/ui/Menu";
import { colors, typography } from "@/constants/theme";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { usePlan } from "@/data/PlanProvider";
import { useAppContext } from "@/data/store";

export default function AppLayout() {
  const { isSignedIn } = useAuth();
  const { pendingContact, clearPendingContact } = useOnboardingContext();
  const { planId } = usePlan();
  const { addContact, refresh } = useAppContext();

  const [menuVisible, setMenuVisible] = useState(false);
  const hasSavedPendingContact = useRef(false);

  // Save the pending contact from onboarding after authentication and plan is ready
  useEffect(() => {
    if (pendingContact && planId && !hasSavedPendingContact.current) {
      hasSavedPendingContact.current = true;
      addContact({
        name: pendingContact.name,
        relationship: pendingContact.relationship,
        phone: pendingContact.phone,
        email: pendingContact.email,
        isPrimary: true,
      }).then(() => {
        clearPendingContact();
        // Refresh data to ensure the new contact is visible
        refresh();
      });
    }
  }, [pendingContact, planId, addContact, clearPendingContact, refresh]);

  if (!isSignedIn) {
    return <Redirect href="/(auth)" />;
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
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
