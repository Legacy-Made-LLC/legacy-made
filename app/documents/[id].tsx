import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { useAppContext } from '@/data/store';
import { colors, spacing } from '@/constants/theme';
import type { LegalDocument } from '@/data/types';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { getDocument, addDocument, updateDocument, deleteDocument } = useAppContext();

  const isNew = id === 'new';
  const existing = isNew ? undefined : getDocument(id);

  const [documentName, setDocumentName] = useState(existing?.documentName ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [dateCreated, setDateCreated] = useState(existing?.dateCreated ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Document' : 'Edit Document',
    });
  }, [isNew, navigation]);

  const handleSave = () => {
    if (!documentName.trim()) {
      Alert.alert('Required Field', 'Please enter a document name.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Required Field', 'Please enter a location.');
      return;
    }

    const data: Omit<LegalDocument, 'id'> = {
      documentName: documentName.trim(),
      location: location.trim(),
      dateCreated: dateCreated.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (isNew) {
      addDocument(data);
    } else {
      updateDocument(id, data);
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete ${documentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDocument(id);
            router.back();
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
        <Input
          label="Document Name"
          placeholder="e.g., Last Will and Testament"
          value={documentName}
          onChangeText={setDocumentName}
        />

        <Input
          label="Location"
          placeholder="e.g., Safe deposit box at Chase Bank"
          value={location}
          onChangeText={setLocation}
        />

        <Input
          label="Date Created (Optional)"
          placeholder="e.g., 2022-03-15"
          value={dateCreated}
          onChangeText={setDateCreated}
        />

        <TextArea
          label="Notes (Optional)"
          placeholder="Any additional details about this document"
          value={notes}
          onChangeText={setNotes}
        />

        <View style={styles.buttonContainer}>
          <Button title="Save" onPress={handleSave} />
        </View>

        {!isNew && (
          <View style={styles.deleteContainer}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  deleteContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
