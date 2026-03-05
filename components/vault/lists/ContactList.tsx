/**
 * ContactList - Displays a list of contact entries
 *
 * Used for: contacts.primary, contacts.backup, people
 */

import { type Entry, isEntryDraft } from "@/api/types";
import { AnimatedListItem } from "@/components/ui/AnimatedListItem";
import { PressableCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { EntryDraftBadge } from "@/components/ui/EntryDraftBadge";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import { SortControl } from "@/components/ui/SortControl";
import { colors, spacing } from "@/constants/theme";
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
  isPrimary?: boolean;
}

export function ContactList({
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

  const getDisplayTitle = useCallback((entry: Entry) => {
    const metadata = entry.metadata as ContactMetadata;
    return (
      entry.title ||
      `${metadata.firstName || ""} ${metadata.lastName || ""}`.trim()
    );
  }, []);

  const { sortedEntries, sortMode, setSortMode, searchQuery, setSearchQuery } =
    useSortedEntries(entries, getDisplayTitle, taskKey);

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
          title={
            taskKey === "people"
              ? "No people added yet"
              : "No contacts added yet"
          }
          description={
            taskKey === "people"
              ? "Who else plays an important role in your life?"
              : taskKey === "contacts.backup"
                ? "Additional people your loved ones should reach out to."
                : "Add the first person your loved ones should reach out to."
          }
          buttonTitle={
            readOnly
              ? undefined
              : taskKey === "people"
                ? "Add someone"
                : "Add Contact"
          }
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
          <SortControl
            sortMode={sortMode}
            onSortModeChange={setSortMode}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
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
                  marginTop: index === 0 && entries.length < 2 ? spacing.sm : 0,
                },
              ]}
            >
              <View style={listStyles.cardContent}>
                <View style={listStyles.cardText}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text style={listStyles.cardTitle}>{name}</Text>
                    {metadata.isPrimary && (
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: colors.featureInformationTint,
                          justifyContent: "center",
                          alignItems: "center",
                          marginBottom: 2,
                        }}
                      >
                        <Ionicons
                          name="star"
                          size={11}
                          color={colors.featureInformation}
                        />
                      </View>
                    )}
                  </View>
                  {subtitle && (
                    <Text style={listStyles.cardSubtitle}>{subtitle}</Text>
                  )}
                </View>
                {isEntryDraft(entry) && (
                  <EntryDraftBadge
                    color={colors.featureInformation}
                    backgroundColor={colors.featureInformationTint}
                  />
                )}
                <Text style={listStyles.chevron}>›</Text>
              </View>
            </PressableCard>
          </AnimatedListItem>
        );
      })}

      {!readOnly && (
        <AnimatedListItem index={sortedEntries.length}>
          <PressableCard onPress={onAddPress} style={listStyles.addCard}>
            <Text style={listStyles.addText}>
              {taskKey === "people" ? "+ Add someone" : "+ Add Contact"}
            </Text>
          </PressableCard>
        </AnimatedListItem>
      )}
    </ScrollView>
  );
}
