/**
 * DigitalForm - Form for creating/editing digital access entries
 */

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/constants/theme';
import { formStyles } from './formStyles';
import type { EntryFormProps } from '../registry';

const importanceLevels = ['Critical', 'High', 'Medium', 'Low'] as const;

type ImportanceLevel = (typeof importanceLevels)[number];

interface DigitalMetadata {
  service: string;
  username?: string;
  recoveryEmail?: string;
  importance: ImportanceLevel;
  notes?: string;
}

export function DigitalForm({
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

  const initialMetadata = initialData?.metadata as DigitalMetadata | undefined;

  const [accountName, setAccountName] = useState(initialData?.title ?? '');
  const [service, setService] = useState(initialMetadata?.service ?? '');
  const [username, setUsername] = useState(initialMetadata?.username ?? '');
  const [importance, setImportance] = useState<ImportanceLevel>(
    initialMetadata?.importance ?? 'Medium'
  );
  const [accessNotes, setAccessNotes] = useState(
    initialMetadata?.notes ?? initialData?.notes ?? ''
  );

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Account' : 'Edit Account',
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    if (!accountName.trim()) {
      Alert.alert('Required Field', 'Please enter an account name.');
      return;
    }
    if (!service.trim()) {
      Alert.alert('Required Field', 'Please enter the service/platform.');
      return;
    }

    const metadata: DigitalMetadata = {
      service: service.trim(),
      username: username.trim() || undefined,
      importance,
      notes: accessNotes.trim() || undefined,
    };

    try {
      await onSave({
        title: accountName.trim(),
        notes: accessNotes.trim() || undefined,
        metadata: metadata as unknown as Record<string, unknown>,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save account';
      Alert.alert('Error', message);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete ${accountName || 'this account'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to delete account';
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
          label="Account Name"
          placeholder="e.g., Primary Email"
          value={accountName}
          onChangeText={setAccountName}
        />

        <Input
          label="Service/Platform"
          placeholder="e.g., Gmail, 1Password, Apple ID"
          value={service}
          onChangeText={setService}
        />

        <Input
          label="Username/Email (Optional)"
          placeholder="e.g., email@example.com"
          value={username}
          onChangeText={setUsername}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={formStyles.fieldContainer}>
          <Text style={formStyles.label}>Importance</Text>
          <View style={formStyles.typeGrid}>
            {importanceLevels.map((level) => (
              <Pressable
                key={level}
                style={[
                  formStyles.typeButton,
                  importance === level && formStyles.typeButtonSelected,
                ]}
                onPress={() => setImportance(level)}
              >
                <Text
                  style={[
                    formStyles.typeButtonText,
                    importance === level && formStyles.typeButtonTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TextArea
          label="How to Access (Optional)"
          placeholder="Where can the password be found? Don't store the actual password here."
          value={accessNotes}
          onChangeText={setAccessNotes}
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
              title="Delete Account"
              variant="destructive"
              onPress={handleDelete}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
