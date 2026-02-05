/**
 * DocumentList - Displays a list of legal document entries
 */

import { AnimatedListItem } from "@/components/ui/AnimatedListItem";
import { PressableCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import { spacing } from "@/constants/theme";
import { getSectionByTaskKey, getTaskByKey } from "@/constants/vault";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { EntryListProps } from "../registry";
import { listStyles } from "./listStyles";

interface DocumentMetadata {
  documentType?: string;
  location?: string;
  holder?: string;
}

export function DocumentList({
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
          title="No documents added yet"
          description="Add your important legal documents so your family knows where to find them."
          buttonTitle="Add Document"
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

      {entries.map((entry, index) => {
        const metadata = entry.metadata as DocumentMetadata;
        const subtitle = metadata.location || "";

        return (
          <AnimatedListItem key={entry.id} index={index}>
            <PressableCard
              onPress={() => onEntryPress(entry.id)}
              style={[
                listStyles.card,
                { marginTop: index === 0 ? spacing.sm : 0 },
              ]}
            >
              <View style={listStyles.cardContent}>
                <View style={listStyles.cardText}>
                  <Text style={listStyles.cardTitle}>{entry.title}</Text>
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

      <AnimatedListItem index={entries.length}>
        <PressableCard onPress={onAddPress} style={listStyles.addCard}>
          <Text style={listStyles.addText}>+ Add Document</Text>
        </PressableCard>
      </AnimatedListItem>
    </ScrollView>
  );
}
