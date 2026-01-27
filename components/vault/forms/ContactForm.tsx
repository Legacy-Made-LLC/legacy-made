/**
 * ContactForm - Form for creating/editing contact entries
 *
 * Used for: contacts.primary, contacts.backup, people
 */

import { contactSchemaWithRequiredPhone } from '@/components/forms';
import { ContactFormFieldsWithForm } from '@/components/forms/ContactFormFields';
import { colors, spacing, typography } from '@/constants/theme';
import { revalidateLogic, useForm } from '@tanstack/react-form';
import { useNavigation } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { EntryFormProps } from '../registry';

interface ContactMetadata {
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email?: string;
  reason?: string;
  isPrimary?: boolean;
}

interface ContactFormValues {
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email: string;
  reason: string;
}

export function ContactForm({
  taskKey,
  entryId,
  initialData,
  onSave,
  onDelete,
  isSaving,
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;

  // Extract initial values from initialData
  const initialMetadata = initialData?.metadata as unknown as ContactMetadata | undefined;

  const defaultValues = useMemo<ContactFormValues>(
    () => ({
      firstName: initialMetadata?.firstName ?? '',
      lastName: initialMetadata?.lastName ?? '',
      relationship: initialMetadata?.relationship ?? '',
      phone: initialMetadata?.phone ?? '',
      email: initialMetadata?.email ?? '',
      reason: initialMetadata?.reason ?? initialData?.notes ?? '',
    }),
    [initialMetadata, initialData?.notes]
  );

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: contactSchemaWithRequiredPhone,
    },
    onSubmit: async ({ value }) => {
      const title = `${value.firstName.trim()} ${value.lastName.trim()}`.trim();
      const metadata: ContactMetadata = {
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        relationship: value.relationship.trim(),
        phone: value.phone.trim(),
        email: value.email.trim() || undefined,
        reason: value.reason.trim() || undefined,
        isPrimary: taskKey === 'contacts.primary',
      };

      try {
        await onSave({
          title,
          notes: value.reason.trim() || undefined,
          metadata: metadata as unknown as Record<string, unknown>,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save contact';
        Alert.alert('Error', message);
      }
    },
  });

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Contact' : 'Edit Contact',
    });
  }, [isNew, navigation]);

  const handleDelete = () => {
    if (!onDelete) return;

    const firstName = form.getFieldValue('firstName');
    const lastName = form.getFieldValue('lastName');
    const name = `${firstName} ${lastName}`.trim() || 'this contact';
    Alert.alert('Delete Contact', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await onDelete();
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete contact';
            Alert.alert('Error', message);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ContactFormFieldsWithForm form={form} showReasonField={true} phoneRequired={true} />

        <View style={styles.buttonContainer}>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                  (isSaving || isSubmitting || !canSubmit) && styles.primaryButtonDisabled,
                ]}
                onPress={() => form.handleSubmit()}
                disabled={isSaving || isSubmitting || !canSubmit}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    (isSaving || isSubmitting) && styles.primaryButtonTextDisabled,
                  ]}
                >
                  {isSaving || isSubmitting ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            )}
          </form.Subscribe>
        </View>

        {!isNew && onDelete && (
          <View style={styles.deleteContainer}>
            <Pressable
              style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Delete Contact</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonDisabled: {
    backgroundColor: colors.border,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
  primaryButtonTextDisabled: {
    color: colors.textTertiary,
  },
  deleteContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  deleteButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  deleteButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    color: colors.error,
  },
});
