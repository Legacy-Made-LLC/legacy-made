/**
 * FinancialList - Displays a list of financial account entries
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
import React, { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { EntryListProps } from "../registry";
import { listStyles } from "./listStyles";

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
  const section = getSectionByTaskKey(taskKey);

  const getDisplayTitle = useCallback((entry: Entry) => {
    const metadata = entry.metadata as FinancialMetadata;
    return (
      entry.title ||
      [metadata.institution, metadata.accountType].filter(Boolean).join(" ")
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
          title="No accounts added yet"
          description="Add your first financial account so your loved ones know where everything is."
          buttonTitle="Add Account"
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
        const metadata = entry.metadata as FinancialMetadata;

        const displayTitle = getDisplayTitle(entry);

        // If title is blank, show institution + account type as title
        const hasCustomTitle =
          entry.title &&
          entry.title !==
            `${metadata.institution} ${metadata.accountType}`.trim();

        // Subtitle: show institution (if not already in title) + account number
        const subtitle = [
          hasCustomTitle ? metadata.institution : null,
          metadata.accountNumber
            ? `****${metadata.accountNumber.slice(-4)}`
            : null,
        ]
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
                  <Text style={listStyles.cardTitle}>{displayTitle}</Text>
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
          <Text style={listStyles.addText}>+ Add Account</Text>
        </PressableCard>
      </AnimatedListItem>
    </ScrollView>
  );
}
