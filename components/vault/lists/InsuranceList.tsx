/**
 * InsuranceList - Displays a list of insurance policy entries
 */

import React from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GuidanceCard } from '@/components/ui/GuidanceCard';
import { spacing } from '@/constants/theme';
import { getTaskByKey } from '@/constants/vault';
import { listStyles } from './listStyles';
import type { EntryListProps } from '../registry';

interface InsuranceMetadata {
  provider?: string;
  policyType?: string;
  policyNumber?: string;
  coverageDetails?: string;
}

export function InsuranceList({
  taskKey,
  entries,
  isLoading,
  onEntryPress,
  onAddPress,
}: EntryListProps) {
  const insets = useSafeAreaInsets();
  const task = getTaskByKey(taskKey);

  if (isLoading) {
    return (
      <View style={listStyles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={[listStyles.emptyContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={listStyles.emptyIcon}>🛡️</Text>
        <Text style={listStyles.emptyTitle}>No policies added yet</Text>
        <Text style={listStyles.emptyDescription}>
          Add your insurance policies so your loved ones know what coverage exists.
        </Text>
        <Button title="Add Policy" onPress={onAddPress} style={listStyles.emptyButton} />
      </View>
    );
  }

  return (
    <ScrollView
      style={listStyles.container}
      contentContainerStyle={[listStyles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      {task?.guidance && <GuidanceCard text={task.guidance} />}

      {entries.map((entry) => {
        const metadata = entry.metadata as InsuranceMetadata;
        const subtitle = [metadata.provider, metadata.coverageDetails]
          .filter(Boolean)
          .join(' · ');

        return (
          <PressableCard
            key={entry.id}
            onPress={() => onEntryPress(entry.id)}
            style={listStyles.card}
          >
            <View style={listStyles.cardContent}>
              <View style={listStyles.cardText}>
                <Text style={listStyles.cardTitle}>{entry.title}</Text>
                {subtitle && <Text style={listStyles.cardSubtitle}>{subtitle}</Text>}
              </View>
              <Text style={listStyles.chevron}>›</Text>
            </View>
          </PressableCard>
        );
      })}

      <PressableCard onPress={onAddPress} style={listStyles.addCard}>
        <Text style={listStyles.addText}>+ Add Policy</Text>
      </PressableCard>
    </ScrollView>
  );
}
