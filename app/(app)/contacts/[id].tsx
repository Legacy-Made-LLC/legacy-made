import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { colors, spacing } from '@/constants/theme';
import { useAppContext } from '@/data/store';
import type { Contact } from '@/data/types';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { getContact, addContact, updateContact, deleteContact } = useAppContext();

  const isNew = id === 'new';
  const existingContact = isNew ? undefined : getContact(id);

  const [name, setName] = useState(existingContact?.name ?? '');
  const [relationship, setRelationship] = useState(existingContact?.relationship ?? '');
  const [phone, setPhone] = useState(existingContact?.phone ?? '');
  const [email, setEmail] = useState(existingContact?.email ?? '');
  const [notes, setNotes] = useState(existingContact?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Contact' : 'Edit Contact',
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a name.');
      return;
    }
    if (!relationship.trim()) {
      Alert.alert('Required Field', 'Please enter a relationship.');
      return;
    }

    const contactData: Omit<Contact, 'id'> = {
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    setIsSaving(true);
    try {
      if (isNew) {
        await addContact(contactData);
      } else {
        await updateContact(id, contactData);
      }
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save contact';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
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
              await deleteContact(id);
              router.back();
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
        <Input
          label="Name"
          placeholder="Enter full name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <Input
          label="Relationship"
          placeholder="e.g., Sister, Attorney"
          value={relationship}
          onChangeText={setRelationship}
          autoCapitalize="words"
        />

        <Input
          label="Phone"
          placeholder="(555) 123-4567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Input
          label="Email"
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextArea
          label="Why this person? (Optional)"
          placeholder="What makes them the right contact?"
          value={notes}
          onChangeText={setNotes}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={isSaving ? 'Saving...' : 'Save'}
            onPress={handleSave}
            disabled={isSaving}
          />
        </View>

        {!isNew && (
          <View style={styles.deleteContainer}>
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
