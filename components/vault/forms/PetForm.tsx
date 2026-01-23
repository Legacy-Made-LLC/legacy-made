/**
 * PetForm - Form for creating/editing pet entries
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

const speciesTypes = ['Dog', 'Cat', 'Bird', 'Fish', 'Other'] as const;

type SpeciesType = (typeof speciesTypes)[number];

interface PetMetadata {
  species: SpeciesType;
  breed?: string;
  age?: string;
  veterinarian?: string;
  vetPhone?: string;
  careInstructions?: string;
  designatedCaretaker?: string;
}

export function PetForm({
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

  const initialMetadata = initialData?.metadata as PetMetadata | undefined;

  const [name, setName] = useState(initialData?.title ?? '');
  const [species, setSpecies] = useState<SpeciesType>(initialMetadata?.species ?? 'Dog');
  const [breed, setBreed] = useState(initialMetadata?.breed ?? '');
  const [age, setAge] = useState(initialMetadata?.age ?? '');
  const [veterinarian, setVeterinarian] = useState(initialMetadata?.veterinarian ?? '');
  const [vetPhone, setVetPhone] = useState(initialMetadata?.vetPhone ?? '');
  const [designatedCaretaker, setDesignatedCaretaker] = useState(
    initialMetadata?.designatedCaretaker ?? ''
  );
  const [careInstructions, setCareInstructions] = useState(
    initialMetadata?.careInstructions ?? initialData?.notes ?? ''
  );

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Pet' : 'Edit Pet',
    });
  }, [isNew, navigation]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', "Please enter your pet's name.");
      return;
    }

    const metadata: PetMetadata = {
      species,
      breed: breed.trim() || undefined,
      age: age.trim() || undefined,
      veterinarian: veterinarian.trim() || undefined,
      vetPhone: vetPhone.trim() || undefined,
      designatedCaretaker: designatedCaretaker.trim() || undefined,
      careInstructions: careInstructions.trim() || undefined,
    };

    try {
      await onSave({
        title: name.trim(),
        notes: careInstructions.trim() || undefined,
        metadata: metadata as unknown as Record<string, unknown>,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save pet';
      Alert.alert('Error', message);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${name || 'this pet'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to delete pet';
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
          label="Pet Name"
          placeholder="e.g., Luna"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <View style={formStyles.fieldContainer}>
          <Text style={formStyles.label}>Species</Text>
          <View style={formStyles.typeGrid}>
            {speciesTypes.map((type) => (
              <Pressable
                key={type}
                style={[
                  formStyles.typeButton,
                  species === type && formStyles.typeButtonSelected,
                ]}
                onPress={() => setSpecies(type)}
              >
                <Text
                  style={[
                    formStyles.typeButtonText,
                    species === type && formStyles.typeButtonTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Input
          label="Breed (Optional)"
          placeholder="e.g., Golden Retriever"
          value={breed}
          onChangeText={setBreed}
        />

        <Input
          label="Age (Optional)"
          placeholder="e.g., 6 years"
          value={age}
          onChangeText={setAge}
        />

        <Input
          label="Veterinarian (Optional)"
          placeholder="e.g., Bay Area Pet Hospital"
          value={veterinarian}
          onChangeText={setVeterinarian}
        />

        <Input
          label="Vet Phone (Optional)"
          placeholder="(555) 123-4567"
          value={vetPhone}
          onChangeText={setVetPhone}
          keyboardType="phone-pad"
        />

        <Input
          label="Who Will Care for Them? (Optional)"
          placeholder="e.g., Margaret Chen"
          value={designatedCaretaker}
          onChangeText={setDesignatedCaretaker}
        />

        <TextArea
          label="Care Instructions (Optional)"
          placeholder="Special diet, medications, routines, etc."
          value={careInstructions}
          onChangeText={setCareInstructions}
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
              title="Delete Pet"
              variant="destructive"
              onPress={handleDelete}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
