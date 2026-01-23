/**
 * ContactFormFields - Shared contact form fields component
 *
 * Used in both onboarding and vault contact forms to ensure consistent UI.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';

// Relationship options for dropdown
export const RELATIONSHIP_OPTIONS = [
  'Spouse / Partner',
  'Child',
  'Sibling',
  'Parent',
  'Close Friend',
  'Attorney',
  'Financial Advisor',
  'Accountant',
  'Doctor',
  'Other',
];

// Format phone number as (XXX) XXX-XXXX
export function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/\D/g, '');
  const limited = numbers.slice(0, 10);

  if (limited.length === 0) {
    return '';
  } else if (limited.length <= 3) {
    return `(${limited}`;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email: string;
  reason: string;
}

interface ContactFormFieldsProps {
  /** Current form data */
  data: ContactFormData;
  /** Callback when any field changes */
  onChange: (data: ContactFormData) => void;
  /** Whether to show the "Why this person?" field */
  showReasonField?: boolean;
  /** Whether phone is required */
  phoneRequired?: boolean;
  /** Custom label for the reason field */
  reasonLabel?: string;
  /** Custom placeholder for the reason field */
  reasonPlaceholder?: string;
}

export function ContactFormFields({
  data,
  onChange,
  showReasonField = true,
  phoneRequired = false,
  reasonLabel = 'Why this person? (Optional)',
  reasonPlaceholder = 'What makes them the right contact?',
}: ContactFormFieldsProps) {
  const [showRelationshipPicker, setShowRelationshipPicker] = useState(false);

  const updateField = <K extends keyof ContactFormData>(
    field: K,
    value: ContactFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const handlePhoneChange = (value: string) => {
    updateField('phone', formatPhoneNumber(value));
  };

  const handleSelectRelationship = (option: string) => {
    updateField('relationship', option);
    setShowRelationshipPicker(false);
  };

  return (
    <>
      {/* First Name */}
      <View style={styles.formField}>
        <Text style={styles.formLabel}>FIRST NAME</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Enter first name"
          placeholderTextColor={colors.textTertiary}
          value={data.firstName}
          onChangeText={(v) => updateField('firstName', v)}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Last Name */}
      <View style={styles.formField}>
        <Text style={styles.formLabel}>LAST NAME</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Enter last name"
          placeholderTextColor={colors.textTertiary}
          value={data.lastName}
          onChangeText={(v) => updateField('lastName', v)}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Phone */}
      <View style={styles.formField}>
        <Text style={styles.formLabel}>
          PHONE{phoneRequired ? '' : ' (OPTIONAL)'}
        </Text>
        <TextInput
          style={styles.formInput}
          placeholder="(555) 123-4567"
          placeholderTextColor={colors.textTertiary}
          value={data.phone}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          autoCorrect={false}
          maxLength={14}
        />
      </View>

      {/* Relationship - Dropdown */}
      <View style={styles.formField}>
        <Text style={styles.formLabel}>RELATIONSHIP</Text>
        <Pressable
          style={styles.dropdownButton}
          onPress={() => setShowRelationshipPicker(true)}
        >
          <Text
            style={[
              styles.dropdownButtonText,
              !data.relationship && styles.dropdownPlaceholder,
            ]}
          >
            {data.relationship || 'Select relationship'}
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
                    data.relationship === option && styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectRelationship(option)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      data.relationship === option && styles.modalOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                  {data.relationship === option && (
                    <Text style={styles.modalCheckmark}>✓</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Email */}
      <View style={styles.formField}>
        <Text style={styles.formLabel}>EMAIL (OPTIONAL)</Text>
        <TextInput
          style={styles.formInput}
          placeholder="email@example.com"
          placeholderTextColor={colors.textTertiary}
          value={data.email}
          onChangeText={(v) => updateField('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Why this person? (Optional) */}
      {showReasonField && (
        <View style={styles.formField}>
          <Text style={styles.formLabel}>{reasonLabel.toUpperCase()}</Text>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            placeholder={reasonPlaceholder}
            placeholderTextColor={colors.textTertiary}
            value={data.reason}
            onChangeText={(v) => updateField('reason', v)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  formField: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.label,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  formInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    height: 52,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
  },

  // Dropdown
  dropdownButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  dropdownPlaceholder: {
    color: colors.textTertiary,
  },
  dropdownChevron: {
    fontSize: 24,
    color: colors.textTertiary,
    transform: [{ rotate: '90deg' }],
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    paddingVertical: spacing.lg,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  modalOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOptionPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  modalOptionSelected: {
    backgroundColor: colors.surfaceSecondary,
  },
  modalOptionText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  modalOptionTextSelected: {
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  modalCheckmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
});
