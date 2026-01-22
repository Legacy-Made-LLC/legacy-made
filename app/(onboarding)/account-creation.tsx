import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { onboardingStyles as styles } from "@/components/onboarding/onboardingStyles";
import { colors } from "@/constants/theme";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AccountCreationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp, isLoaded } = useSignUp();
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    userEmail,
    setUserEmail,
    setHasCompletedInitialOnboarding,
  } = useOnboardingContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    userEmail.trim().length > 0 &&
    userEmail.includes("@");

  const handleCreateAccount = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: userEmail.trim(),
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      router.push("/(onboarding)/verify-otp");
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      if (clerkError.errors && clerkError.errors.length > 0) {
        setError(clerkError.errors[0].message);
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    setHasCompletedInitialOnboarding(true);
    router.replace("/(auth)/sign-in");
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <OnboardingHeader showBackButton />

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
          <Text style={styles.formTitle}>Tell us about you</Text>
          <Text style={styles.formSubtitle}>
            This helps us personalize your experience and keep your information
            secure.
          </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <Text style={styles.formLabel}>FIRST NAME</Text>
              <TextInput
                style={styles.formInput}
                placeholder="First"
                placeholderTextColor={colors.textTertiary}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="givenName"
              />
            </View>
            <View style={styles.nameField}>
              <Text style={styles.formLabel}>LAST NAME</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Last"
                placeholderTextColor={colors.textTertiary}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="familyName"
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>EMAIL</Text>
            <TextInput
              style={styles.formInput}
              placeholder="your@email.com"
              placeholderTextColor={colors.textTertiary}
              value={userEmail}
              onChangeText={setUserEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />
          </View>

          <View style={styles.formButtonContainer}>
            <Text style={styles.verificationExplanation}>
              We&apos;ll send a code to your email to verify it&apos;s you.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                (!isValid || isLoading) && styles.primaryButtonDisabled,
              ]}
              onPress={handleCreateAccount}
              disabled={!isValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text
                  style={[
                    styles.primaryButtonText,
                    !isValid && styles.primaryButtonTextDisabled,
                  ]}
                >
                  Send verification code
                </Text>
              )}
            </Pressable>
            <Text style={styles.termsText}>
              By continuing, you agree to our{" "}
              <Text
                style={styles.termsLink}
                onPress={() =>
                  Linking.openURL("https://legacymade.com/terms-of-service")
                }
              >
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text
                style={styles.termsLink}
                onPress={() =>
                  Linking.openURL("https://legacymade.com/privacy-policy")
                }
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>
              Already have an account?{" "}
              <Text style={styles.signInLink} onPress={handleSignIn}>
                Sign In
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
