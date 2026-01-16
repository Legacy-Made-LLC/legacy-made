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
import type { InsurancePolicy } from '@/data/types';

export default function InsuranceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { getInsurance, addInsurance, updateInsurance, deleteInsurance } = useAppContext();

  const isNew = id === 'new';
  const existing = isNew ? undefined : getInsurance(id);

  const [policyName, setPolicyName] = useState(existing?.policyName ?? '');
  const [provider, setProvider] = useState(existing?.provider ?? '');
  const [policyNumber, setPolicyNumber] = useState(existing?.policyNumber ?? '');
  const [coverageAmount, setCoverageAmount] = useState(existing?.coverageAmount ?? '');
  const [beneficiary, setBeneficiary] = useState(existing?.beneficiary ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);

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

    const data: Omit<InsurancePolicy, 'id'> = {
      policyName: policyName.trim(),
      provider: provider.trim(),
      policyNumber: policyNumber.trim() || undefined,
      coverageAmount: coverageAmount.trim() || undefined,
      beneficiary: beneficiary.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    setIsSaving(true);
    try {
      if (isNew) {
        await addInsurance(data);
      } else {
        await updateInsurance(id, data);
      }
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save policy';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Policy',
      `Are you sure you want to delete ${policyName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInsurance(id);
              router.back();
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

        <Input
          label="Policy Number (Optional)"
          placeholder="e.g., LF-2847592"
          value={policyNumber}
          onChangeText={setPolicyNumber}
        />

        <Input
          label="Coverage Amount (Optional)"
          placeholder="e.g., $500,000"
          value={coverageAmount}
          onChangeText={setCoverageAmount}
        />

        <Input
          label="Beneficiary (Optional)"
          placeholder="e.g., Margaret Chen"
          value={beneficiary}
          onChangeText={setBeneficiary}
          autoCapitalize="words"
        />

        <TextArea
          label="Notes (Optional)"
          placeholder="Any additional details about this policy"
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
