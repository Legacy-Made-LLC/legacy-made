/**
 * DocumentForm - Form for creating/editing legal document entries
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

const documentTypes = [
  'Will',
  'Trust',
  'Power of Attorney',
  'Healthcare Directive',
  'Birth Certificate',
  'Passport',
  'Other',
] as const;

type DocumentType = (typeof documentTypes)[number];

interface DocumentMetadata {
  documentType: DocumentType;
  location: string;
  holder?: string;
  notes?: string;
}

export function DocumentForm({
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

  const initialMetadata = initialData?.metadata as DocumentMetadata | undefined;

  const [documentName, setDocumentName] = useState(initialData?.title ?? '');
  const [documentType, setDocumentType] = useState<DocumentType>(
    initialMetadata?.documentType ?? 'Will'
  );
  const [location, setLocation] = useState(initialMetadata?.location ?? '');
  const [holder, setHolder] = useState(initialMetadata?.holder ?? '');
  const [notes, setNotes] = useState(initialMetadata?.notes ?? initialData?.notes ?? '');

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Document' : 'Edit Document',
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    if (!documentName.trim()) {
      Alert.alert('Required Field', 'Please enter a document name.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Required Field', 'Please enter the document location.');
      return;
    }

    const metadata: DocumentMetadata = {
      documentType,
      location: location.trim(),
      holder: holder.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      await onSave({
        title: documentName.trim(),
        notes: notes.trim() || undefined,
        metadata: metadata as unknown as Record<string, unknown>,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save document';
      Alert.alert('Error', message);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete ${documentName || 'this document'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to delete document';
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
          label="Document Name"
          placeholder="e.g., Last Will and Testament"
          value={documentName}
          onChangeText={setDocumentName}
        />

        <View style={formStyles.fieldContainer}>
          <Text style={formStyles.label}>Document Type</Text>
          <View style={formStyles.typeGrid}>
            {documentTypes.map((type) => (
              <Pressable
                key={type}
                style={[
                  formStyles.typeButton,
                  documentType === type && formStyles.typeButtonSelected,
                ]}
                onPress={() => setDocumentType(type)}
              >
                <Text
                  style={[
                    formStyles.typeButtonText,
                    documentType === type && formStyles.typeButtonTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Input
          label="Location"
          placeholder="e.g., Safe deposit box at Chase Bank"
          value={location}
          onChangeText={setLocation}
        />

        <Input
          label="Who Has a Copy? (Optional)"
          placeholder="e.g., Attorney David Park"
          value={holder}
          onChangeText={setHolder}
        />

        <TextArea
          label="Notes (Optional)"
          placeholder="Any additional details about this document"
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
              title="Delete Document"
              variant="destructive"
              onPress={handleDelete}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
