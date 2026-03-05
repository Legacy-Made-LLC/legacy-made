/**
 * ErrorScreen - Full-screen error state for critical failures
 *
 * Displayed when the app cannot load essential data (e.g., plan fetch fails).
 * Two variants: offline (no internet) and generic API error.
 * Styled to feel calm and reassuring, consistent with Legacy Made's tone.
 */

import {
  borderRadius,
  colors,
  spacing,
  typography,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface ErrorScreenProps {
  /** Whether the device is offline */
  isOffline?: boolean;
  /** Callback to retry the failed operation */
  onRetry: () => void | Promise<void>;
  /** Optional error detail shown in dev builds */
  errorDetail?: string;
}

export function ErrorScreen({ isOffline = false, onRetry, errorDetail }: ErrorScreenProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      // Small delay so the spinner doesn't flash
      setTimeout(() => setIsRetrying(false), 600);
    }
  }, [onRetry]);

  const icon = isOffline ? "cloud-offline-outline" : "alert-circle-outline";
  const title = isOffline
    ? "You\u2019re offline"
    : "Something isn\u2019t working";
  const message = isOffline
    ? "Connect to the internet to access your Legacy Made information."
    : "We couldn\u2019t load your information right now. Please try again in a moment.";

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={48} color={colors.textTertiary} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed,
            isRetrying && styles.retryButtonDisabled,
          ]}
          onPress={handleRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.retryButtonText}>Try Again</Text>
          )}
        </Pressable>

        {errorDetail ? (
          <Text style={styles.errorDetail}>{errorDetail}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  content: {
    alignItems: "center",
    maxWidth: 320,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.serifSemiBold,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.primary,
    height: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.pill,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 160,
  },
  retryButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  retryButtonDisabled: {
    backgroundColor: colors.border,
  },
  retryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
  errorDetail: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
