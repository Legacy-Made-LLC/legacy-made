/**
 * Subscription Portal Return Screen
 *
 * Handles: https://app.mylegacymade.com/subscription/return
 *
 * When the user returns from the Stripe Customer Portal, this screen
 * refreshes their entitlements, compares the pre-portal tier to the
 * post-refresh tier, and shows warm messaging appropriate to the
 * direction of change (upgrade, downgrade, or no-change).
 *
 * Deep-link params are validated with Zod. Today the portal returns
 * with no params, but the schema tolerates future additions and
 * surfaces anything unexpected as an explicit error state instead of
 * a silent crash or a misleading "welcome".
 */

import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import type { SubscriptionTier } from "@/api/types";
import {
  borderRadius,
  colors,
  spacing,
  typography,
} from "@/constants/theme";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";

const TIER_DISPLAY: Record<SubscriptionTier, string> = {
  free: "Free",
  individual: "Individual",
  family: "Family",
};

/**
 * Tier ordering used to classify a change as upgrade vs downgrade.
 * Higher index = more privileges.
 */
const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  individual: 1,
  family: 2,
};

/**
 * Deep-link params schema. The portal's return URL currently carries
 * no query params, so every field is optional. Unknown keys are
 * ignored (default Zod behavior). The schema exists so that if we
 * ever do pass params — or if someone hits the route manually with a
 * malformed value — we get a clean error state instead of a crash or
 * a misread navigation.
 */
const returnParamsSchema = z.object({
  // Reserved for future use (e.g. the API could append ?status=updated).
  status: z.enum(["updated", "canceled"]).optional(),
});

export default function SubscriptionReturnScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const rawParams = useLocalSearchParams();
  const { tier, tierName, isLoading, error: entitlementsError } =
    useEntitlements();

  const paramsResult = useMemo(
    () => returnParamsSchema.safeParse(rawParams),
    [rawParams],
  );

  const [isRefreshing, setIsRefreshing] = useState(true);
  const [refreshError, setRefreshError] = useState<Error | null>(null);
  const previousTierRef = useRef<SubscriptionTier>(tier);
  const [tierChanged, setTierChanged] = useState(false);

  // Capture the tier before refresh so we can classify the direction
  // of change once the refetch settles.
  useEffect(() => {
    previousTierRef.current = tier;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- capture initial tier only

  // Invalidate entitlements on mount to fetch fresh data
  useEffect(() => {
    if (!paramsResult.success) {
      // Malformed deep link — skip the refresh, show the error state.
      setIsRefreshing(false);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      try {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.entitlements.all(),
        });
      } catch (err) {
        if (!cancelled) {
          logger.error(
            "Failed to refresh entitlements after portal return",
            err,
          );
          setRefreshError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    };
    refresh();
    return () => {
      cancelled = true;
    };
  }, [queryClient, paramsResult.success]);

  // Detect tier change after refresh completes
  useEffect(() => {
    if (!paramsResult.success) return;
    if (refreshError || entitlementsError) return;
    if (!isRefreshing && !isLoading) {
      if (tier !== previousTierRef.current) {
        setTierChanged(true);
      } else {
        // No change — navigate home silently
        router.replace("/(app)/(tabs)/home");
      }
    }
  }, [
    isRefreshing,
    isLoading,
    tier,
    router,
    paramsResult.success,
    refreshError,
    entitlementsError,
  ]);

  const handleContinue = () => {
    router.replace("/(app)/(tabs)/home");
  };

  // Malformed deep link — show an explicit, warm error state.
  // This only fires when the URL has unexpected param shapes
  // (e.g. someone manually hits the route with a bad ?status=...).
  if (!paramsResult.success) {
    logger.error(
      "Malformed subscription return deep link",
      paramsResult.error,
    );
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Image
          source={require("@/assets/images/muted-green-circle-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Something wasn’t right with that link.</Text>
        <Text style={styles.subtitle}>
          Your plan may still have updated — open the menu to check your
          current plan.
        </Text>
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed,
          ]}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  // Entitlements refresh failed — don't pretend anything changed.
  if (refreshError || entitlementsError) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Image
          source={require("@/assets/images/muted-green-circle-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>We couldn’t refresh your plan.</Text>
        <Text style={styles.subtitle}>
          Your changes in billing likely went through. Pull to refresh on the
          home screen in a moment to see the latest.
        </Text>
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed,
          ]}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  // Show loading while refreshing
  if (isRefreshing || isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Image
          source={require("@/assets/images/muted-green-circle-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
        <Text style={styles.loadingText}>Updating your plan...</Text>
      </View>
    );
  }

  // Tier changed — classify direction and show appropriate copy.
  if (tierChanged) {
    const previousTier = previousTierRef.current;
    const displayName = TIER_DISPLAY[tier] || tierName;
    const isUpgrade = TIER_RANK[tier] > TIER_RANK[previousTier];

    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Image
          source={require("@/assets/images/muted-green-circle-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {isUpgrade ? (
          <>
            <View style={styles.successIcon}>
              <Ionicons
                name="checkmark-circle"
                size={48}
                color={colors.success}
              />
            </View>
            <Text style={styles.title}>Welcome to {displayName}.</Text>
            <Text style={styles.subtitle}>
              Your plan has been updated. Enjoy your new features.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>
              You’re now on the {displayName} plan.
            </Text>
            <Text style={styles.subtitle}>
              Your plan has been updated. Everything you’ve added is still
              here.
            </Text>
          </>
        )}

        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed,
          ]}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  // Fallback — shouldn't reach here since no-change navigates home
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: spacing.xl,
  },
  loader: {
    marginBottom: spacing.md,
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.featureInformationTint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
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
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.pill,
    alignItems: "center",
    width: "100%",
  },
  continueButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  continueButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
});
