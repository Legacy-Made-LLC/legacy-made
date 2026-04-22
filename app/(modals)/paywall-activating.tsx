/**
 * Paywall Activating
 *
 * Shown after a successful RC purchase/restore while we wait for our
 * backend to catch up. RC's purchase callback returns as soon as the
 * store confirms; the tier the rest of the app reads comes from the
 * backend, which is driven by the RC webhook → DB write pipeline.
 * That pipeline is usually fast (<5s) but can take longer under load
 * or when the webhook has to retry.
 *
 * The screen polls `entitlements.current()` on a 1s cadence by
 * invalidating the query. As soon as the tier flips away from "free",
 * it replaces the route with the app root. After a grace window the
 * screen surfaces a "Continue" escape hatch so the user isn't trapped
 * — the AppState foreground listener picks up the tier change whenever
 * it lands.
 */
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApi } from "@/api";
import { EXTERNAL_LINKS } from "@/constants/links";
import { colors, spacing, typography } from "@/constants/theme";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";

const POLL_INTERVAL_MS = 1000;
// After this, surface the escape hatch (Try Now / Continue). Polling
// continues in the background; AppState foreground refetch covers the
// case where the user backgrounds the app.
const ESCAPE_HATCH_AFTER_MS = 15000;
// Hard stop on polling. Beyond this we rely on the escape hatch +
// AppState refetch + RC CustomerInfo listener to catch up. Avoids
// burning battery on a forgotten polling loop if the user leaves the
// screen open for hours.
const POLL_STOP_AFTER_MS = 60000;

function goHome() {
  if (router.canGoBack()) router.back();
  router.replace("/(app)");
}

export default function PaywallActivatingScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { entitlements } = useApi();
  const { tier, isFree } = useEntitlements();
  const [showEscapeHatch, setShowEscapeHatch] = useState(false);
  const [forcing, setForcing] = useState(false);
  const [forceError, setForceError] = useState<string | null>(null);
  const finishedRef = useRef(false);

  // Route home as soon as the backend reflects the new tier.
  useEffect(() => {
    if (finishedRef.current) return;
    if (!isFree) {
      finishedRef.current = true;
      goHome();
    }
  }, [isFree, tier]);

  // Poll by invalidating the entitlements + plan queries. TanStack
  // dedupes in-flight refetches, so issuing invalidations faster than
  // the network round-trip is harmless. Hard-stop after POLL_STOP so
  // we don't burn battery if the screen is left open indefinitely.
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (finishedRef.current) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.plan.current() });
      queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.all() });
    }, POLL_INTERVAL_MS);
    const stopId = setTimeout(() => {
      clearInterval(intervalId);
    }, POLL_STOP_AFTER_MS);
    return () => {
      clearInterval(intervalId);
      clearTimeout(stopId);
    };
  }, [queryClient]);

  // Surface the escape hatch after the grace window.
  useEffect(() => {
    const id = setTimeout(() => {
      setShowEscapeHatch(true);
    }, ESCAPE_HATCH_AFTER_MS);
    return () => clearTimeout(id);
  }, []);

  // Manual force-sync: ask the API to reconcile the user's tier
  // against RC's REST view. Used when the webhook has clearly missed
  // (or been delayed) and the user wants to nudge things along.
  const handleForceSync = async () => {
    if (forcing) return;
    setForceError(null);
    setForcing(true);
    try {
      const fresh = await entitlements.syncEntitlements();
      queryClient.setQueryData(queryKeys.entitlements.current(), fresh);
      queryClient.invalidateQueries({ queryKey: queryKeys.plan.current() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.entitlements.all(),
      });
      // The tier-watcher useEffect above will route home on the next
      // render if `fresh.tier !== "free"`. If the sync still reports
      // free (RC genuinely doesn't have an active entitlement), let
      // the user choose: they can Continue, or wait and try again.
      if (fresh.tier === "free") {
        setForceError(
          "We couldn't find an active subscription on this account yet. Please try again in a moment.",
        );
      }
    } catch (err) {
      logger.error("PaywallActivating: syncEntitlements failed", { err });
      setForceError(
        "Couldn't refresh from the store. Please check your connection and try again.",
      );
    } finally {
      setForcing(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.title}>Activating your subscription</Text>
        <Text style={styles.message}>
          Thanks for subscribing. We&rsquo;re finishing a few things on our end
          — this usually takes a few seconds.
        </Text>

        {showEscapeHatch && (
          <View style={styles.escape}>
            <Text style={styles.escapeNote}>
              Taking longer than usual. Try refreshing now, or continue —
              we&rsquo;ll update your plan automatically as soon as it&rsquo;s
              ready.
            </Text>
            {forceError && <Text style={styles.errorText}>{forceError}</Text>}
            <Pressable
              onPress={handleForceSync}
              disabled={forcing}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                forcing && styles.buttonDisabled,
              ]}
            >
              {forcing ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>Try refreshing now</Text>
              )}
            </Pressable>
            <Pressable
              onPress={goHome}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Continue</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                WebBrowser.openBrowserAsync(EXTERNAL_LINKS.contactSupport)
              }
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Contact support</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    maxWidth: 320,
  },
  escape: {
    marginTop: spacing.xxl,
    alignItems: "center",
    maxWidth: 340,
  },
  escapeNote: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    textAlign: "center",
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
    marginBottom: spacing.lg,
  },
  button: {
    height: 52,
    borderRadius: 26,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 220,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
  secondaryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonPressed: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.md,
    maxWidth: 320,
  },
});
