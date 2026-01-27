/**
 * InsuranceList - Displays a list of insurance policy entries
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GuidanceCard } from '@/components/ui/GuidanceCard';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { AnimatedListItem } from '@/components/ui/AnimatedListItem';
import { colors, spacing } from '@/constants/theme';
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
      <ScrollView
        style={listStyles.container}
        contentContainerStyle={[listStyles.content, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <SkeletonList count={3} />
      </ScrollView>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={[listStyles.emptyContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Ionicons name="shield-outline" size={48} color={colors.textTertiary} style={listStyles.emptyIcon} />
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

      {entries.map((entry, index) => {
        const metadata = entry.metadata as InsuranceMetadata;

        // Title is generated from provider + policy type, so just show coverage in subtitle
        const displayTitle = entry.title ||
          [metadata.provider, metadata.policyType].filter(Boolean).join(' ');

        const subtitle = metadata.coverageDetails || null;

        return (
          <AnimatedListItem key={entry.id} index={index}>
            <PressableCard
              onPress={() => onEntryPress(entry.id)}
              style={listStyles.card}
            >
              <View style={listStyles.cardContent}>
                <View style={listStyles.cardText}>
                  <Text style={listStyles.cardTitle}>{displayTitle}</Text>
                  {subtitle && <Text style={listStyles.cardSubtitle}>{subtitle}</Text>}
                </View>
                <Text style={listStyles.chevron}>›</Text>
              </View>
            </PressableCard>
          </AnimatedListItem>
        );
      })}

      <AnimatedListItem index={entries.length}>
        <PressableCard onPress={onAddPress} style={listStyles.addCard}>
          <Text style={listStyles.addText}>+ Add Policy</Text>
        </PressableCard>
      </AnimatedListItem>
    </ScrollView>
  );
}
