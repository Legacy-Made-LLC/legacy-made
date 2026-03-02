import { StyleSheet } from "react-native";

import { colors, spacing, typography } from "@/constants/theme";

export const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },

  // Header with back button and logo
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  headerLeft: {
    position: "absolute",
    left: spacing.lg,
    zIndex: 1,
    height: "100%",
    justifyContent: "center",
  },
  headerRight: {
    position: "absolute",
    right: spacing.lg,
    width: 24,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: colors.primary,
  },
  backButton: {
    padding: spacing.xs,
    borderRadius: 8,
  },
  backButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  logo: {
    width: 50,
    height: 50,
  },

  // Intro Screen
  introContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  introContent: {
    alignItems: "center",
  },
  stanzaContainer: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  stanzaText: {
    fontFamily: typography.fontFamily.serifMedium,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 18 * typography.lineHeights.relaxed,
  },
  buttonWrapper: {
    marginTop: spacing.lg,
    width: "100%",
  },
  buttonHelperText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.md,
  },

  // General Screen Layout
  screenContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
  },
  bottomButtonContainer: {
    paddingTop: spacing.lg,
  },

  // Typography
  headingSerif: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  bodyText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 18 * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
  bodyTextSecondary: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },

  // Buttons
  primaryButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonDisabled: {
    backgroundColor: colors.border,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
  primaryButtonTextDisabled: {
    color: colors.textTertiary,
  },

  // Form
  keyboardAvoid: {
    flex: 1,
  },
  formScrollView: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    flexGrow: 1,
  },
  formTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  formSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  formField: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.label,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  formInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    height: 52,
  },
  formButtonContainer: {
    marginTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  verificationExplanation: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  termsText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    textAlign: "center",
    lineHeight: typography.sizes.caption * typography.lineHeights.relaxed,
    marginTop: spacing.xl,
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: "underline",
  },

  // Dropdown
  dropdownButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownButtonText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  dropdownPlaceholder: {
    color: colors.textTertiary,
  },
  dropdownChevron: {
    fontSize: 24,
    color: colors.textTertiary,
    transform: [{ rotate: "90deg" }],
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: "100%",
    maxHeight: "70%",
    paddingVertical: spacing.lg,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  modalOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalOptionPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  modalOptionSelected: {
    backgroundColor: colors.surfaceSecondary,
  },
  modalOptionText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  modalOptionTextSelected: {
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  modalCheckmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: "600",
  },

  // Icon Container (for intro screens)
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: spacing.xl,
  },

  // Success Screen
  successCheckmark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
  successCheckmarkText: {
    fontSize: 40,
    color: colors.surface,
    fontWeight: "600",
  },

  // Account Creation Screen
  nameRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  nameField: {
    flex: 1,
  },

  // Error Display
  errorContainer: {
    backgroundColor: colors.error + "10",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.error,
  },

  // OTP Verification Screen
  emailHighlight: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  otpExplanation: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    textAlign: "center",
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  resendContainer: {
    alignItems: "center",
    paddingTop: spacing.lg,
  },
  resendText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resendLink: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.primary,
    paddingVertical: spacing.sm,
  },

  // Sign In Link
  signInContainer: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  signInText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
  signInLink: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
  },
});

// Intro messages for the animated intro screen
export const INTRO_MESSAGES = [
  "If something happened to you, would the people you love know what to do next?",
  "Most of us mean to get organized, but life gets busy.",
  "Legacy Made helps you put the important pieces in one calm place.",
];

// Animation timing constants
export const INTRO_ANIMATION = {
  STANZA_DELAY_INITIAL: 300,
  STANZA_DELAY: 3000, // 1200,
  FADE_DURATION: 800, // 600,
  MOVE_DURATION: 500, // 400,
  INITIAL_OFFSET: 20,
  CONTAINER_OFFSET_PER_ITEM: 20,
};
