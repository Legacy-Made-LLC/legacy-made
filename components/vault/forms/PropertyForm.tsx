/**
 * PropertyForm - Form for creating/editing property and vehicle entries
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

const propertyTypes = [
  'Real Estate',
  'Vehicle',
  'Storage Unit',
  'Recurring Bill',
  'Other',
] as const;

type PropertyType = (typeof propertyTypes)[number];

interface PropertyMetadata {
  responsibilityType: PropertyType;
  provider?: string;
  accountInfo?: string;
  frequency?: string;
  notes?: string;
}

export function PropertyForm({
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

  const initialMetadata = initialData?.metadata as PropertyMetadata | undefined;

  const [itemName, setItemName] = useState(initialData?.title ?? '');
  const [propertyType, setPropertyType] = useState<PropertyType>(
    initialMetadata?.responsibilityType ?? 'Real Estate'
  );
  const [accountInfo, setAccountInfo] = useState(initialMetadata?.accountInfo ?? '');
  const [notes, setNotes] = useState(initialMetadata?.notes ?? initialData?.notes ?? '');

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Property' : 'Edit Property',
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    if (!itemName.trim()) {
      Alert.alert('Required Field', 'Please enter a name.');
      return;
    }

    const metadata: PropertyMetadata = {
      responsibilityType: propertyType,
      accountInfo: accountInfo.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      await onSave({
        title: itemName.trim(),
        notes: notes.trim() || undefined,
        metadata: metadata as unknown as Record<string, unknown>,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save property';
      Alert.alert('Error', message);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      'Delete Property',
      `Are you sure you want to delete ${itemName || 'this item'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to delete property';
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
          label="Name"
          placeholder="e.g., Primary Residence, Honda CR-V"
          value={itemName}
          onChangeText={setItemName}
        />

        <View style={formStyles.fieldContainer}>
          <Text style={formStyles.label}>Type</Text>
          <View style={formStyles.typeGrid}>
            {propertyTypes.map((type) => (
              <Pressable
                key={type}
                style={[
                  formStyles.typeButton,
                  propertyType === type && formStyles.typeButtonSelected,
                ]}
                onPress={() => setPropertyType(type)}
              >
                <Text
                  style={[
                    formStyles.typeButtonText,
                    propertyType === type && formStyles.typeButtonTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Input
          label="Details (Optional)"
          placeholder="e.g., Address, license plate, account number"
          value={accountInfo}
          onChangeText={setAccountInfo}
        />

        <TextArea
          label="Notes (Optional)"
          placeholder="Any additional details"
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
              title="Delete Property"
              variant="destructive"
              onPress={handleDelete}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
