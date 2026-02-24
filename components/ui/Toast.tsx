/**
 * Custom Toast Configuration
 *
 * Styled to match the Legacy Made design system.
 * Renders at the bottom of the screen with calm, non-intrusive feedback.
 */

import { colors, spacing, typography, borderRadius } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ToastMessage, {
  type BaseToastProps,
  type ToastConfig,
} from "react-native-toast-message";

function SuccessToast({ text1, text2 }: BaseToastProps) {
  return (
    <View style={[styles.container, styles.successContainer]}>
      <View style={[styles.accent, styles.successAccent]} />
      <View style={styles.textContainer}>
        {text1 ? <Text style={styles.title}>{text1}</Text> : null}
        {text2 ? <Text style={styles.message}>{text2}</Text> : null}
      </View>
    </View>
  );
}

function ErrorToast({ text1, text2 }: BaseToastProps) {
  return (
    <View style={[styles.container, styles.errorContainer]}>
      <View style={[styles.accent, styles.errorAccent]} />
      <View style={styles.textContainer}>
        {text1 ? <Text style={styles.title}>{text1}</Text> : null}
        {text2 ? <Text style={styles.message}>{text2}</Text> : null}
      </View>
    </View>
  );
}

function InfoToast({ text1, text2 }: BaseToastProps) {
  return (
    <View style={[styles.container, styles.infoContainer]}>
      <View style={[styles.accent, styles.infoAccent]} />
      <View style={styles.textContainer}>
        {text1 ? <Text style={styles.title}>{text1}</Text> : null}
        {text2 ? <Text style={styles.message}>{text2}</Text> : null}
      </View>
    </View>
  );
}

const toastConfig: ToastConfig = {
  success: (props) => <SuccessToast {...props} />,
  error: (props) => <ErrorToast {...props} />,
  info: (props) => <InfoToast {...props} />,
};

/**
 * Toast component to render at the root layout.
 * Positioned at the bottom of the screen, above the safe area.
 */
export function Toast() {
  const insets = useSafeAreaInsets();

  return (
    <ToastMessage
      config={toastConfig}
      position="bottom"
      bottomOffset={insets.bottom + spacing.md}
      visibilityTime={4000}
      autoHide
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 48,
    maxWidth: 420,
    width: "90%",
  },
  successContainer: {
    backgroundColor: colors.surface,
  },
  errorContainer: {
    backgroundColor: colors.surface,
  },
  infoContainer: {
    backgroundColor: colors.surface,
  },
  accent: {
    width: 4,
    alignSelf: "stretch",
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
  },
  successAccent: {
    backgroundColor: colors.success,
  },
  errorAccent: {
    backgroundColor: colors.error,
  },
  infoAccent: {
    backgroundColor: colors.primary,
  },
  textContainer: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.bodySmall,
    color: colors.textPrimary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
  },
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: typography.sizes.caption * typography.lineHeights.normal,
  },
});
