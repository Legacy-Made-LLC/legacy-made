/**
 * PausedMutationBanner - Global floating banner for paused mutations
 *
 * Rendered once in the root layout. Uses `useMutationState` to detect ANY
 * paused mutation across the entire app — no per-form wiring needed.
 *
 * Includes a retry escape hatch:
 * - Taps 1–2: re-fetch network state via NetInfo
 * - Tap 3+: force onlineManager.setOnline(true) so HTTP decides truth
 */

import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { onlineManager, useMutationState } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FADE_DURATION = 200;
const FORCE_ONLINE_THRESHOLD = 3;

export function PausedMutationBanner() {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const retryCount = useRef(0);

  const pausedCount = useMutationState({
    filters: { status: "pending" },
    select: (mutation) => mutation.state.isPaused,
  }).filter(Boolean).length;

  const isPaused = pausedCount > 0;

  // Reset retry count when mutations are no longer paused
  useEffect(() => {
    if (!isPaused) {
      retryCount.current = 0;
    }
  }, [isPaused]);

  useEffect(() => {
    opacity.value = withTiming(isPaused ? 1 : 0, {
      duration: FADE_DURATION,
      easing: isPaused ? Easing.out(Easing.ease) : Easing.in(Easing.ease),
    });
  }, [isPaused, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value > 0.5 ? "auto" : "none",
  }));

  async function handleRetry() {
    retryCount.current += 1;

    if (retryCount.current >= FORCE_ONLINE_THRESHOLD) {
      // Force through — let the HTTP request determine truth
      onlineManager.setOnline(true);
    } else {
      // Re-fetch fresh network state
      const state = await NetInfo.fetch();
      onlineManager.setOnline(state.isConnected ?? true);
    }
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + spacing.md },
        animatedStyle,
      ]}
    >
      <View style={styles.pill}>
        <Ionicons
          name="cloud-offline-outline"
          size={16}
          color={colors.warning}
          style={styles.icon}
        />
        <Text style={styles.message} numberOfLines={1}>
          Waiting for connection…
        </Text>
        <Pressable onPress={handleRetry} hitSlop={8}>
          <Text style={styles.retryAction}>Try again</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.warning,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: "90%",
  },
  icon: {
    marginRight: spacing.xs,
  },
  message: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  retryAction: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
});
