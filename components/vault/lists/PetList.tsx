/**
 * PetList - Displays a list of pet entries
 */

import { type Entry } from "@/api/types";
import { EntryDraftBadge } from "@/components/ui/EntryDraftBadge";
import { AnimatedListItem } from "@/components/ui/AnimatedListItem";
import { PressableCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import { SortControl } from "@/components/ui/SortControl";
import { spacing } from "@/constants/theme";
import { getSectionByTaskKey, getTaskByKey } from "@/constants/vault";
import { useSortedEntries } from "@/hooks/useSortedEntries";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { EntryListProps } from "../registry";
import { listStyles } from "./listStyles";

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
  readOnly,
  emptySecondaryLabel,
  onEmptySecondaryAction,
}: EntryListProps) {
  const insets = useSafeAreaInsets();
  const task = getTaskByKey(taskKey);
  const section = getSectionByTaskKey(taskKey);

  const getDisplayTitle = useCallback(
    (entry: Entry) => entry.title || "",
    [],
  );

  const { sortedEntries, sortMode, setSortMode, searchQuery, setSearchQuery } = useSortedEntries(
    entries,
    getDisplayTitle,
    taskKey,
  );

  const renderGuidanceCard = () => {
    if (!task?.guidance || !task?.triggerText) return null;
    return (
      <ExpandableGuidanceCard
        icon={section?.ionIcon as keyof typeof Ionicons.glyphMap}
        triggerText={task.triggerText}
        heading={task.guidanceHeading}
        detail={task.guidance}
        tips={task.tips}
        pacingNote={task.pacingNote}
      />
    );
  };

  if (isLoading) {
    return (
      <ScrollView
        style={listStyles.container}
        contentContainerStyle={[
          listStyles.content,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
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
        contentContainerStyle={[
          listStyles.content,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderGuidanceCard()}
        <EmptyState
          title="No pets added yet"
          description="Add your pets so others know how to care for them."
          buttonTitle={readOnly ? undefined : "Add Pet"}
          onButtonPress={readOnly ? undefined : onAddPress}
          secondaryActionLabel={emptySecondaryLabel}
          onSecondaryAction={onEmptySecondaryAction}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={listStyles.container}
      contentContainerStyle={[
        listStyles.content,
        { paddingBottom: insets.bottom + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {renderGuidanceCard()}

      {entries.length >= 2 && (
        <View style={listStyles.sortRow}>
          <SortControl sortMode={sortMode} onSortModeChange={setSortMode} searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
        </View>
      )}

      {sortedEntries.map((entry, index) => {
        const metadata = entry.metadata as PetMetadata;
        const subtitle = [metadata.species, metadata.breed]
          .filter(Boolean)
          .join(" · ");

        return (
          <AnimatedListItem key={entry.id} index={index}>
            <PressableCard
              onPress={() => onEntryPress(entry.id)}
              style={[
                listStyles.card,
                {
                  marginTop:
                    index === 0 && entries.length < 2 ? spacing.sm : 0,
                },
              ]}
            >
              <View style={listStyles.cardContent}>
                <View style={listStyles.cardText}>
                  <Text style={listStyles.cardTitle}>{entry.title}</Text>
                  {subtitle && (
                    <Text style={listStyles.cardSubtitle}>{subtitle}</Text>
                  )}
                </View>
                {entry.completionStatus === "draft" && <EntryDraftBadge />}
                <Text style={listStyles.chevron}>›</Text>
              </View>
            </PressableCard>
          </AnimatedListItem>
        );
      })}

      {!readOnly && (
        <AnimatedListItem index={sortedEntries.length}>
          <PressableCard onPress={onAddPress} style={listStyles.addCard}>
            <Text style={listStyles.addText}>+ Add Pet</Text>
          </PressableCard>
        </AnimatedListItem>
      )}
    </ScrollView>
  );
}
