/**
 * ReminderEnablePrompt — Bottom sheet that softly asks users if they'd like
 * reminder notifications after they've started a section and returned.
 *
 * Follows the same pattern as NotificationPermissionPrompt.tsx:
 * BottomSheetModal, two-button layout, calm Legacy Made aesthetic.
 */

import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullWindowOverlay } from "react-native-screens";

import { borderRadius, colors, spacing, typography } from "@/constants/theme";

interface ReminderEnablePromptProps {
  shouldShowPrompt: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

export function ReminderEnablePrompt({
  shouldShowPrompt,
  onAccept,
  onDismiss,
}: ReminderEnablePromptProps) {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (shouldShowPrompt) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [shouldShowPrompt]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onDismiss();
      }
    },
    [onDismiss],
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

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      containerComponent={containerComponent}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView
        style={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        {/* Bell icon in sage green */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="notifications-outline"
            size={32}
            color={colors.primary}
          />
        </View>

        <Text style={styles.title}>Want a gentle reminder?</Text>

        <Text style={styles.body}>
          We{"\u2019"}ll send a calm nudge to continue building your plan.
        </Text>

        {/* Primary action */}
        <Pressable
          onPress={onAccept}
          style={({ pressed }) => [
            styles.acceptButton,
            pressed && styles.acceptButtonPressed,
          ]}
        >
          <Text style={styles.acceptButtonText}>Yes, remind me</Text>
        </Pressable>

        {/* Subtle dismiss */}
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [
            styles.dismissButton,
            pressed && styles.dismissButtonPressed,
          ]}
        >
          <Text style={styles.dismissButtonText}>Not now</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

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
    backgroundColor: colors.featureInformationTint,
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
  acceptButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  acceptButtonPressed: {
    opacity: 0.9,
  },
  acceptButtonText: {
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
