/**
 * UpgradePrompt - Bottom sheet modal encouraging upgrade
 *
 * Uses @gorhom/bottom-sheet BottomSheetModal for native-feeling animations
 * that render at the root level via portal.
 * Positive framing (sparkles, not locks) and warm messaging.
 * Easy to dismiss with "Maybe later" option.
 */

import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullWindowOverlay } from "react-native-screens";

import { EXTERNAL_LINKS } from "@/constants/links";
import { borderRadius, colors, spacing, typography } from "@/constants/theme";

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  /** Optional callback when upgrade is opened */
  onUpgrade?: () => void;
  /** When true, hides the upgrade button (e.g., for shared plan limits) */
  hideUpgradeAction?: boolean;
}

export function UpgradePrompt({
  visible,
  onClose,
  title = "Unlock More Features",
  message = "You've made great progress organizing your legacy. Upgrade to continue adding more and unlock additional features.",
  onUpgrade,
  hideUpgradeAction = false,
}: UpgradePromptProps) {
  const insets = useSafeAreaInsets();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
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

  const handleUpgrade = () => {
    onUpgrade?.();
    bottomSheetModalRef.current?.dismiss();
    WebBrowser.openBrowserAsync(EXTERNAL_LINKS.upgrade);
  };

  const handleDismiss = () => {
    bottomSheetModalRef.current?.dismiss();
  };

  // Use FullWindowOverlay on iOS to render above other modals
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
      ref={bottomSheetModalRef}
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
        {/* Sparkles icon - positive framing */}
        <View style={styles.iconContainer}>
          <Ionicons name="sparkles" size={32} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Upgrade button — hidden for shared plan limits */}
        {!hideUpgradeAction && (
          <Pressable
            onPress={handleUpgrade}
            style={({ pressed }) => [
              styles.upgradeButton,
              pressed && styles.upgradeButtonPressed,
            ]}
          >
            <Text style={styles.upgradeButtonText}>Upgrade Your Plan</Text>
          </Pressable>
        )}

        {/* Dismiss option */}
        <Pressable
          onPress={handleDismiss}
          style={({ pressed }) => [
            hideUpgradeAction ? styles.upgradeButton : styles.dismissButton,
            pressed && (hideUpgradeAction ? styles.upgradeButtonPressed : styles.dismissButtonPressed),
          ]}
        >
          <Text style={hideUpgradeAction ? styles.upgradeButtonText : styles.dismissButtonText}>
            {hideUpgradeAction ? "OK" : "Maybe Later"}
          </Text>
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
    backgroundColor: "#E8F0E6", // Soft sage
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
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  upgradeButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  upgradeButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  upgradeButtonText: {
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
