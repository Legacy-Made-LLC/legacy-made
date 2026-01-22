import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import {
  formatPhoneNumber,
  onboardingStyles as styles,
  RELATIONSHIP_OPTIONS,
} from "@/components/onboarding/onboardingStyles";
import { colors } from "@/constants/theme";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ContactFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    contactName,
    setContactName,
    contactPhone,
    setContactPhone,
    contactRelationship,
    setContactRelationship,
    contactEmail,
    setContactEmail,
  } = useOnboardingContext();

  const [showRelationshipPicker, setShowRelationshipPicker] = useState(false);

  const handlePhoneChange = (value: string) => {
    setContactPhone(formatPhoneNumber(value));
  };

  const handleSelectRelationship = (option: string) => {
    setContactRelationship(option);
    setShowRelationshipPicker(false);
  };

  const isValid =
    contactName.trim().length > 0 &&
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

          <View style={styles.formField}>
            <Text style={styles.formLabel}>NAME</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g., Sarah Johnson"
              placeholderTextColor={colors.textTertiary}
              value={contactName}
              onChangeText={setContactName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>PHONE NUMBER</Text>
            <TextInput
              style={styles.formInput}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.textTertiary}
              value={contactPhone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              autoCorrect={false}
              maxLength={14}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>RELATIONSHIP</Text>
            <Pressable
              style={styles.dropdownButton}
              onPress={() => setShowRelationshipPicker(true)}
            >
              <Text
                style={[
                  styles.dropdownButtonText,
                  !contactRelationship && styles.dropdownPlaceholder,
                ]}
              >
                {contactRelationship || "Select relationship"}
              </Text>
              <Text style={styles.dropdownChevron}>›</Text>
            </Pressable>
          </View>

          {/* Relationship Picker Modal */}
          <Modal
            visible={showRelationshipPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowRelationshipPicker(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setShowRelationshipPicker(false)}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Relationship</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <Pressable
                      key={option}
                      style={({ pressed }) => [
                        styles.modalOption,
                        pressed && styles.modalOptionPressed,
                        contactRelationship === option &&
                          styles.modalOptionSelected,
                      ]}
                      onPress={() => handleSelectRelationship(option)}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          contactRelationship === option &&
                            styles.modalOptionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                      {contactRelationship === option && (
                        <Text style={styles.modalCheckmark}>✓</Text>
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </Pressable>
          </Modal>

          <View style={styles.formField}>
            <Text style={styles.formLabel}>EMAIL (OPTIONAL)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="email@example.com"
              placeholderTextColor={colors.textTertiary}
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

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
