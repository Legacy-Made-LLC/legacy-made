import { FormInput, signUpSchema } from "@/components/forms";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { onboardingStyles as styles } from "@/components/onboarding/onboardingStyles";
import { EXTERNAL_LINKS } from "@/constants/links";
import { colors } from "@/constants/theme";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { useSignUp } from "@clerk/clerk-expo";
import { revalidateLogic, useForm } from "@tanstack/react-form";
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

  const form = useForm({
    defaultValues: {
      firstName,
      lastName,
      email: userEmail,
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      if (!isLoaded) return;

      setIsLoading(true);
      setError("");

      try {
        // Update context with form values
        setFirstName(value.firstName.trim());
        setLastName(value.lastName.trim());
        setUserEmail(value.email.trim());

        await signUp.create({
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          emailAddress: value.email.trim(),
        });

        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
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
    },
  });

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
              <form.Field
                name="firstName"
                listeners={{
                  onChange: ({ value }) => setFirstName(value),
                }}
              >
                {(field) => (
                  <FormInput
                    field={field}
                    label="First Name"
                    placeholder="First"
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="givenName"
                  />
                )}
              </form.Field>
            </View>
            <View style={styles.nameField}>
              <form.Field
                name="lastName"
                listeners={{
                  onChange: ({ value }) => setLastName(value),
                }}
              >
                {(field) => (
                  <FormInput
                    field={field}
                    label="Last Name"
                    placeholder="Last"
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="familyName"
                  />
                )}
              </form.Field>
            </View>
          </View>

          <form.Field
            name="email"
            listeners={{
              onChange: ({ value }) => setUserEmail(value),
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                label="Email"
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />
            )}
          </form.Field>

          <View style={styles.formButtonContainer}>
            <Text style={styles.verificationExplanation}>
              We&apos;ll send a code to your email to verify it&apos;s you.
            </Text>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed,
                    (!canSubmit || isLoading || isSubmitting) &&
                      styles.primaryButtonDisabled,
                  ]}
                  onPress={() => form.handleSubmit()}
                  disabled={!canSubmit || isLoading || isSubmitting}
                >
                  {isLoading || isSubmitting ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text
                      style={[
                        styles.primaryButtonText,
                        !canSubmit && styles.primaryButtonTextDisabled,
                      ]}
                    >
                      Send verification code
                    </Text>
                  )}
                </Pressable>
              )}
            </form.Subscribe>
            <Text style={styles.termsText}>
              By continuing, you agree to our{" "}
              <Text
                style={styles.termsLink}
                onPress={() => Linking.openURL(EXTERNAL_LINKS.termsOfService)}
              >
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text
                style={styles.termsLink}
                onPress={() => Linking.openURL(EXTERNAL_LINKS.privacyPolicy)}
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
