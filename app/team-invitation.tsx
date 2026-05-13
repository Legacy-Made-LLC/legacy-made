/**
 * Team Invitation Deep Link Screen
 *
 * Handles:
 *   https://app.mylegacymade.com/team-invitation?token=<jwt>
 *   legacymade://team-invitation?token=<jwt>
 *
 * Lives outside (app) so unauthenticated users can land here from the
 * web fallback. Mirrors `app/invitations/[token].tsx` for trusted-
 * contact invites, but for B2B master subscription seats.
 *
 * Flow:
 *   1. Fetch preview (public endpoint, no auth)
 *   2. Render provider name + invited email
 *   3. Accept tap:
 *      - Signed in → POST /master-subscription-invitations/:token/accept
 *      - Signed out → save token to KV, redirect to /(auth); the
 *        usePendingMasterSubInvitation hook in (app) auto-accepts after
 *        sign-in completes.
 *   4. After accept, if the user has an active RC entitlement we know
 *      about, show a one-time advisory pointing at native subscription
 *      management — App Store / Play won't let us cancel for them.
 */

import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiClientError } from "@/api/client";
import type { MasterSubInvitationPreview } from "@/api/masterSubscriptionInvitations";
import { useApi } from "@/api/useApi";
import Loader from "@/components/ui/Loader";
import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { useKeyValue } from "@/contexts/KeyValueContext";
import { PENDING_MASTER_SUB_INVITATION_TOKEN_KEY } from "@/hooks/usePendingMasterSubInvitation";
import { toast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";
import {
  RC_ENTITLEMENT_INDIVIDUAL,
  getManageSubscriptionUrl,
  useRevenueCat,
} from "@/providers/RevenueCatProvider";

const ADVISORY_DISMISSED_KEY_PREFIX = "legacy_made_master_sub_d2c_advisory_";

type ScreenState =
  | { kind: "loading" }
  | { kind: "loaded"; preview: MasterSubInvitationPreview }
  | { kind: "error"; message: string }
  | { kind: "expired" }
  | {
      kind: "done";
      outcome: "accepted" | "already_accepted" | "removed";
      preview?: MasterSubInvitationPreview;
    };

export default function TeamInvitationScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { globalStorage: kv } = useKeyValue();
  const { masterSubInvitations } = useApi();
  const queryClient = useQueryClient();
  const { customerInfo, hasEntitlement } = useRevenueCat();

  const [state, setState] = useState<ScreenState>({ kind: "loading" });
  const [accepting, setAccepting] = useState(false);

  // Fetch preview on mount
  useEffect(() => {
    if (!token) {
      setState({
        kind: "error",
        message: "Invalid invitation link.",
      });
      return;
    }

    masterSubInvitations
      .preview(token)
      .then((preview) => {
        if (preview.status === "active") {
          setState({ kind: "done", outcome: "already_accepted", preview });
        } else if (preview.status === "removed") {
          setState({ kind: "done", outcome: "removed", preview });
        } else {
          setState({ kind: "loaded", preview });
        }
      })
      .catch((err) => {
        if (err instanceof ApiClientError) {
          if (
            err.statusCode === 401 ||
            err.statusCode === 404 ||
            err.statusCode === 410
          ) {
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
  }, [token, masterSubInvitations]);

  const showD2CAdvisoryIfNeeded = async (providerName: string) => {
    if (!customerInfo) return;
    if (!hasEntitlement(RC_ENTITLEMENT_INDIVIDUAL)) return;

    const dismissKey = `${ADVISORY_DISMISSED_KEY_PREFIX}${customerInfo.originalAppUserId}`;
    if (kv.getString(dismissKey)) return;

    kv.set(dismissKey, "1");

    Alert.alert(
      "You have a personal subscription",
      `Your access is now provided by ${providerName}, so your personal Legacy Made subscription is redundant. You may want to cancel it to avoid being charged.\n\nLegacy Made can't cancel App Store / Play Store subscriptions for you — you'll need to do it in the store's subscription settings.`,
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Open subscription settings",
          onPress: () => Linking.openURL(getManageSubscriptionUrl()),
        },
      ],
    );
  };

  const handleAccept = async () => {
    if (!token) return;
    if (!isAuthLoaded) {
      toast.error({ message: "Still loading, please try again." });
      return;
    }

    if (!isSignedIn) {
      try {
        kv.set(PENDING_MASTER_SUB_INVITATION_TOKEN_KEY, token);
      } catch (err) {
        logger.error(
          "Failed to save pending master sub invitation token",
          err,
        );
      }
      router.push("/(auth)");
      return;
    }

    if (state.kind !== "loaded") return;
    setAccepting(true);
    try {
      const result = await masterSubInvitations.accept(token);
      // Refresh ALL entitlement queries — pillar locks + quotas read
      // from queryKeys.entitlements.forPlan(planId), not just current().
      // Invalidating the .all() prefix covers both.
      await queryClient.invalidateQueries({
        queryKey: queryKeys.entitlements.all(),
      });
      const preview = state.preview;
      setState({ kind: "done", outcome: "accepted", preview });
      toast.success({
        title: "Welcome aboard",
        message: `Access provided by ${result.masterSubscription.displayName}.`,
      });
      await showD2CAdvisoryIfNeeded(result.masterSubscription.displayName);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Couldn't accept the invitation. Please try again.";
      toast.error({ message });
      logger.error("Failed to accept master sub invitation", err);
    } finally {
      setAccepting(false);
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────

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
        <View style={styles.logoBlock}>
          <Image
            source={require("@/assets/images/muted-green-circle-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brand}>Legacy Made</Text>
        </View>

        {state.kind === "loading" && (
          <View style={styles.loadingBlock}>
            <Loader />
          </View>
        )}

        {state.kind === "expired" && (
          <Empty
            icon="time-outline"
            title="Invitation expired or not found"
            message="This invitation link is no longer valid. Ask the sender for a fresh invite."
            primaryLabel="Close"
            onPrimary={handleClose}
          />
        )}

        {state.kind === "error" && (
          <Empty
            icon="alert-circle-outline"
            title="Something went wrong"
            message={state.message}
            primaryLabel="Close"
            onPrimary={handleClose}
          />
        )}

        {state.kind === "done" && (
          <Empty
            icon={
              state.outcome === "accepted" ? "checkmark-circle-outline" : "information-circle-outline"
            }
            title={
              state.outcome === "accepted"
                ? "You're in"
                : state.outcome === "already_accepted"
                  ? "You've already accepted"
                  : "This invitation has been revoked"
            }
            message={
              state.outcome === "removed"
                ? `Ask ${state.preview?.providerName ?? "the sender"} for a fresh invite.`
                : state.outcome === "already_accepted"
                  ? `Your access is provided by ${state.preview?.providerName ?? "your provider"}.`
                  : `Your access is provided by ${state.preview?.providerName ?? "your provider"}.`
            }
            primaryLabel={
              state.outcome === "accepted" ? "Continue to Legacy Made" : "Close"
            }
            onPrimary={() => {
              if (state.outcome === "accepted" && isSignedIn) {
                router.replace("/(app)");
              } else {
                handleClose();
              }
            }}
          />
        )}

        {state.kind === "loaded" && (
          <Loaded
            preview={state.preview}
            accepting={accepting}
            onAccept={handleAccept}
            isSignedIn={!!isSignedIn}
            onCancel={handleClose}
          />
        )}
    </ScrollView>
  );
}

function Loaded({
  preview,
  accepting,
  onAccept,
  isSignedIn,
  onCancel,
}: {
  preview: MasterSubInvitationPreview;
  accepting: boolean;
  onAccept: () => void;
  isSignedIn: boolean;
  onCancel: () => void;
}) {
  const subInactive = preview.masterSubscriptionStatus !== "active";

  return (
    <>
      <Text style={styles.heading}>You&apos;ve been invited</Text>
      <Text style={styles.subheading}>
        Your access to Legacy Made is provided by{" "}
        <Text style={styles.brandBold}>{preview.providerName}</Text>.
      </Text>

      <View style={styles.card}>
        <View style={styles.cardIconCircle}>
          <Ionicons
            name="briefcase-outline"
            size={28}
            color={colors.textPrimary}
          />
        </View>
        <Text style={styles.cardTitle}>{preview.providerName}</Text>
        <Text style={styles.cardBody}>
          Invitation sent to{" "}
          <Text style={styles.brandBold}>{preview.invitedEmail}</Text>. Sign in
          or create an account to accept.
        </Text>
        {preview.ownerName && (
          <Text style={styles.cardSubtle}>Sent by {preview.ownerName}</Text>
        )}
      </View>

      {subInactive && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            This invitation isn&apos;t currently active. Ask{" "}
            {preview.providerName} to reactivate before accepting.
          </Text>
        </View>
      )}

      <Pressable
        onPress={onAccept}
        disabled={accepting || subInactive}
        accessibilityRole="button"
        accessibilityLabel="Accept invitation"
        style={({ pressed }) => [
          styles.primaryButton,
          (accepting || subInactive) && styles.primaryButtonDisabled,
          pressed && !accepting && !subInactive && styles.primaryButtonPressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>
          {accepting
            ? "Accepting..."
            : isSignedIn
              ? "Accept invitation"
              : "Sign in to accept"}
        </Text>
      </Pressable>

      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Not now"
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>Not now</Text>
      </Pressable>
    </>
  );
}

function Empty({
  icon,
  title,
  message,
  primaryLabel,
  onPrimary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
}) {
  return (
    <View style={styles.emptyBlock}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name={icon} size={36} color={colors.textTertiary} />
      </View>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.subheading}>{message}</Text>
      <Pressable
        onPress={onPrimary}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  logoBlock: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: spacing.sm,
  },
  brand: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
  },
  brandBold: {
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },
  heading: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subheading: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    lineHeight: typography.sizes.body * typography.lineHeights.normal,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  cardIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: typography.sizes.titleLarge,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  cardBody: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
    textAlign: "center",
  },
  cardSubtle: {
    marginTop: spacing.md,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
  notice: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeText: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
  },
  primaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonDisabled: {
    backgroundColor: colors.border,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
  },
  secondaryButton: {
    width: "100%",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body,
  },
  loadingBlock: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  emptyBlock: {
    alignItems: "center",
    paddingTop: spacing.lg,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
});
