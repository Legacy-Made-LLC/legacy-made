/**
 * KeyBackupNudge - Bottom sheet modal encouraging key backup
 *
 * Follows the NotificationPermissionPrompt pattern: BottomSheetModal with
 * dynamic sizing, pan-to-close, and FullWindowOverlay on iOS.
 */

import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React, { forwardRef, useCallback } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullWindowOverlay } from "react-native-screens";

import { borderRadius, colors, spacing, typography } from "@/constants/theme";

interface KeyBackupNudgeProps {
  /** Called when the modal is dismissed (swipe or after navigating to backup) */
  onModalDismissed: () => void;
  /** Called when user taps "Maybe later" */
  onSilence: () => void;
}

export const KeyBackupNudge = forwardRef<BottomSheetModal, KeyBackupNudgeProps>(
  function KeyBackupNudge({ onModalDismissed, onSilence }, ref) {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1) {
          onModalDismissed();
        }
      },
      [onModalDismissed],
    );

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.4}
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
      // Dismiss the sheet first — handleSheetChanges(-1) will call onModalDismissed
      if (typeof ref === "object" && ref?.current) {
        ref.current.dismiss();
      }
      router.push("/settings/key-backup" as never);
    };

    const handleMaybeLater = () => {
      onSilence();
      if (typeof ref === "object" && ref?.current) {
        ref.current.dismiss();
      }
    };

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        containerComponent={containerComponent}
        enablePanDownToClose
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetView
          style={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
        >
          {/* Shield icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={32}
              color={colors.primary}
            />
          </View>

          <Text style={styles.title}>Protect your data</Text>

          <Text style={styles.body}>
            Back up your encryption key so you never lose access to your
            information — even if you switch devices.
          </Text>

          {/* Primary action */}
          <Pressable
            onPress={handleBackUp}
            style={({ pressed }) => [
              styles.backUpButton,
              pressed && styles.backUpButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Back up encryption key"
          >
            <Text style={styles.backUpButtonText}>Back up key</Text>
          </Pressable>

          {/* Subtle dismiss */}
          <Pressable
            onPress={handleMaybeLater}
            style={({ pressed }) => [
              styles.dismissButton,
              pressed && styles.dismissButtonPressed,
            ]}
          >
            <Text style={styles.dismissButtonText}>Maybe later</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: colors.border,
    width: 36,
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
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: spacing.lg,
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
  backUpButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backUpButtonPressed: {
    opacity: 0.9,
  },
  backUpButtonText: {
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
