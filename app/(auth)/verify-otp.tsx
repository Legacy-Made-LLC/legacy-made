import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function VerifyOtpScreen() {
  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email: string; mode: 'sign-in' | 'sign-up' }>();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const email = params.email || '';
  const mode = params.mode || 'sign-in';
  const isSignIn = mode === 'sign-in';

  const onVerifyPress = async () => {
    if (isSignIn && !isSignInLoaded) return;
    if (!isSignIn && !isSignUpLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      if (isSignIn) {
        // Verify sign-in OTP
        const result = await signIn!.attemptFirstFactor({
          strategy: 'email_code',
          code,
        });

        if (result.status === 'complete') {
          await setSignInActive!({ session: result.createdSessionId });
          router.replace('/(app)');
        } else {
          setError('Verification could not be completed. Please try again.');
        }
      } else {
        // Verify sign-up OTP
        const result = await signUp!.attemptEmailAddressVerification({ code });

        if (result.status === 'complete') {
          await setSignUpActive!({ session: result.createdSessionId });
          router.replace('/(app)');
        } else {
          setError('Verification could not be completed. Please try again.');
        }
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      if (clerkError.errors && clerkError.errors.length > 0) {
        setError(clerkError.errors[0].message);
      } else {
        setError('Invalid code. Please try again.');
      }
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const onResendCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (isSignIn && signIn) {
        const { supportedFirstFactors } = signIn;
        const emailCodeFactor = supportedFirstFactors?.find(
          (factor) => factor.strategy === 'email_code'
        );
        if (emailCodeFactor && 'emailAddressId' in emailCodeFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailCodeFactor.emailAddressId,
          });
        }
      } else if (signUp) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      }
      setError('');
      setCode('');
    } catch (err) {
      setError('Could not resend code. Please try again.');
      console.error(err);
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
      >
        <View style={styles.header}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            {"We sent a code to "}<Text style={styles.emailText}>{email}</Text>
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
            title={isLoading ? 'Verifying...' : 'Verify'}
            onPress={onVerifyPress}
            disabled={isLoading || code.length < 6}
            style={styles.button}
          />
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
