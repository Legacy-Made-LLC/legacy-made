/**
 * ContactForm - Form for creating/editing contact entries
 *
 * Used for: contacts.primary, contacts.backup, people
 */

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContactFormFields, type ContactFormData } from '@/components/forms/ContactFormFields';
import { colors, spacing, typography } from '@/constants/theme';
import type { EntryFormProps } from '../registry';

interface ContactMetadata {
  firstName: string;
  lastName: string;
  relationship: string;
  phone?: string;
  email?: string;
  reason?: string;
  isPrimary?: boolean;
}

export function ContactForm({
  taskKey,
  entryId,
  initialData,
  onSave,
  onDelete,
  onCancel,
  isSaving,
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;

  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    relationship: '',
    phone: '',
    email: '',
    reason: '',
  });

  // Update form data when initialData loads
  useEffect(() => {
    if (initialData) {
      const metadata = initialData.metadata as unknown as ContactMetadata | undefined;
      setFormData({
        firstName: metadata?.firstName ?? '',
        lastName: metadata?.lastName ?? '',
        relationship: metadata?.relationship ?? '',
        phone: metadata?.phone ?? '',
        email: metadata?.email ?? '',
        reason: metadata?.reason ?? initialData.notes ?? '',
      });
    }
  }, [initialData]);

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Contact' : 'Edit Contact',
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    if (!formData.firstName.trim()) {
      Alert.alert('Required Field', 'Please enter a first name.');
      return;
    }
    if (!formData.relationship.trim()) {
      Alert.alert('Required Field', 'Please select a relationship.');
      return;
    }

    const title = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    const metadata: ContactMetadata = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      relationship: formData.relationship.trim(),
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      reason: formData.reason.trim() || undefined,
      isPrimary: taskKey === 'contacts.primary',
    };

    try {
      await onSave({
        title,
        notes: formData.reason.trim() || undefined,
        metadata: metadata as unknown as Record<string, unknown>,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save contact';
      Alert.alert('Error', message);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    const name = `${formData.firstName} ${formData.lastName}`.trim() || 'this contact';
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${name}?`,
      [
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
      ]
    );
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
        <ContactFormFields
          data={formData}
          onChange={setFormData}
          showReasonField={true}
          phoneRequired={false}
        />

        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
              isSaving && styles.primaryButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text
              style={[
                styles.primaryButtonText,
                isSaving && styles.primaryButtonTextDisabled,
              ]}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        {!isNew && onDelete && (
          <View style={styles.deleteContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deleteButtonPressed,
              ]}
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
