import {
  ContactFormFieldsWithForm
} from '@/components/forms/ContactFormFields';
import { contactSchemaWithRequiredPhone } from '@/components/forms';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { onboardingStyles as styles } from '@/components/onboarding/onboardingStyles';
import { useOnboardingContext } from '@/data/OnboardingContext';
import { revalidateLogic, useForm, useStore } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    contactFirstName,
    setContactFirstName,
    contactLastName,
    setContactLastName,
    contactPhone,
    setContactPhone,
    contactRelationship,
    setContactRelationship,
    contactEmail,
    setContactEmail,
  } = useOnboardingContext();

  const form = useForm({
    defaultValues: {
      firstName: contactFirstName,
      lastName: contactLastName,
      relationship: contactRelationship,
      phone: contactPhone,
      email: contactEmail,
      reason: '', // Not used in onboarding
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: contactSchemaWithRequiredPhone,
    },
    onSubmit: async ({ value }) => {
      // Update context with final values
      setContactFirstName(value.firstName);
      setContactLastName(value.lastName);
      setContactPhone(value.phone);
      setContactRelationship(value.relationship);
      setContactEmail(value.email);
      router.push('/(onboarding)/success');
    },
  });

  // Sync form changes to context so values persist during navigation
  const formValues = useStore(form.store, (state) => state.values);

  React.useEffect(() => {
    // Only sync if values have changed
    if (formValues.firstName !== contactFirstName) setContactFirstName(formValues.firstName);
    if (formValues.lastName !== contactLastName) setContactLastName(formValues.lastName);
    if (formValues.phone !== contactPhone) setContactPhone(formValues.phone);
    if (formValues.relationship !== contactRelationship) setContactRelationship(formValues.relationship);
    if (formValues.email !== contactEmail) setContactEmail(formValues.email);
  }, [formValues, contactFirstName, contactLastName, contactPhone, contactRelationship, contactEmail, setContactFirstName, setContactLastName, setContactPhone, setContactRelationship, setContactEmail]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <OnboardingHeader showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.formScrollView}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.formTitle}>Who should be called first?</Text>
          <Text style={styles.formSubtitle}>
            This is the first person your family would reach out to.
          </Text>

          <ContactFormFieldsWithForm form={form} showReasonField={false} phoneRequired={true} />

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
                    Save and Continue
                  </Text>
                </Pressable>
              )}
            </form.Subscribe>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
