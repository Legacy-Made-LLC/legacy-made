import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { onboardingStyles as styles } from "@/components/onboarding/onboardingStyles";
import { ContactFormFields, type ContactFormData } from "@/components/forms/ContactFormFields";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { useRouter } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

  // Build the form data object for the shared component
  const formData: ContactFormData = {
    firstName: contactFirstName,
    lastName: contactLastName,
    relationship: contactRelationship,
    phone: contactPhone,
    email: contactEmail,
    reason: '', // Not used in onboarding
  };

  // Handle form data changes from the shared component
  const handleFormChange = (data: ContactFormData) => {
    setContactFirstName(data.firstName);
    setContactLastName(data.lastName);
    setContactPhone(data.phone);
    setContactRelationship(data.relationship);
    setContactEmail(data.email);
  };

  const isValid =
    contactFirstName.trim().length > 0 &&
    contactPhone.trim().length > 0 &&
    contactRelationship.trim().length > 0;

  const handleSave = () => {
    if (isValid) {
      router.push("/(onboarding)/success");
    }
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
          <Text style={styles.formTitle}>Who should be called first?</Text>
          <Text style={styles.formSubtitle}>
            This is the first person your family would reach out to.
          </Text>

          <ContactFormFields
            data={formData}
            onChange={handleFormChange}
            showReasonField={false}
            phoneRequired={true}
          />

          <View style={styles.formButtonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                !isValid && styles.primaryButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!isValid}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  !isValid && styles.primaryButtonTextDisabled,
                ]}
              >
                Save and Continue
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
