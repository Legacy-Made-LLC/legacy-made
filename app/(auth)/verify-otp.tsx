import { useSignIn, useSignUp } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { colors, spacing, typography } from "@/constants/theme";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { logger } from "@/lib/logger";

export default function VerifyOtpScreen() {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    email: string;
    mode: "sign-in" | "sign-up";
  }>();

  const { setHasCompletedInitialOnboarding } = useOnboardingContext();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const email = params.email || "";
  const mode = params.mode || "sign-in";
  const isSignIn = mode === "sign-in";

  const onVerifyPress = async () => {
    if (isSignIn && !signIn) return;
    if (!isSignIn && !signUp) return;

    setIsLoading(true);
    setError("");

    try {
      if (isSignIn) {
        // Verify sign-in OTP
        const { error: verifyError } = await signIn!.emailCode.verifyCode({
          code,
        });

        if (verifyError) {
          setError(verifyError.message || "Invalid code. Please try again.");
          return;
        }

        if (signIn!.status === "complete") {
          setHasCompletedInitialOnboarding(true);
          await signIn!.finalize();
          router.replace("/(app)");
        } else {
          setError("Verification could not be completed. Please try again.");
        }
      } else {
        // Verify sign-up OTP
        const { error: verifyError } =
          await signUp!.verifications.verifyEmailCode({ code });

        if (verifyError) {
          setError(verifyError.message || "Invalid code. Please try again.");
          return;
        }

        if (signUp!.status === "complete") {
          setHasCompletedInitialOnboarding(true);
          await signUp!.finalize();
          router.replace("/(app)");
        } else {
          setError("Verification could not be completed. Please try again.");
        }
      }
    } catch (err: unknown) {
      setError("Invalid code. Please try again.");
      logger.error("OTP verification failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const onResendCode = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (isSignIn && signIn) {
        const { error: sendError } = await signIn.emailCode.sendCode();
        if (sendError) {
          setError(sendError.message || "Could not resend code. Please try again.");
          return;
        }
      } else if (signUp) {
        const { error: sendError } = await signUp.verifications.sendEmailCode();
        if (sendError) {
          setError(sendError.message || "Could not resend code. Please try again.");
          return;
        }
      }
      setCode("");
    } catch (err) {
      setError("Could not resend code. Please try again.");
      logger.error("OTP resend failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={router.back}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a verification code to{" "}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
          <Text style={styles.explanation}>
            This helps us verify that it&apos;s really you and keeps your
            information secure.
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Verification Code"
            value={code}
            placeholder="Enter 6-digit code"
            onChangeText={setCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoFocus
          />

          <Button
            title={isLoading ? "Verifying..." : "Verify"}
            onPress={onVerifyPress}
            disabled={isLoading || code.length < 6}
            style={styles.button}
          />

          <Text style={styles.spamHint}>
            Don&apos;t see it? Check your spam or junk folder.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{"Didn't receive a code?"}</Text>
          <Button
            title="Resend Code"
            onPress={onResendCode}
            variant="subtle"
            disabled={isLoading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: spacing.xs,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  backButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.displayLarge,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  emailText: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  explanation: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
    marginTop: spacing.md,
  },
  spamHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.md,
  },
  form: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: colors.error + "10",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.error,
  },
  button: {
    marginTop: spacing.sm,
  },
  footer: {
    alignItems: "center",
    paddingTop: spacing.xl,
  },
  footerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
