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
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/constants/theme';
import { formStyles } from './formStyles';
import type { EntryFormProps } from '../registry';

interface ContactMetadata {
  firstName: string;
  lastName: string;
  relationship: string;
  phone?: string;
  email?: string;
  reason?: string;
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

  // Parse initial metadata
  const initialMetadata = initialData?.metadata as ContactMetadata | undefined;

  const [firstName, setFirstName] = useState(initialMetadata?.firstName ?? '');
  const [lastName, setLastName] = useState(initialMetadata?.lastName ?? '');
  const [relationship, setRelationship] = useState(initialMetadata?.relationship ?? '');
  const [phone, setPhone] = useState(initialMetadata?.phone ?? '');
  const [email, setEmail] = useState(initialMetadata?.email ?? '');
  const [reason, setReason] = useState(initialMetadata?.reason ?? initialData?.notes ?? '');

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Contact' : 'Edit Contact',
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Required Field', 'Please enter a first name.');
      return;
    }
    if (!relationship.trim()) {
      Alert.alert('Required Field', 'Please enter a relationship.');
      return;
    }

    const title = `${firstName.trim()} ${lastName.trim()}`.trim();
    const metadata: ContactMetadata = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      relationship: relationship.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      reason: reason.trim() || undefined,
    };

    try {
      await onSave({
        title,
        notes: reason.trim() || undefined,
        metadata: metadata as unknown as Record<string, unknown>,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save contact';
      Alert.alert('Error', message);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    const name = `${firstName} ${lastName}`.trim() || 'this contact';
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
      style={formStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={formStyles.scrollView}
        contentContainerStyle={[formStyles.content, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="First Name"
          placeholder="Enter first name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />

        <Input
          label="Last Name"
          placeholder="Enter last name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />

        <Input
          label="Relationship"
          placeholder="e.g., Sister, Attorney, Friend"
          value={relationship}
          onChangeText={setRelationship}
          autoCapitalize="words"
        />

        <Input
          label="Phone (Optional)"
          placeholder="(555) 123-4567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Input
          label="Email (Optional)"
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextArea
          label="Why this person? (Optional)"
          placeholder="What makes them the right contact?"
          value={reason}
          onChangeText={setReason}
        />

        <View style={formStyles.buttonContainer}>
          <Button
            title={isSaving ? 'Saving...' : 'Save'}
            onPress={handleSave}
            disabled={isSaving}
          />
        </View>

        {!isNew && onDelete && (
          <View style={formStyles.deleteContainer}>
            <Button
              title="Delete Contact"
              variant="destructive"
              onPress={handleDelete}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
