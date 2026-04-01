import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { onlineManager } from "@tanstack/react-query";
import * as Localization from "expo-localization";
import { Redirect, Stack } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  EncryptionMigrationModal,
  EncryptionMigrationModalRef,
} from "@/components/home/EncryptionMigrationModal";

import { useApi } from "@/api/useApi";
import { ApiClientError } from "@/api/errors";
import { ErrorScreen } from "@/components/ui/ErrorScreen";
import { Header } from "@/components/ui/Header";
import Loader from "@/components/ui/Loader";
import { Menu } from "@/components/ui/Menu";
import { CONTACT_METADATA_SCHEMA } from "@/components/vault/forms/ContactForm";
import { colors, spacing, typography } from "@/constants/theme";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { usePlan } from "@/data/PlanProvider";
import { useCreateEntry } from "@/hooks/queries";
import { useAccessRevocationGuard } from "@/hooks/useAccessRevocationGuard";
import { ReminderEnablePrompt } from "@/components/notifications/ReminderEnablePrompt";
import { useAutoMigration } from "@/hooks/useAutoMigration";
import { usePendingInvitation } from "@/hooks/usePendingInvitation";
import { usePreferences } from "@/hooks/queries/usePreferencesQuery";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useReminderPrompt } from "@/hooks/useReminderPrompt";
import { useSharedPlanStatusPolling } from "@/hooks/useSharedPlanStatusPolling";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { logger } from "@/lib/logger";

// Custom header that doesn't add safe area inset (our parent Header handles it)
// Supports custom options: headerDescription for subtitle text
function StackHeader({ navigation, options, back }: NativeStackHeaderProps) {
  const title = typeof options.title === "string" ? options.title : "";
  // Access custom description option (cast to access custom properties)
  const description = (options as { headerDescription?: string })
    .headerDescription;

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
      {back && (
        options.headerRight
          ? options.headerRight({ canGoBack: !!back })
          : <View style={headerStyles.spacer} />
      )}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
    alignItems: "center",
  },
  title: {
    fontFamily: typography.fontFamily.serifSemiBold,
    fontSize: typography.sizes.titleLarge,
    color: colors.textPrimary,
    textAlign: "center",
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
    // marginTop: spacing.xs,
  },
  spacer: {
    width: 32,
  },
});

/**
 * Auth guard — absorbs Clerk's ~45-second token refresh re-renders.
 *
 * Clerk's useAuth() re-renders on every JWT refresh (~45s). By isolating it
 * here and memoizing AppContent, the rest of the tree only re-renders when
 * isSignedIn actually changes (sign-in / sign-out).
 */
export default function AppLayout() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <Redirect href="/(auth)" />;
  }

  return <AppContent />;
}

