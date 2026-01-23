/**
 * InsuranceForm - Form for creating/editing insurance policy entries
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

const policyTypes = [
  'Life',
  'Health',
  'Home',
  'Auto',
  'Disability',
  'Other',
] as const;

type PolicyType = (typeof policyTypes)[number];

interface InsuranceMetadata {
  provider: string;
  policyType: PolicyType;
  policyNumber?: string;
  contactInfo?: string;
  coverageDetails?: string;
}

export function InsuranceForm({
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

  const initialMetadata = initialData?.metadata as InsuranceMetadata | undefined;

  const [policyName, setPolicyName] = useState(initialData?.title ?? '');
  const [provider, setProvider] = useState(initialMetadata?.provider ?? '');
  const [policyType, setPolicyType] = useState<PolicyType>(
    initialMetadata?.policyType ?? 'Life'
  );
  const [policyNumber, setPolicyNumber] = useState(initialMetadata?.policyNumber ?? '');
  const [coverageDetails, setCoverageDetails] = useState(initialMetadata?.coverageDetails ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Policy' : 'Edit Policy',
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    if (!policyName.trim()) {
      Alert.alert('Required Field', 'Please enter a policy name.');
      return;
    }
    if (!provider.trim()) {
      Alert.alert('Required Field', 'Please enter a provider.');
      return;
    }

    const metadata: InsuranceMetadata = {
      provider: provider.trim(),
      policyType,
      policyNumber: policyNumber.trim() || undefined,
      coverageDetails: coverageDetails.trim() || undefined,
    };

    try {
      await onSave({
        title: policyName.trim(),
        notes: notes.trim() || undefined,
        metadata: metadata as unknown as Record<string, unknown>,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save policy';
      Alert.alert('Error', message);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      'Delete Policy',
      `Are you sure you want to delete ${policyName || 'this policy'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to delete policy';
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
          label="Policy Name"
          placeholder="e.g., Life Insurance"
          value={policyName}
          onChangeText={setPolicyName}
        />

        <Input
          label="Provider"
          placeholder="e.g., Northwestern Mutual"
          value={provider}
          onChangeText={setProvider}
        />

        <View style={formStyles.fieldContainer}>
          <Text style={formStyles.label}>Policy Type</Text>
          <View style={formStyles.typeGrid}>
            {policyTypes.map((type) => (
              <Pressable
                key={type}
                style={[
                  formStyles.typeButton,
                  policyType === type && formStyles.typeButtonSelected,
                ]}
                onPress={() => setPolicyType(type)}
              >
                <Text
                  style={[
                    formStyles.typeButtonText,
                    policyType === type && formStyles.typeButtonTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Input
          label="Policy Number (Optional)"
          placeholder="e.g., LF-2847592"
          value={policyNumber}
          onChangeText={setPolicyNumber}
        />

        <Input
          label="Coverage Amount (Optional)"
          placeholder="e.g., $500,000"
          value={coverageDetails}
          onChangeText={setCoverageDetails}
        />

        <TextArea
          label="Notes (Optional)"
          placeholder="Any additional details about this policy"
          value={notes}
          onChangeText={setNotes}
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
              title="Delete Policy"
              variant="destructive"
              onPress={handleDelete}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
