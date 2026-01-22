import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, spacing, typography } from '@/constants/theme';

export default function SignUpScreen() {
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isFormValid = firstName.trim() && lastName.trim() && emailAddress.trim();

  const onContinuePress = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      // Create account with name and email, then send OTP
      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: emailAddress.trim(),
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Navigate to OTP verification
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email: emailAddress, mode: 'sign-up' },
      });
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      if (clerkError.errors && clerkError.errors.length > 0) {
        setError(clerkError.errors[0].message);
      } else {
        setError('An error occurred. Please try again.');
      }
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
              <Input
                label="First Name"
                value={firstName}
                placeholder="First name"
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="givenName"
                autoFocus
              />
            </View>
            <View style={styles.nameField}>
              <Input
                label="Last Name"
                value={lastName}
                placeholder="Last name"
                onChangeText={setLastName}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="familyName"
              />
            </View>
          </View>

          <Input
            label="Email"
            value={emailAddress}
            placeholder="your@email.com"
            onChangeText={setEmailAddress}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <Button
            title={isLoading ? 'Creating account...' : 'Continue'}
            onPress={onContinuePress}
            disabled={isLoading || !isFormValid}
            style={styles.button}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/(auth)/sign-in" asChild>
            <Button title="Sign In" onPress={() => {}} variant="subtle" />
          </Link>
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
