/**
 * EncryptionMigrationModal - Non-dismissable modal for E2EE migration
 *
 * Shows progress as pre-encryption data is encrypted, handles failures
 * with a retry option, and transitions to key backup encouragement on completion.
 */

import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullWindowOverlay } from "react-native-screens";

import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import type { MigrationModalPhase } from "@/hooks/useAutoMigration";
import type { MigrationProgress } from "@/hooks/useMigration";

interface EncryptionMigrationModalProps {
  phase: MigrationModalPhase;
  progress: MigrationProgress;
  onRetry: () => void;
  onDismiss: () => void;
}

export interface EncryptionMigrationModalRef {
  present: () => void;
  dismiss: () => void;
}

export const EncryptionMigrationModal = forwardRef<
  EncryptionMigrationModalRef,
  EncryptionMigrationModalProps
>(function EncryptionMigrationModal(
  { phase, progress, onRetry, onDismiss },
  ref,
) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sheetRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  // Present/dismiss based on phase
  useEffect(() => {
    if (phase !== "hidden") {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [phase]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="none"
      />
    ),
    [],
  );

  const containerComponent = useCallback(
    ({ children }: { children?: React.ReactNode }) =>
      Platform.OS === "ios" ? (
        <FullWindowOverlay>{children}</FullWindowOverlay>
      ) : (
        <>{children}</>
      ),
    [],
  );

  const handleBackUp = () => {
    onDismiss();
    // Small delay to allow the sheet to dismiss before navigating
    setTimeout(() => {
      router.push("/settings/key-backup" as never);
    }, 300);
  };

  const handleNotNow = () => {
    onDismiss();
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose={phase === "complete"}
      backdropComponent={renderBackdrop}
      containerComponent={containerComponent}
      handleIndicatorStyle={
        phase === "complete"
          ? styles.handleIndicator
          : styles.handleIndicatorHidden
      }
      backgroundStyle={styles.sheetBackground}
      onChange={(index) => {
        // If the sheet is dismissed (only possible when complete), update parent
        if (index === -1 && phase === "complete") {
          onDismiss();
        }
      }}
    >
      <BottomSheetView
        style={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        {phase === "encrypting" && <EncryptingContent progress={progress} />}
        {phase === "failed" && (
          <FailedContent progress={progress} onRetry={onRetry} />
        )}
        {phase === "complete" && (
          <CompleteContent onBackUp={handleBackUp} onNotNow={handleNotNow} />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

// ─── Encrypting phase ───────────────────────────────────────────────

function EncryptingContent({ progress }: { progress: MigrationProgress }) {
  const total =
    progress.totalEntries + progress.totalWishes + progress.totalMessages;
  const migrated =
    progress.migratedEntries +
    progress.migratedWishes +
    progress.migratedMessages;

  // Gentle pulsing animation on the shield icon
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200 }),
        withTiming(1, { duration: 1200 }),
      ),
      -1,
      true,
    );
  }, [pulseValue]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const statusText = useMemo(() => {
    if (total === 0) return "Checking your data...";
    if (migrated === 0) return "Preparing to encrypt...";
    return `Encrypting item ${migrated} of ${total}...`;
  }, [total, migrated]);

  return (
    <View style={styles.phaseContainer}>
      <Animated.View style={[styles.iconContainer, pulseStyle]}>
        <Ionicons
          name="shield-checkmark-outline"
          size={32}
          color={colors.primary}
        />
      </Animated.View>

      <Text style={styles.title}>Your privacy is getting upgraded</Text>

      <Text style={styles.body}>
        We&apos;re encrypting your existing data so only you can read it. This
        will just take a moment.
      </Text>

      <View style={styles.progressRow}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    </View>
  );
}

// ─── Failed phase ───────────────────────────────────────────────────

function FailedContent({
  progress,
  onRetry,
}: {
  progress: MigrationProgress;
  onRetry: () => void;
}) {
  const failedCount =
    progress.failedEntries.length +
    progress.failedWishes.length +
    progress.failedMessages.length;

  const errorMessage = progress.error
    ? progress.error
    : `${failedCount} item${failedCount === 1 ? "" : "s"} couldn\u2019t be encrypted.`;

  return (
    <View style={styles.phaseContainer}>
      <View style={[styles.iconContainer, styles.iconContainerWarning]}>
        <Ionicons
          name="alert-circle-outline"
          size={32}
          color={colors.warning}
        />
      </View>

      <Text style={styles.title}>Something went wrong</Text>

      <Text style={styles.body}>
        {errorMessage} Please check your connection and try again.
      </Text>

      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text style={styles.primaryButtonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

// ─── Complete phase ─────────────────────────────────────────────────

function CompleteContent({
  onBackUp,
  onNotNow,
}: {
  onBackUp: () => void;
  onNotNow: () => void;
}) {
  return (
    <View style={styles.phaseContainer}>
      <View style={[styles.iconContainer, styles.iconContainerSuccess]}>
        <Ionicons
          name="checkmark-circle-outline"
          size={32}
          color={colors.success}
        />
      </View>

      <Text style={styles.title}>Your data is now encrypted</Text>

      <Text style={styles.body}>
        Everything is protected with end-to-end encryption. Only you can read
        your information.{"\n\n"}
        To make sure you never lose access, back up your encryption key now.
      </Text>

      <Pressable
        onPress={onBackUp}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Back up encryption key"
      >
        <Text style={styles.primaryButtonText}>Back up key</Text>
      </Pressable>

      <Pressable
        onPress={onNotNow}
        style={({ pressed }) => [
          styles.dismissButton,
          pressed && styles.dismissButtonPressed,
        ]}
      >
        <Text style={styles.dismissButtonText}>I&apos;ll do this later</Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: colors.border,
    width: 36,
  },
  handleIndicatorHidden: {
    backgroundColor: "transparent",
    width: 0,
    height: 0,
  },
  sheetBackground: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  phaseContainer: {
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  iconContainerWarning: {
    backgroundColor: `${colors.warning}15`,
  },
  iconContainerSuccess: {
    backgroundColor: `${colors.success}15`,
  },
  title: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: spacing.md,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
  dismissButton: {
    paddingVertical: spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  dismissButtonPressed: {
    opacity: 0.7,
  },
  dismissButtonText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
});
