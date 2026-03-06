/**
 * Subscription Portal Return Screen
 *
 * Handles: https://app.mylegacymade.com/subscription/return
 *
 * When the user returns from the Stripe Customer Portal, this screen
 * refreshes their entitlements and shows a brief confirmation before
 * navigating home.
 */

import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { SubscriptionTier } from "@/api/types";
import {
  borderRadius,
  colors,
  spacing,
  typography,
} from "@/constants/theme";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { queryKeys } from "@/lib/queryKeys";

const TIER_DISPLAY: Record<SubscriptionTier, string> = {
  free: "Free",
  individual: "Individual",
  family: "Family",
};

export default function SubscriptionReturnScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tier, tierName, isLoading } = useEntitlements();

  const [isRefreshing, setIsRefreshing] = useState(true);
  const previousTierRef = useRef<SubscriptionTier>(tier);
  const [tierChanged, setTierChanged] = useState(false);

  // Capture the tier before refresh
  useEffect(() => {
    previousTierRef.current = tier;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- capture initial tier only

  // Invalidate entitlements on mount to fetch fresh data
  useEffect(() => {
    const refresh = async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.entitlements.all(),
      });
      setIsRefreshing(false);
    };
    refresh();
  }, [queryClient]);

  // Detect tier change after refresh completes
  useEffect(() => {
    if (!isRefreshing && !isLoading) {
      if (tier !== previousTierRef.current) {
        setTierChanged(true);
      } else {
        // No change — navigate home silently
        router.replace("/(app)/(tabs)/home");
      }
    }
  }, [isRefreshing, isLoading, tier, router]);

  const handleContinue = () => {
    router.replace("/(app)/(tabs)/home");
  };

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

  // Tier upgraded — show warm confirmation
  if (tierChanged) {
    const displayName = TIER_DISPLAY[tier] || tierName;
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

        <View style={styles.successIcon}>
          <Ionicons
            name="checkmark-circle"
            size={48}
            color={colors.success}
          />
        </View>

        <Text style={styles.title}>Welcome to {displayName}!</Text>
        <Text style={styles.subtitle}>
          Your plan has been updated. Enjoy your new features.
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
