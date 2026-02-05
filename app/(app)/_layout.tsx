import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { Redirect, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Header } from "@/components/ui/Header";
import { Menu } from "@/components/ui/Menu";
import { colors, spacing, typography } from "@/constants/theme";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { usePlan } from "@/data/PlanProvider";
import { useCreateEntry } from "@/hooks/queries";

// Custom header that doesn't add safe area inset (our parent Header handles it)
// Supports custom options: headerDescription for subtitle text
function StackHeader({ navigation, options, back }: NativeStackHeaderProps) {
  const title = typeof options.title === 'string' ? options.title : '';
  // Access custom description option (cast to access custom properties)
  const description = (options as { headerDescription?: string }).headerDescription;

  return (
    <View style={headerStyles.container}>
      {back && (
        <Pressable
          onPress={navigation.goBack}
          style={({ pressed }) => [
            headerStyles.backButton,
            pressed && headerStyles.backButtonPressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
      )}
      <View style={headerStyles.titleContainer}>
        <Text style={headerStyles.title} numberOfLines={1}>
          {title}
        </Text>
        {description && (
          <Text style={headerStyles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
      {back && <View style={headerStyles.spacer} />}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: spacing.xs,
    borderRadius: 8,
    marginRight: spacing.xs,
  },
  backButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.fontFamily.serifSemiBold,
    fontSize: typography.sizes.titleLarge,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    // marginTop: spacing.xs,
  },
  spacer: {
    width: 32,
  },
});

export default function AppLayout() {
  const { isSignedIn } = useAuth();
  const { pendingContact, clearPendingContact } = useOnboardingContext();
  const { planId } = usePlan();

  const [menuVisible, setMenuVisible] = useState(false);
  const hasSavedPendingContact = useRef(false);

  // Create entry mutation for saving onboarding contact
  const createContactMutation = useCreateEntry('contacts.primary');

  // Save the pending contact from onboarding after authentication and plan is ready
  useEffect(() => {
    if (pendingContact && planId && !hasSavedPendingContact.current) {
      hasSavedPendingContact.current = true;
      // Combine firstName and lastName for the Contact type
      const fullName = `${pendingContact.firstName} ${pendingContact.lastName}`.trim();

      createContactMutation.mutateAsync({
        title: fullName,
        notes: undefined,
        metadata: {
          firstName: pendingContact.firstName,
          lastName: pendingContact.lastName,
          relationship: pendingContact.relationship,
          phone: pendingContact.phone,
          email: pendingContact.email,
          isPrimary: true,
        },
      }).then(() => {
        clearPendingContact();
        // TanStack Query handles cache invalidation automatically
      });
    }
  }, [pendingContact, planId, createContactMutation, clearPendingContact]);

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
            // Use custom header to avoid native safe area handling
            header: StackHeader,
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
          <Stack.Screen
            name="wishes/[sectionId]/index"
            options={{
              title: '',
            }}
          />
          <Stack.Screen
            name="wishes/[sectionId]/[taskId]/index"
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
