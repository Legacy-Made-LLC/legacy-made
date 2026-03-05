import { Select } from '@/components/ui/Select';
import { RELATIONSHIP_OPTIONS } from '@/components/forms/ContactFormFields';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { onboardingStyles as styles } from '@/components/onboarding/onboardingStyles';
import { colors, spacing, typography } from '@/constants/theme';
import { useOnboardingContext } from '@/data/OnboardingContext';
import { FormInput } from '@/components/forms/FormInput';
import { getErrorMessage } from '@/components/forms/form-utils';
import { onboardingContactSchema } from '@/components/forms';
import { Ionicons } from '@expo/vector-icons';
import { revalidateLogic, useForm, useStore } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    contactFirstName,
    setContactFirstName,
    contactLastName,
    setContactLastName,
    contactRelationship,
    setContactRelationship,
  } = useOnboardingContext();

  const form = useForm({
    defaultValues: {
      firstName: contactFirstName,
      lastName: contactLastName,
      relationship: contactRelationship,
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: onboardingContactSchema,
    },
    onSubmit: async ({ value }) => {
      setContactFirstName(value.firstName);
      setContactLastName(value.lastName);
      setContactRelationship(value.relationship);
      router.push('/(onboarding)/success');
    },
  });

  // Sync form changes to context so values persist during navigation
  const formValues = useStore(form.store, (state) => state.values);

  React.useEffect(() => {
    if (formValues.firstName !== contactFirstName) setContactFirstName(formValues.firstName);
    if (formValues.lastName !== contactLastName) setContactLastName(formValues.lastName);
    if (formValues.relationship !== contactRelationship) setContactRelationship(formValues.relationship);
  }, [formValues, contactFirstName, contactLastName, contactRelationship, setContactFirstName, setContactLastName, setContactRelationship]);

  const handleSkip = () => {
    router.push('/(onboarding)/account-creation');
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <OnboardingHeader showBackButton currentStep={3} />

      <KeyboardAwareScrollView
        style={styles.formScrollView}
        contentContainerStyle={styles.formContent}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="call-outline" size={26} color={colors.primary} />
        </View>
        <Text style={styles.formTitle}>Who should be called first?</Text>
        <Text style={styles.formSubtitle}>
          The primary point of contact. Someone you trust to help coordinate and
          guide others when it matters most.
        </Text>
        <Text style={localStyles.laterHint}>
          You can add their contact details later.
        </Text>

        {/* First Name & Last Name */}
        <View style={localStyles.nameRow}>
          <View style={localStyles.nameField}>
            <form.Field name="firstName">
              {(field: Parameters<typeof FormInput>[0]['field']) => (
                <FormInput
                  field={field}
                  label="First name"
                  placeholder="First name"
                  autoCapitalize="words"
                  autoCorrect={false}
                  containerStyle={localStyles.nameFieldInput}
                />
              )}
            </form.Field>
          </View>

          <View style={localStyles.nameField}>
            <form.Field name="lastName">
              {(field: Parameters<typeof FormInput>[0]['field']) => (
                <FormInput
                  field={field}
                  label="Last name"
                  placeholder="Last name"
                  autoCapitalize="words"
                  autoCorrect={false}
                  containerStyle={localStyles.nameFieldInput}
                />
              )}
            </form.Field>
          </View>
        </View>

        {/* Relationship */}
        <form.Field name="relationship">
          {(field: Parameters<typeof FormInput>[0]['field']) => {
            const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
            const errorMsg = hasError ? getErrorMessage(field.state.meta.errors[0]) : null;
            return (
              <Select
                label="Relationship"
                value={field.state.value}
                onValueChange={field.handleChange}
                onBlur={field.handleBlur}
                options={RELATIONSHIP_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                placeholder="Select..."
                errorMessage={errorMsg}
              />
            );
          }}
        </form.Field>

        <Text style={localStyles.helperText}>
          This person should be someone who&apos;s organized and easy to reach.
        </Text>

        <View style={styles.formButtonContainer}>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                  (!canSubmit || isSubmitting) && styles.primaryButtonDisabled,
                ]}
                onPress={() => form.handleSubmit()}
                disabled={!canSubmit || isSubmitting}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    !canSubmit && styles.primaryButtonTextDisabled,
                  ]}
                >
                  Continue
                </Text>
              </Pressable>
            )}
          </form.Subscribe>
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={styles.skipText}>I&apos;ll do this later</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  nameField: {
    flex: 1,
  },
  nameFieldInput: {
    marginBottom: 0,
  },
  laterHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  helperText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
});
