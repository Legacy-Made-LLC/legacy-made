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
      // Combine firstName and lastName for the Contact type
      const fullName = `${pendingContact.firstName} ${pendingContact.lastName}`.trim();
      addContact({
        name: fullName,
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
            headerTintColor: colors.textPrimary,
            headerTitleStyle: {
              fontFamily: typography.fontFamily.serifSemiBold,
              fontSize: typography.sizes.titleMedium,
            },
            headerBackButtonDisplayMode: "generic",
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
            name="vault/[sectionId]/index"
            options={{
              title: '',
            }}
          />
          <Stack.Screen
            name="vault/[sectionId]/[taskId]/index"
            options={{
              title: '',
            }}
          />
          <Stack.Screen
            name="vault/[sectionId]/[taskId]/[entryId]"
            options={{
              title: '',
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
