import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { useAppContext } from '@/data/store';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { HomeResponsibility } from '@/data/types';

const itemTypes: HomeResponsibility['itemType'][] = [
  'Property',
  'Vehicle',
  'Responsibility',
  'Other',
];

export default function HomeResponsibilityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    getHomeResponsibility,
    addHomeResponsibility,
    updateHomeResponsibility,
    deleteHomeResponsibility,
  } = useAppContext();

  const isNew = id === 'new';
  const existing = isNew ? undefined : getHomeResponsibility(id);

  const [itemName, setItemName] = useState(existing?.itemName ?? '');
  const [itemType, setItemType] = useState<HomeResponsibility['itemType']>(
    existing?.itemType ?? 'Property'
  );
  const [details, setDetails] = useState(existing?.details ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Add Item' : 'Edit Item',
    });
  }, [isNew, navigation]);

  const handleSave = () => {
    if (!itemName.trim()) {
      Alert.alert('Required Field', 'Please enter an item name.');
      return;
    }

    const data: Omit<HomeResponsibility, 'id'> = {
      itemName: itemName.trim(),
      itemType,
      details: details.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (isNew) {
      addHomeResponsibility(data);
    } else {
      updateHomeResponsibility(id, data);
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete ${itemName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteHomeResponsibility(id);
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
          label="Item Name"
          placeholder="e.g., Primary Residence"
          value={itemName}
          onChangeText={setItemName}
        />

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeGrid}>
            {itemTypes.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeButton,
                  itemType === type && styles.typeButtonSelected,
                ]}
                onPress={() => setItemType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    itemType === type && styles.typeButtonTextSelected,
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
          placeholder="e.g., 742 Evergreen Terrace, San Francisco, CA"
          value={details}
          onChangeText={setDetails}
        />

        <TextArea
          label="Notes (Optional)"
          placeholder="Any additional details about this item"
          value={notes}
          onChangeText={setNotes}
        />

        <View style={styles.buttonContainer}>
          <Button title="Save" onPress={handleSave} />
        </View>

        {!isNew && (
          <View style={styles.deleteContainer}>
            <Button
              title="Delete Item"
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
  fieldContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  typeButtonTextSelected: {
    color: colors.surface,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  deleteContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
