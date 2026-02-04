/**
 * ContactFormFields - Shared contact form fields component
 *
 * Used in both onboarding and vault contact forms to ensure consistent UI.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { formatPhoneNumber, getErrorMessage } from './form-utils';
import { FormInput } from './FormInput';
import { FormTextArea } from './FormTextArea';

// Relationship options for dropdown
export const RELATIONSHIP_OPTIONS = [
  'Spouse / Partner',
  'Child',
  'Sibling',
  'Parent',
  'Close Family',
  'Close Friend',
  'Attorney',
  'Financial Advisor',
  'Accountant',
  'Doctor',
  'Other',
] as const;


export interface ContactFormData {
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email: string;
  reason: string;
}

// ============================================================================
// TanStack Form Version
// ============================================================================

interface ContactFormFieldsWithFormProps {
  /** TanStack Form instance - uses any to avoid complex generic constraints */
   
  form: any;
  showReasonField?: boolean;
  phoneRequired?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
}

export function ContactFormFieldsWithForm({
  form,
  showReasonField = true,
  phoneRequired = false,
  reasonLabel = 'Why this person?',
  reasonPlaceholder = 'What makes them the right contact?',
}: ContactFormFieldsWithFormProps) {
  const [showRelationshipPicker, setShowRelationshipPicker] = useState(false);

  return (
    <>
      {/* First Name & Last Name - Two columns */}
      <View style={styles.nameRow}>
        <View style={styles.nameField}>
          <form.Field name="firstName">
            {(field: Parameters<typeof FormInput>[0]['field']) => (
              <FormInput
                field={field}
                label="First Name"
                placeholder="First name"
                autoCapitalize="words"
                autoCorrect={false}
                containerStyle={styles.nameFieldInput}
              />
            )}
          </form.Field>
        </View>

        <View style={styles.nameField}>
          <form.Field name="lastName">
            {(field: Parameters<typeof FormInput>[0]['field']) => (
              <FormInput
                field={field}
                label="Last Name"
                placeholder="Last name"
                autoCapitalize="words"
                autoCorrect={false}
                containerStyle={styles.nameFieldInput}
              />
            )}
          </form.Field>
        </View>
      </View>

      {/* Relationship - Dropdown (custom component, can't use FormInput) */}
      <form.Field name="relationship">
        {(field: Parameters<typeof FormInput>[0]['field']) => {
          const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
          const errorMessage = hasError ? getErrorMessage(field.state.meta.errors[0]) : null;

          return (
            <View style={styles.formField}>
              <Text style={styles.formLabel}>RELATIONSHIP</Text>
              <Pressable
                style={[styles.dropdownButton, hasError && styles.dropdownError]}
                onPress={() => setShowRelationshipPicker(true)}
              >
                <Text
                  style={[
                    styles.dropdownButtonText,
                    !field.state.value && styles.dropdownPlaceholder,
                  ]}
                >
                  {field.state.value || 'Select relationship'}
                </Text>
                <Text style={styles.dropdownChevron}>›</Text>
              </Pressable>
              {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

              {/* Relationship Picker Modal */}
              <Modal
                visible={showRelationshipPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowRelationshipPicker(false)}
              >
                <Pressable
                  style={styles.modalOverlay}
                  onPress={() => {
                    setShowRelationshipPicker(false);
                    field.handleBlur();
                  }}
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
                            field.state.value === option && styles.modalOptionSelected,
                          ]}
                          onPress={() => {
                            field.handleChange(option);
                            setShowRelationshipPicker(false);
                            field.handleBlur();
                          }}
                        >
                          <Text
                            style={[
                              styles.modalOptionText,
                              field.state.value === option && styles.modalOptionTextSelected,
                            ]}
                          >
                            {option}
                          </Text>
                          {field.state.value === option && (
                            <Text style={styles.modalCheckmark}>✓</Text>
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </Pressable>
              </Modal>
            </View>
          );
        }}
      </form.Field>

      {/* Phone */}
      <form.Field name="phone">
        {(field: Parameters<typeof FormInput>[0]['field']) => (
          <FormInput
            field={field}
            label="Phone"
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            autoCorrect={false}
            maxLength={14}
            onValueChange={(v) => field.handleChange(formatPhoneNumber(v))}
          />
        )}
      </form.Field>

      {/* Email */}
      <form.Field name="email">
        {(field: Parameters<typeof FormInput>[0]['field']) => (
          <FormInput
            field={field}
            label="Email"
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
      </form.Field>

      {/* Why this person?  */}
      {showReasonField && (
        <form.Field name="reason">
          {(field: Parameters<typeof FormTextArea>[0]['field']) => (
            <FormTextArea
              field={field}
              label={reasonLabel}
              placeholder={reasonPlaceholder}
            />
          )}
        </form.Field>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  nameField: {
    flex: 1,
  },
  nameFieldInput: {
    marginBottom: 0, // Override FormInput's default margin since nameRow handles spacing
  },
  formField: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.label,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  errorText: {
    fontSize: typography.sizes.caption,
    color: colors.error,
    marginTop: spacing.xs,
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
  dropdownError: {
    borderColor: colors.error,
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
