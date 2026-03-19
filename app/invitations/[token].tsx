/**
 * Invitation Deep Link Screen
 *
 * Handles: https://app.mylegacymade.com/invitations/{token}
 *          legacymade://invitations/{token}
 *
 * This screen lives outside the (app) group because the recipient
 * may not have an account or be signed in yet.
 *
 * Flow:
 * 1. Fetch invitation details (public endpoint, no auth)
 * 2. Show who invited them and what access they'd get
 * 3. Accept:
 *    - If signed in → accept directly via API
 *    - If not signed in → save token to AsyncStorage, redirect to auth flow.
 *      After sign-in/sign-up, usePendingInvitation in (app) layout auto-accepts.
 */

import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { logger } from "@/lib/logger";
import { fetchInvitationDetails } from "@/api/accessInvitations";
import { ApiClientError } from "@/api/client";
import type { InvitationDetails } from "@/api/types";
import Loader from "@/components/ui/Loader";
import {
  borderRadius,
  colors,
  spacing,
  typography,
} from "@/constants/theme";
import {
  useAcceptAccessInvitation,
  useDeclineAccessInvitation,
  useSharedPlansQuery,
} from "@/hooks/queries";
import { PENDING_INVITATION_TOKEN_KEY } from "@/hooks/usePendingInvitation";
import { usePlanSwitching } from "@/hooks/usePlanSwitching";
import { toast } from "@/hooks/useToast";

const ACCESS_LEVEL_INFO: Record<
  string,
  { label: string; description: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  full_edit: {
    label: "Full Edit Access",
    description:
      "You\u2019ll be able to view and edit their plan, including entries, wishes, and messages.",
    icon: "create-outline",
  },
  full_view: {
    label: "Full View Access",
    description:
      "You\u2019ll be able to view everything in their plan, but won\u2019t be able to make changes.",
    icon: "eye-outline",
  },
  limited_view: {
    label: "Limited View Access",
    description:
      "You\u2019ll be able to view their wishes and messages, but not detailed account information.",
    icon: "eye-off-outline",
  },
  view_only: {
    label: "View Only Access",
    description: "You\u2019ll receive view-only access when the time comes.",
    icon: "eye-outline",
  },
};

type ScreenState =
  | { kind: "loading" }
  | { kind: "loaded"; invitation: InvitationDetails }
  | { kind: "error"; message: string }
  | { kind: "expired" }
  | {
      kind: "done";
      outcome: "accepted" | "declined";
      invitation?: InvitationDetails;
    };

