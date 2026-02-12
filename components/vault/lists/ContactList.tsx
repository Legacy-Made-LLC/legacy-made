/**
 * ContactList - Displays a list of contact entries
 *
 * Used for: contacts.primary, contacts.backup, people
 */

import type { Entry } from "@/api/types";
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
import { default as React, useCallback } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { EntryListProps } from "../registry";
import { listStyles } from "./listStyles";

interface ContactMetadata {
  firstName?: string;
  lastName?: string;
  relationship?: string;
  phone?: string;
  email?: string;
}

export function ContactList({
  taskKey,
  entries,
  isLoading,
  onEntryPress,
  onAddPress,
}: EntryListProps) {
  const insets = useSafeAreaInsets();
  const task = getTaskByKey(taskKey);
  const section = getSectionByTaskKey(taskKey);

  const getDisplayTitle = useCallback((entry: Entry) => {
    const metadata = entry.metadata as ContactMetadata;
    return (
      entry.title ||
      `${metadata.firstName || ""} ${metadata.lastName || ""}`.trim()
    );
  }, []);

  const { sortedEntries, sortMode, setSortMode } = useSortedEntries(
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
          title="No contacts added yet"
          description="Add the first person your loved ones should reach out to."
          buttonTitle="Add Contact"
          onButtonPress={onAddPress}
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
          <SortControl sortMode={sortMode} onSortModeChange={setSortMode} />
        </View>
      )}

      {sortedEntries.map((entry, index) => {
        const metadata = entry.metadata as ContactMetadata;
        const name = getDisplayTitle(entry);
        const subtitle = metadata.relationship || "";

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
                  <Text style={listStyles.cardTitle}>{name}</Text>
                  {subtitle && (
                    <Text style={listStyles.cardSubtitle}>{subtitle}</Text>
                  )}
                </View>
                <Text style={listStyles.chevron}>›</Text>
              </View>
            </PressableCard>
          </AnimatedListItem>
        );
      })}

      <AnimatedListItem index={sortedEntries.length}>
        <PressableCard onPress={onAddPress} style={listStyles.addCard}>
          <Text style={listStyles.addText}>+ Add Contact</Text>
        </PressableCard>
      </AnimatedListItem>
    </ScrollView>
  );
}
