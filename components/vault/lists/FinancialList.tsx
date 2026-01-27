/**
 * FinancialList - Displays a list of financial account entries
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

interface FinancialMetadata {
  institution?: string;
  accountType?: string;
  accountNumber?: string;
}

export function FinancialList({
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
        <Ionicons name="cash-outline" size={48} color={colors.textTertiary} style={listStyles.emptyIcon} />
        <Text style={listStyles.emptyTitle}>No accounts added yet</Text>
        <Text style={listStyles.emptyDescription}>
          Add your first financial account so your loved ones know where everything is.
        </Text>
        <Button title="Add Account" onPress={onAddPress} style={listStyles.emptyButton} />
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
        const metadata = entry.metadata as FinancialMetadata;

        // If title is blank, show institution + account type as title
        const hasCustomTitle = entry.title && entry.title !== `${metadata.institution} ${metadata.accountType}`.trim();
        const displayTitle = entry.title ||
          [metadata.institution, metadata.accountType].filter(Boolean).join(' ');

        // Subtitle: show institution (if not already in title) + account number
        const subtitle = [
          hasCustomTitle ? metadata.institution : null,
          metadata.accountNumber ? `****${metadata.accountNumber.slice(-4)}` : null,
        ]
          .filter(Boolean)
          .join(' · ');

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
          <Text style={listStyles.addText}>+ Add Account</Text>
        </PressableCard>
      </AnimatedListItem>
    </ScrollView>
  );
}
