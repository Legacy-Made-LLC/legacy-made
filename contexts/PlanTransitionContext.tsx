/**
 * PlanTransitionContext - Smooth cross-fade overlay when switching between plans
 *
 * Provides a `transition(label, action)` function that:
 * 1. Fades in a branded overlay
 * 2. Executes the plan switch action while the overlay is opaque
 * 3. Holds briefly for the UI to settle
 * 4. Fades the overlay out to reveal the new state
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, spacing, typography } from "@/constants/theme";
import { scheduleOnRN } from "react-native-worklets";

// ─── Timing ──────────────────────────────────────────────────────────────────

const FADE_IN_MS = 250;
const HOLD_MS = 750;
const FADE_OUT_MS = 350;

// ─── Context ─────────────────────────────────────────────────────────────────

interface PlanTransitionContextType {
  /**
   * Trigger a cross-fade transition.
   * @param label  Text shown during the transition (e.g. "Viewing Sarah's Plan")
   * @param action Callback executed while the overlay is fully opaque
   */
  transition: (label: string, action: () => void) => void;
}

const PlanTransitionContext = createContext<
  PlanTransitionContextType | undefined
>(undefined);

export function usePlanTransition() {
  const ctx = useContext(PlanTransitionContext);
  if (!ctx) {
    throw new Error(
      "usePlanTransition must be used within PlanTransitionProvider",
    );
  }
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

interface PlanTransitionProviderProps {
  children: ReactNode;
}

export function PlanTransitionProvider({
  children,
}: PlanTransitionProviderProps) {
  const [label, setLabel] = useState("");
  const [active, setActive] = useState(false);
  const opacity = useSharedValue(0);
  const actionRef = useRef<(() => void) | null>(null);

  const hide = useCallback(() => {
    setActive(false);
    setLabel("");
  }, []);

  const fadeOut = useCallback(() => {
    opacity.value = withTiming(0, { duration: FADE_OUT_MS }, (finished) => {
      if (finished) scheduleOnRN(hide);
    });
  }, [hide, opacity]);

  const onFadeInComplete = useCallback(() => {
    // Execute the plan switch while overlay is opaque
    actionRef.current?.();
    actionRef.current = null;

    // Hold briefly for the UI to settle, then fade out
    setTimeout(fadeOut, HOLD_MS);
  }, [fadeOut]);

  const transition = useCallback(
    (transitionLabel: string, action: () => void) => {
      actionRef.current = action;
      setLabel(transitionLabel);
      setActive(true);

      // Ensure we start from 0
      opacity.value = 0;

      // Kick off fade-in on next frame (after the view renders)
      requestAnimationFrame(() => {
        opacity.value = withTiming(1, { duration: FADE_IN_MS }, (finished) => {
          if (finished) scheduleOnRN(onFadeInComplete);
        });
      });
    },
    [onFadeInComplete, opacity],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <PlanTransitionContext.Provider value={{ transition }}>
      {children}
      {active && (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.overlay, animatedStyle]}
          pointerEvents="auto"
        >
          <View style={styles.content}>
            <Image
              source={require("@/assets/images/muted-green-circle-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.label}>{label}</Text>
            <ActivityIndicator
              size="small"
              color={colors.textTertiary}
              style={styles.spinner}
            />
          </View>
        </Animated.View>
      )}
    </PlanTransitionContext.Provider>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: 56,
    height: 56,
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: typography.fontFamily.serifSemiBold,
    fontSize: typography.sizes.titleLarge,
    color: colors.textPrimary,
    textAlign: "center",
  },
  spinner: {
    marginTop: spacing.lg,
    opacity: 0.5,
  },
});
