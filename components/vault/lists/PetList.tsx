/**
 * PetList - Displays a list of pet entries
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
import { getTaskByKey, getSectionByTaskKey } from '@/constants/vault';
import { listStyles } from './listStyles';
import type { EntryListProps } from '../registry';

interface PetMetadata {
  species?: string;
  breed?: string;
  designatedCaretaker?: string;
}

export function PetList({
  taskKey,
  entries,
  isLoading,
  onEntryPress,
  onAddPress,
}: EntryListProps) {
  const insets = useSafeAreaInsets();
  const task = getTaskByKey(taskKey);
  const section = getSectionByTaskKey(taskKey);

  const renderGuidanceCard = () => {
    if (!task?.guidance) return null;
    return (
      <GuidanceCard
        icon={section?.ionIcon as keyof typeof Ionicons.glyphMap}
        heading={task.guidanceHeading}
        text={task.guidance}
      />
    );
  };

  if (isLoading) {
    return (
      <ScrollView
        style={listStyles.container}
        contentContainerStyle={[listStyles.content, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {renderGuidanceCard()}
        <SkeletonList count={3} />
      </ScrollView>
    );
  }

  if (entries.length === 0) {
    return (
      <ScrollView
        style={listStyles.container}
        contentContainerStyle={[listStyles.content, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {renderGuidanceCard()}
        <View style={listStyles.emptyContent}>
          <Ionicons name="add-circle-outline" size={40} color={colors.textTertiary} style={listStyles.emptyIcon} />
          <Text style={listStyles.emptyTitle}>No pets added yet</Text>
          <Text style={listStyles.emptyDescription}>
            Add your pets so your family knows how to care for them.
          </Text>
          <Button title="Add Pet" onPress={onAddPress} style={listStyles.emptyButton} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={listStyles.container}
      contentContainerStyle={[listStyles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      {renderGuidanceCard()}

      {entries.map((entry, index) => {
        const metadata = entry.metadata as PetMetadata;
        const subtitle = [metadata.species, metadata.breed]
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
                  <Text style={listStyles.cardTitle}>{entry.title}</Text>
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
          <Text style={listStyles.addText}>+ Add Pet</Text>
        </PressableCard>
      </AnimatedListItem>
    </ScrollView>
  );
}
