import { useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, spacing, typography } from '@/constants/theme';

export default function SignInScreen() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [emailAddress, setEmailAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onContinuePress = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      // Create sign-in attempt and send OTP
      const { supportedFirstFactors } = await signIn.create({
        identifier: emailAddress,
      });

      // Find the email code factor
      const emailCodeFactor = supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code'
      );

      if (emailCodeFactor && 'emailAddressId' in emailCodeFactor) {
        // Send the OTP
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailCodeFactor.emailAddressId,
        });

        // Navigate to OTP verification
        router.push({
          pathname: '/(auth)/verify-otp',
          params: { email: emailAddress, mode: 'sign-in' },
        });
      } else {
        setError('Email sign-in is not available for this account.');
      }
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
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            {"Enter your email and we'll send you a code to sign in."}
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            value={emailAddress}
            placeholder="Enter your email"
            onChangeText={setEmailAddress}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoFocus
          />

          <Button
            title={isLoading ? 'Sending code...' : 'Continue'}
            onPress={onContinuePress}
            disabled={isLoading || !emailAddress}
            style={styles.button}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{"Don't have an account?"}</Text>
          <Link href="/(auth)/sign-up" asChild>
            <Button title="Create Account" onPress={() => { }} variant="subtle" />
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
