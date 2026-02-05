/**
 * ContactFormFields - Shared contact form fields component
 *
 * Used in both onboarding and vault contact forms to ensure consistent UI.
 */

import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { Select } from '@/components/ui/Select';
import { spacing } from '@/constants/theme';
import { formatPhoneNumber } from './form-utils';
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

      {/* Relationship */}
      <form.Field name="relationship">
        {(field: Parameters<typeof FormInput>[0]['field']) => (
          <Select
            label="Relationship"
            value={field.state.value}
            onValueChange={field.handleChange}
            options={RELATIONSHIP_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
            placeholder="Select relationship"
          />
        )}
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
});
