/**
 * PetForm - Form for creating/editing pet entries
 */

import React, { useEffect, useMemo } from 'react';
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
import { revalidateLogic, useForm } from '@tanstack/react-form';
import { FormInput, FormTextArea, petSchema, formatPhoneNumber } from '@/components/forms';
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
  entryId,
  initialData,
  onSave,
  onDelete,
  isSaving,
}: EntryFormProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNew = !entryId;

  const initialMetadata = initialData?.metadata as PetMetadata | undefined;

  const defaultValues = useMemo(
    () => ({
      name: initialData?.title ?? '',
      species: (initialMetadata?.species ?? 'Dog') as string,
      breed: initialMetadata?.breed ?? '',
      age: initialMetadata?.age ?? '',
      veterinarian: initialMetadata?.veterinarian ?? '',
      vetPhone: initialMetadata?.vetPhone ?? '',
      designatedCaretaker: initialMetadata?.designatedCaretaker ?? '',
      careInstructions: initialMetadata?.careInstructions ?? initialData?.notes ?? '',
    }),
    [initialData, initialMetadata]
  );

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: petSchema,
    },
    onSubmit: async ({ value }) => {
      const metadata: PetMetadata = {
        species: value.species as SpeciesType,
        breed: value.breed.trim() || undefined,
        age: value.age.trim() || undefined,
        veterinarian: value.veterinarian.trim() || undefined,
        vetPhone: value.vetPhone.trim() || undefined,
        designatedCaretaker: value.designatedCaretaker.trim() || undefined,
        careInstructions: value.careInstructions.trim() || undefined,
      };

      try {
        await onSave({
          title: value.name.trim(),
          notes: value.careInstructions.trim() || undefined,
          metadata: metadata as unknown as Record<string, unknown>,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save pet';
        Alert.alert('Error', message);
      }
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Pet' : 'Edit Pet',
    });
  }, [isNew, navigation]);

  const handleDelete = () => {
    if (!onDelete) return;

    const name = form.getFieldValue('name');
    Alert.alert('Delete Pet', `Are you sure you want to delete ${name || 'this pet'}?`, [
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
    ]);
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
        <form.Field name="name">
          {(field) => (
            <FormInput
              field={field}
              label="Pet Name"
              placeholder="e.g., Luna"
              autoCapitalize="words"
            />
          )}
        </form.Field>

        <form.Field name="species">
          {(field) => (
            <View style={formStyles.fieldContainer}>
              <Text style={formStyles.label}>Species</Text>
              <View style={formStyles.typeGrid}>
                {speciesTypes.map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      formStyles.typeButton,
                      field.state.value === type && formStyles.typeButtonSelected,
                    ]}
                    onPress={() => field.handleChange(type)}
                  >
                    <Text
                      style={[
                        formStyles.typeButtonText,
                        field.state.value === type && formStyles.typeButtonTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </form.Field>

        <form.Field name="breed">
          {(field) => (
            <FormInput field={field} label="Breed (Optional)" placeholder="e.g., Golden Retriever" />
          )}
        </form.Field>

        <form.Field name="age">
          {(field) => <FormInput field={field} label="Age (Optional)" placeholder="e.g., 6 years" />}
        </form.Field>

        <form.Field name="veterinarian">
          {(field) => (
            <FormInput
              field={field}
              label="Veterinarian (Optional)"
              placeholder="e.g., Bay Area Pet Hospital"
            />
          )}
        </form.Field>

        <form.Field name="vetPhone">
          {(field) => (
            <FormInput
              field={field}
              label="Vet Phone (Optional)"
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
              onValueChange={(text) => field.handleChange(formatPhoneNumber(text))}
            />
          )}
        </form.Field>

        <form.Field name="designatedCaretaker">
          {(field) => (
            <FormInput
              field={field}
              label="Who Will Care for Them? (Optional)"
              placeholder="e.g., Margaret Chen"
            />
          )}
        </form.Field>

        <form.Field name="careInstructions">
          {(field) => (
            <FormTextArea
              field={field}
              label="Care Instructions (Optional)"
              placeholder="Special diet, medications, routines, etc."
            />
          )}
        </form.Field>

        <View style={formStyles.buttonContainer}>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                title={isSaving || isSubmitting ? 'Saving...' : 'Save'}
                onPress={() => form.handleSubmit()}
                disabled={isSaving || isSubmitting || !canSubmit}
              />
            )}
          </form.Subscribe>
        </View>

        {!isNew && onDelete && (
          <View style={formStyles.deleteContainer}>
            <Button title="Delete Pet" variant="destructive" onPress={handleDelete} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
