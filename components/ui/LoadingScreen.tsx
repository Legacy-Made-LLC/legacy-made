import { colors, spacing, typography } from "@/constants/theme";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

interface ErrorScreenProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorScreen({
  message = "Something went wrong",
  onRetry,
}: ErrorScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Unable to load</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry && (
        <Button
          title="Try Again"
          onPress={onRetry}
          style={styles.retryButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  message: {
    marginTop: spacing.md,
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.sizes.titleLarge,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  retryButton: {
    minWidth: 150,
  },
});
