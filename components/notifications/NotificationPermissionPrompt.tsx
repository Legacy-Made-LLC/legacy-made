/**
 * NotificationPermissionPrompt — Bottom sheet that asks for push notification
 * permission after the user adds their first trusted contact.
 *
 * Matches Legacy Made's calm aesthetic: personalized copy, warm colors,
 * easy dismissal.
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
import { useNotificationPrompt } from "@/contexts/NotificationPromptContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function NotificationPermissionPrompt() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { shouldShowPrompt, contactFirstName, dismissPrompt } =
    useNotificationPrompt();
  const { requestPermission } = usePushNotifications();

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
        dismissPrompt();
      }
    },
    [dismissPrompt],
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

  const handleEnable = async () => {
    await requestPermission();
    dismissPrompt();
  };

  const handleDismiss = () => {
    dismissPrompt();
  };

  const containerComponent = useCallback(
    ({ children }: { children?: React.ReactNode }) =>
      Platform.OS === "ios" ? (
        <FullWindowOverlay>{children}</FullWindowOverlay>
      ) : (
        <>{children}</>
      ),
    [],
  );

  const bodyText = contactFirstName
    ? `We\u2019ll let you know when ${contactFirstName} responds to your invitation.`
    : "We\u2019ll let you know when your contacts respond to invitations.";

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
        {/* Bell icon in feature family color */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="notifications-outline"
            size={32}
            color={colors.featureFamily}
          />
        </View>

        <Text style={styles.title}>Stay in the loop</Text>

        <Text style={styles.body}>{bodyText}</Text>

        {/* Primary action */}
        <Pressable
          onPress={handleEnable}
          style={({ pressed }) => [
            styles.enableButton,
            pressed && styles.enableButtonPressed,
          ]}
        >
          <Text style={styles.enableButtonText}>Enable Notifications</Text>
        </Pressable>

        {/* Subtle dismiss */}
        <Pressable
          onPress={handleDismiss}
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
    backgroundColor: colors.featureFamilyTint,
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
  enableButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.featureFamily,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  enableButtonPressed: {
    opacity: 0.9,
  },
  enableButtonText: {
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
