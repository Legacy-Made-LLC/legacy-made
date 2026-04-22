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
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing, typography } from "@/constants/theme";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { queryKeys } from "@/lib/queryKeys";

const POLL_INTERVAL_MS = 1000;
// Show the escape hatch after this — covers the normal case (tier
// typically lands within 5s) plus a bit of buffer. Don't stop polling
// when this fires; polling continues in the background.
const ESCAPE_HATCH_AFTER_MS = 15000;

function goHome() {
  if (router.canGoBack()) router.back();
  router.replace("/(app)");
}

export default function PaywallActivatingScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { tier, isFree } = useEntitlements();
  const [showEscapeHatch, setShowEscapeHatch] = useState(false);
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
  // the network round-trip is harmless.
  useEffect(() => {
    const id = setInterval(() => {
      if (finishedRef.current) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.plan.current() });
      queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.all() });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [queryClient]);

  // Surface the escape hatch after the grace window.
  useEffect(() => {
    const id = setTimeout(() => {
      setShowEscapeHatch(true);
    }, ESCAPE_HATCH_AFTER_MS);
    return () => clearTimeout(id);
  }, []);

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
              Taking longer than usual. You can continue — we&rsquo;ll update
              your plan automatically as soon as it&rsquo;s ready.
            </Text>
            <Pressable
              onPress={goHome}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>Continue</Text>
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
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  buttonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
});
