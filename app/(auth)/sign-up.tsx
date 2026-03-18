import { useSignUp } from "@clerk/expo/legacy";
import { revalidateLogic, useForm } from '@tanstack/react-form';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormInput, signUpSchema } from '@/components/forms';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography } from '@/constants/theme';
import { logger } from '@/lib/logger';
import { Ionicons } from '@expo/vector-icons';

export default function SignUpScreen() {
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      if (!isLoaded) return;

      setIsLoading(true);
      setError('');

      try {
        // Create account with name and email, then send OTP
        await signUp.create({
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          emailAddress: value.email.trim(),
        });

        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

        // Navigate to OTP verification
        router.push({
          pathname: '/(auth)/verify-otp',
          params: { email: value.email, mode: 'sign-up' },
        });
      } catch (err: unknown) {
        const clerkError = err as { errors?: { message: string }[] };
        if (clerkError.errors && clerkError.errors.length > 0) {
          setError(clerkError.errors[0].message);
        } else {
          setError('An error occurred. Please try again.');
        }
        logger.error("Sign-up failed", err);
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.lg },
      ]}
      bottomOffset={20}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
        <Pressable
          onPress={router.back}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Tell us about you</Text>
          <Text style={styles.subtitle}>
            This helps us personalize your experience and keep your information secure.
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <form.Field name="firstName">
                {(field) => (
                  <FormInput
                    field={field}
                    label="First Name"
                    placeholder="First name"
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="givenName"
                    autoFocus
                  />
                )}
              </form.Field>
            </View>
            <View style={styles.nameField}>
              <form.Field name="lastName">
                {(field) => (
                  <FormInput
                    field={field}
                    label="Last Name"
                    placeholder="Last name"
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="familyName"
                  />
                )}
              </form.Field>
            </View>
          </View>

          <form.Field name="email">
            {(field) => (
              <FormInput
                field={field}
                label="Email"
                placeholder="your@email.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            )}
          </form.Field>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                title={isLoading || isSubmitting ? 'Creating account...' : 'Continue'}
                onPress={() => form.handleSubmit()}
                disabled={isLoading || isSubmitting || !canSubmit}
                style={styles.button}
              />
            )}
          </form.Subscribe>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/(auth)/sign-in" asChild>
            <Button title="Sign In" onPress={() => { }} variant="subtle" />
          </Link>
        </View>
    </KeyboardAwareScrollView>
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
    alignSelf: 'flex-start',
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
  form: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nameField: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: colors.error + '10',
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
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  footerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
