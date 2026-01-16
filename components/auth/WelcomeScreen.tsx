import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors, spacing, typography } from '@/constants/theme';

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxl }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Legacy Made</Text>
          <Text style={styles.subtitle}>
            Organize what matters most{'\n'}so your family is never left guessing.
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📋</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Important Information</Text>
              <Text style={styles.featureDescription}>
                Contacts, accounts, documents — all in one place.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💝</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Calm & Human</Text>
              <Text style={styles.featureDescription}>
                A gentle approach to organizing life&apos;s essentials.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔒</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Private & Secure</Text>
              <Text style={styles.featureDescription}>
                Your information stays protected and under your control.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.buttons, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Link href="/(auth)/sign-in" asChild>
          <Button title="Sign In" onPress={() => {}} />
        </Link>
        <Link href="/(auth)/sign-up" asChild>
          <Button title="Create Account" onPress={() => {}} variant="secondary" />
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.sizes.displayLarge + 8,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.titleLarge,
    color: colors.textSecondary,
    lineHeight: typography.sizes.titleLarge * typography.lineHeights.relaxed,
  },
  features: {
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureIcon: {
    fontSize: 28,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    lineHeight: typography.sizes.body * typography.lineHeights.normal,
  },
  buttons: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
});