const AppContent = React.memo(function AppContent() {
  const { pendingContact, clearPendingContact } = useOnboardingContext();
  const {
    planId,
    isLoading: isPlanLoading,
    error: planError,
    refetch: refetchPlan,
  } = usePlan();
  const entitlements = useEntitlements();

  // Guard against revoked shared plan access
  useAccessRevocationGuard();
  useSharedPlanStatusPolling();

  // Initialize push notification listeners and auto-register token
  usePushNotifications();

  // Sync device timezone with backend once per app launch (fire-and-forget)
  const { preferences: preferencesService } = useApi();
  const timezoneSynced = useRef(false);
  useEffect(() => {
    if (timezoneSynced.current) return;
    timezoneSynced.current = true;
    const tz = Localization.getCalendars()[0]?.timeZone ?? "UTC";
    preferencesService.updateTimezone(tz).catch((err) => {
      logger.info("Timezone sync failed (non-critical)", err);
    });
  }, [preferencesService]);

  // Accept any pending invitation that was stored before auth redirect
  usePendingInvitation();

  // Migrate pre-E2EE data with user-facing modal (temporary — remove after all users migrated)
  const {
    phase: migrationPhase,
    progress: migrationProgress,
    retry: retryMigration,
    dismiss: dismissMigration,
  } = useAutoMigration();
  const migrationModalRef = useRef<EncryptionMigrationModalRef>(null);

  // Soft reminder prompt — show after user starts a section and returns
  const { data: userPrefs } = usePreferences();
  const {
    shouldShowPrompt: showReminderPrompt,
    acceptPrompt: acceptReminderPrompt,
    dismissPrompt: dismissReminderPrompt,
  } = useReminderPrompt(userPrefs?.notifications?.reminders?.enabled);

  const [menuVisible, setMenuVisible] = useState(false);
  const hasSavedPendingContact = useRef(false);

  // Create entry mutation for saving onboarding contact
  const createContactMutation = useCreateEntry("contacts.primary");

  // Save the pending contact from onboarding after authentication and plan is ready
  useEffect(() => {
    if (pendingContact && planId && !hasSavedPendingContact.current) {
      hasSavedPendingContact.current = true;
      // Combine firstName and lastName for the Contact type
      const fullName =
        `${pendingContact.firstName} ${pendingContact.lastName}`.trim();

      createContactMutation
        .mutateAsync({
          title: fullName,
          notes: undefined,
          completionStatus: "draft",
          metadata: {
            firstName: pendingContact.firstName,
            lastName: pendingContact.lastName,
            relationship: pendingContact.relationship,
            phone: pendingContact.phone || "",
            email: pendingContact.email,
            isPrimary: true,
          },
          metadataSchema: CONTACT_METADATA_SCHEMA,
        })
        .then(() => {
          clearPendingContact();
          // TanStack Query handles cache invalidation automatically
        });
    }
  }, [pendingContact, planId, createContactMutation, clearPendingContact]);

  // Access crypto context for recovery detection
  const crypto = useCrypto();

  // Show loading while plan is being fetched
  if ((isPlanLoading && !planId) || entitlements.isLoading) {
    return <Loader branded />;
  }

  // Redirect to recovery screen if user needs key recovery.
  // Wait for crypto queries to settle first — during post-recovery invalidation,
  // hasKeysQuery briefly stays false while refetching, which would cause a
  // false-positive redirect back to recovery and trigger duplicate API calls.
  if (crypto.needsRecovery && !crypto.isLoading) {
    return <Redirect href="/settings/recovery" />;
  }

  // Show error screen if plan failed to load.
  // Two cases: (1) no cached data at all, or (2) auth error (token expired after idle)
  // — in the latter case stale planId may still exist, but all queries will fail.
  const isAuthError =
    planError instanceof ApiClientError && planError.statusCode === 401;
  if (planError && (!planId || isAuthError)) {
    logger.error("Plan failed to load", planError, {
      hasCachedPlanId: !!planId,
      isAuthError: String(isAuthError),
    });
    return (
      <ErrorScreen
        isOffline={!onlineManager.isOnline()}
        onRetry={refetchPlan}
        errorDetail={__DEV__ ? planError.message : undefined}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Header onMenuPress={() => setMenuVisible(true)} />
      <Menu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <ReminderEnablePrompt
        shouldShowPrompt={showReminderPrompt}
        onAccept={acceptReminderPrompt}
        onDismiss={dismissReminderPrompt}
      />
      <EncryptionMigrationModal
        ref={migrationModalRef}
        phase={migrationPhase}
        progress={migrationProgress}
        onRetry={retryMigration}
        onDismiss={dismissMigration}
      />
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
              title: "",
            }}
          />
          <Stack.Screen
            name="vault/[sectionId]/[taskId]/index"
            options={{
              title: "",
            }}
          />
          <Stack.Screen
            name="vault/[sectionId]/[taskId]/[entryId]"
            options={{
              title: "",
            }}
          />
          <Stack.Screen
            name="wishes/[sectionId]/index"
            options={{
              title: "",
            }}
          />
          <Stack.Screen
            name="wishes/[sectionId]/[taskId]/index"
            options={{
              title: "",
            }}
          />
          <Stack.Screen
            name="legacy/[sectionId]/index"
            options={{
              title: "",
            }}
          />
          <Stack.Screen
            name="legacy/[sectionId]/[taskId]/index"
            options={{
              title: "",
            }}
          />
          <Stack.Screen
            name="legacy/[sectionId]/[taskId]/[entryId]"
            options={{
              title: "",
            }}
          />
          <Stack.Screen
            name="legacy/[sectionId]/[taskId]/record"
            options={{
              presentation: "fullScreenModal",
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="family/contacts/new"
            options={{
              title: "Add Trusted Contact",
            }}
          />
          <Stack.Screen
            name="family/contacts/[contactId]"
            options={{
              title: "Trusted Contact",
            }}
          />
        </Stack>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
