import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated } from "react-native";

import { logger } from "@/lib/logger";

interface SocialAuthResult {
  createdSessionId?: string | null;
  setActive?: (params: { session: string }) => Promise<void>;
}

/**
 * Shared hook for social sign-in buttons (Apple, Google).
 * Handles loading state, spinner animation, auth flow, and error handling.
 */
export function useSocialSignIn(
  startFlow: () => Promise<SocialAuthResult>,
  options: {
    /** Error codes that indicate the user cancelled (silently dismissed). */
    cancelCodes: string[];
    /** Display name for error alerts. */
    providerName: string;
  },
) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const spinnerOpacity = useRef(new Animated.Value(0)).current;
  const spinnerWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(spinnerOpacity, {
        toValue: isLoading ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(spinnerWidth, {
        toValue: isLoading ? 24 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isLoading, spinnerOpacity, spinnerWidth]);

  const handleSignIn = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { createdSessionId, setActive } = await startFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err: unknown) {
      const code =
        err != null &&
        typeof err === "object" &&
        "code" in err &&
        typeof (err as Record<string, unknown>).code === "string"
          ? ((err as Record<string, unknown>).code as string)
          : undefined;

      if (code && options.cancelCodes.includes(code)) {
        setIsLoading(false);
        return;
      }

      // Log the full error for debugging, but show a generic message to users
      logger.error(`${options.providerName} sign-in failed`, err);
      Alert.alert(
        "Sign-In Unavailable",
        `We couldn't complete ${options.providerName} sign-in right now. Please try again or use another sign-in method.`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, startFlow, options.cancelCodes, options.providerName, router]);

  return {
    isLoading,
    handleSignIn,
    spinnerOpacity,
    spinnerWidth,
  };
}
