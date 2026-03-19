import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { onboardingStyles as styles } from "@/components/onboarding/onboardingStyles";
import { colors } from "@/constants/theme";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { logger } from "@/lib/logger";
import { useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp } = useSignUp();
  const {
    userEmail,
    otpCode,
    setOtpCode,
    contactFirstName,
    contactLastName,
    contactPhone,
    contactRelationship,
    contactEmail,
    setPendingContact,
    setHasCompletedInitialOnboarding,
    resetOnboardingState,
  } = useOnboardingContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerifyOtp = async () => {
    if (!signUp) return;

    setIsLoading(true);
    setError("");

    try {
      const { error: verifyError } =
        await signUp.verifications.verifyEmailCode({
          code: otpCode,
        });

      if (verifyError) {
        setError(verifyError.message || "Invalid code. Please try again.");
        return;
      }

      if (signUp.status === "complete") {
        // Save the pending contact for later (only if user entered contact info)
        if (contactFirstName.trim() && contactLastName.trim()) {
          setPendingContact({
            firstName: contactFirstName.trim(),
            lastName: contactLastName.trim(),
            relationship: contactRelationship.trim(),
            phone: contactPhone.trim() || undefined,
            email: contactEmail.trim() || undefined,
          });
        }

        // Mark onboarding as complete
        setHasCompletedInitialOnboarding(true);

        // Reset the temporary form state
        resetOnboardingState();

        // Activate session and navigate to the main app
        await signUp.finalize();
        router.replace("/(app)");
      } else {
        setError("Verification could not be completed. Please try again.");
      }
    } catch (err) {
      setError("Invalid code. Please try again.");
      logger.error("OTP verification failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUp) return;

    setIsLoading(true);
    setError("");

    try {
      await signUp.verifications.sendEmailCode();
      setOtpCode("");
    } catch (err) {
      setError("Could not resend code. Please try again.");
      logger.error("OTP resend failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <OnboardingHeader showBackButton currentStep={6} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.formScrollView}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.formTitle}>Check your email</Text>
          <Text style={styles.formSubtitle}>
            We sent a verification code to{" "}
            <Text style={styles.emailHighlight}>{userEmail}</Text>
          </Text>
          <Text style={styles.otpExplanation}>
            This helps us verify that it&apos;s really you and keeps your
            information secure.
          </Text>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formField}>
            <Text style={styles.formLabel}>VERIFICATION CODE</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter 6-digit code"
              placeholderTextColor={colors.textTertiary}
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              maxLength={6}
              autoFocus
            />
          </View>

          <View style={styles.formButtonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                (otpCode.length < 6 || isLoading) &&
                  styles.primaryButtonDisabled,
              ]}
              onPress={handleVerifyOtp}
              disabled={otpCode.length < 6 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text
                  style={[
                    styles.primaryButtonText,
                    otpCode.length < 6 && styles.primaryButtonTextDisabled,
                  ]}
                >
                  Verify & Continue
                </Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.spamHint}>
            Don&apos;t see it? Check your spam or junk folder.
          </Text>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn&apos;t receive a code?</Text>
            <Pressable onPress={handleResendCode} disabled={isLoading}>
              <Text style={styles.resendLink}>Resend Code</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