export default function InvitationScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const acceptMutation = useAcceptAccessInvitation();
  const declineMutation = useDeclineAccessInvitation();
  const { data: sharedPlans } = useSharedPlansQuery();
  const { switchToSharedPlan } = usePlanSwitching();

  const [state, setState] = useState<ScreenState>({ kind: "loading" });

  // Fetch invitation details on mount
  useEffect(() => {
    if (!token) {
      setState({ kind: "error", message: "Invalid invitation link." });
      return;
    }

    fetchInvitationDetails(token)
      .then((invitation) => {
        if (invitation.accessStatus !== "pending") {
          setState({
            kind: "done",
            outcome:
              invitation.accessStatus === "accepted" ? "accepted" : "declined",
            invitation,
          });
        } else {
          setState({ kind: "loaded", invitation });
        }
      })
      .catch((err) => {
        if (err instanceof ApiClientError) {
          if (err.statusCode === 404) {
            setState({ kind: "expired" });
          } else if (err.statusCode === 401) {
            setState({ kind: "expired" });
          } else {
            setState({ kind: "error", message: err.message });
          }
        } else {
          setState({
            kind: "error",
            message: "Something went wrong. Please try again.",
          });
        }
      });
  }, [token]);

  // Pending invitation acceptance after auth is handled exclusively by
  // usePendingInvitation in the (app) layout. This screen saves the token
  // to AsyncStorage and navigates away — it won't be mounted when the
  // user completes auth.

  // ── Handlers ──────────────────────────────────────────────────────────

  const isActing = acceptMutation.isPending || declineMutation.isPending;

  const handleAccept = async () => {
    if (!token) return;

    if (!isAuthLoaded) {
      toast.error({ message: "Still loading, please try again." });
      return;
    }

    if (!isSignedIn) {
      // Save the invitation token so it can be auto-accepted after auth
      try {
        await AsyncStorage.setItem(PENDING_INVITATION_TOKEN_KEY, token);
      } catch (err) {
        // If storage fails, the user will need to use the link again
        logger.error("Failed to save pending invitation token", err);
      }

      // Push to the auth welcome screen. The invitation screen stays in
      // the back stack so the user can navigate back if they change their
      // mind. After auth completes, usePendingInvitation auto-accepts.
      router.push("/(auth)");
      return;
    }

    // User is signed in — accept via mutation (same pattern as rest of app)
    try {
      await acceptMutation.mutateAsync(token);
      const inv = state.kind === "loaded" ? state.invitation : undefined;
      setState({ kind: "done", outcome: "accepted", invitation: inv });
      toast.success({ title: "Invitation accepted" });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Couldn\u2019t accept invitation.";
      toast.error({ message });
    }
  };

  const handleDecline = () => {
    if (!token) return;

    Alert.alert(
      "Decline Invitation",
      "Are you sure you want to decline this invitation? The plan owner will be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              await declineMutation.mutateAsync(token);
              setState({ kind: "done", outcome: "declined" });
            } catch (err) {
              const message =
                err instanceof ApiClientError
                  ? err.message
                  : "Couldn\u2019t decline invitation.";
              toast.error({ message });
            }
          },
        },
      ],
    );
  };

  const handleGoHome = () => {
    if (isSignedIn) {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.replace("/(auth)");
    }
  };

  const handleViewAcceptedPlan = () => {
    if (!isSignedIn || state.kind !== "done" || !state.invitation) {
      handleGoHome();
      return;
    }

    const plan = sharedPlans?.find(
      (sp) => sp.planId === state.invitation!.planId,
    );
    if (plan) {
      // Dismiss the modal first, then switch plans.
      // switchToSharedPlan uses router.push, which would layer on top of
      // this modal. By dismissing first we return to the (app) stack.
      router.dismiss();
      switchToSharedPlan(plan);
    } else {
      // Plan data hasn't loaded yet — dismiss modal and go to Family tab
      router.dismiss();
      router.replace("/(app)/(tabs)/family");
    }
  };

  // ── Render states ─────────────────────────────────────────────────────

  // Loading
  if (state.kind === "loading") {
    return <Loader branded />;
  }

  // Expired / Not found
  if (state.kind === "expired") {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.brandTop}>
          <Image
            source={require("@/assets/images/muted-green-circle-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Legacy Made</Text>
        </View>
        <View style={styles.body}>
          <View style={styles.expiredIcon}>
            <Ionicons
              name="time-outline"
              size={40}
              color={colors.textTertiary}
            />
          </View>
          <Text style={styles.expiredTitle}>
            Invitation expired or not found
          </Text>
          <Text style={styles.expiredDescription}>
            This invitation link is no longer valid. It may have expired or
            already been used. Ask the plan owner to send a new invitation.
          </Text>
          <Pressable
            onPress={handleGoHome}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Go to Legacy Made</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Error
  if (state.kind === "error") {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.brandTop}>
          <Image
            source={require("@/assets/images/muted-green-circle-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Legacy Made</Text>
        </View>
        <View style={styles.body}>
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color={colors.error}
            style={{ marginBottom: spacing.lg }}
          />
          <Text style={styles.expiredTitle}>Something went wrong</Text>
          <Text style={styles.expiredDescription}>{state.message}</Text>
          <Pressable
            onPress={handleGoHome}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Go to Legacy Made</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Done (accepted or declined)
  if (state.kind === "done") {
    const isAccepted = state.outcome === "accepted";
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.brandTop}>
          <Image
            source={require("@/assets/images/muted-green-circle-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Legacy Made</Text>
        </View>
        <View style={styles.body}>
          <View
            style={[
              styles.doneIcon,
              {
                backgroundColor: isAccepted
                  ? colors.featureInformationTint
                  : colors.surfaceSecondary,
              },
            ]}
          >
            <Ionicons
              name={isAccepted ? "checkmark-circle" : "close-circle"}
              size={40}
              color={isAccepted ? colors.success : colors.textTertiary}
            />
          </View>
          <Text style={styles.doneTitle}>
            {isAccepted ? "Invitation accepted" : "Invitation declined"}
          </Text>
          <Text style={styles.expiredDescription}>
            {isAccepted
              ? `You now have access to ${state.invitation?.ownerName ? `${state.invitation.ownerName}\u2019s` : "this"} plan.`
              : "The plan owner has been notified."}
          </Text>
          <Pressable
            onPress={isAccepted ? handleViewAcceptedPlan : handleGoHome}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isAccepted ? "View Plan" : "Go to Legacy Made"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Main invitation view (loaded)
  const { invitation } = state;
  const accessInfo =
    ACCESS_LEVEL_INFO[invitation.accessLevel] ?? ACCESS_LEVEL_INFO.full_view;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Brand */}
      <View style={styles.brand}>
        <Image
          source={require("@/assets/images/muted-green-circle-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>Legacy Made</Text>
      </View>

      {/* Invitation Header */}
      <Text style={styles.title}>You&apos;ve been invited</Text>
      <Text style={styles.subtitle}>
        <Text style={styles.ownerName}>{invitation.ownerName}</Text> has invited
        you to access their Legacy Made plan.
      </Text>

      {/* Access Level Card */}
      <View style={styles.accessCard}>
        <View style={styles.accessIconContainer}>
          <Ionicons name={accessInfo.icon} size={24} color={colors.primary} />
        </View>
        <Text style={styles.accessLabel}>{accessInfo.label}</Text>
        <Text style={styles.accessDescription}>{accessInfo.description}</Text>
      </View>

      {/* What is Legacy Made */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>What is Legacy Made?</Text>
        <Text style={styles.infoText}>
          Legacy Made helps people organize critical information for their loved
          ones — accounts, documents, wishes, and messages — so those closest to them are
          never left guessing.
        </Text>
      </View>

      {/* Accept error */}
      {acceptMutation.isError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {acceptMutation.error instanceof ApiClientError
              ? acceptMutation.error.message
              : "Couldn\u2019t accept invitation. Please try again."}
          </Text>
        </View>
      ) : null}

      {/* Unauthenticated hint */}
      {!isSignedIn ? (
        <Text style={styles.authHint}>
          You&apos;ll need to sign in or create an account to accept this
          invitation.
        </Text>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleAccept}
          disabled={isActing}
          style={({ pressed }) => [
            styles.primaryButton,
            isActing && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isActing
              ? "Please wait..."
              : acceptMutation.isError
                ? "Try Again"
                : "Accept Invitation"}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDecline}
          disabled={isActing}
          style={({ pressed }) => [
            styles.declineButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  // Brand (top-pinned for centered states)
  brandTop: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  // Brand (inline for scrollable states)
  brand: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  // Body content centered in remaining space
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: spacing.sm,
  },
  brandName: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
  },
  // Header
  title: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  ownerName: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  // Access Card
  accessCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.featureInformationTint,
  },
  accessIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.featureInformationTint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  accessLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  accessDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
  },
  // Info
  infoSection: {
    width: "100%",
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
  },
  // Actions
  actions: {
    width: "100%",
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    alignItems: "center",
    width: "100%",
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
  declineButton: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  declineButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.textTertiary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: colors.error + "10",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.error,
  },
  authHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  // Expired / Error
  expiredIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  expiredTitle: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: typography.sizes.titleLarge,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  expiredDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  // Done
  doneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  doneTitle: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
});
