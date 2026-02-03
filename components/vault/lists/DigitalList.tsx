/**
 * DigitalList - Displays a list of digital access entries
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

interface DigitalMetadata {
  service?: string;
  username?: string;
}

// Get display labels based on task type
function getLabels(taskKey: string) {
  switch (taskKey) {
    case "digital.email":
      return {
        emptyTitle: "No email accounts added yet",
        emptyDescription:
          "Add your email accounts so your family can access important communications.",
        addButton: "Add Email Account",
        icon: "mail-outline" as const,
      };
    case "digital.passwords":
      return {
        emptyTitle: "No password info added yet",
        emptyDescription:
          "Note where your passwords are stored and how to access them.",
        addButton: "Add Password Info",
        icon: "key-outline" as const,
      };
    case "digital.devices":
      return {
        emptyTitle: "No devices added yet",
        emptyDescription:
          "Add your phones, computers, and tablets with access information.",
        addButton: "Add Device",
        icon: "phone-portrait-outline" as const,
      };
    case "digital.social":
      return {
        emptyTitle: "No social accounts added yet",
        emptyDescription:
          "Add your social media accounts and any legacy settings you've configured.",
        addButton: "Add Social Account",
        icon: "share-social-outline" as const,
      };
    default:
      return {
        emptyTitle: "No accounts added yet",
        emptyDescription:
          "Add your important digital accounts and how to access them.",
        addButton: "Add Account",
        icon: "laptop-outline" as const,
      };
  }
}

export function DigitalList({
  taskKey,
  entries,
  isLoading,
  onEntryPress,
  onAddPress,
}: EntryListProps) {
  const insets = useSafeAreaInsets();
  const task = getTaskByKey(taskKey);
  const section = getSectionByTaskKey(taskKey);
  const labels = getLabels(taskKey);

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
          title={labels.emptyTitle}
          description={labels.emptyDescription}
          buttonTitle={labels.addButton}
          onButtonPress={onAddPress}
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
        const metadata = entry.metadata as DigitalMetadata;
        const subtitle = [metadata.service, metadata.username]
          .filter(Boolean)
          .join(" · ");

        return (
          <AnimatedListItem key={entry.id} index={index}>
            <PressableCard
              onPress={() => onEntryPress(entry.id)}
              style={listStyles.card}
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
          <Text style={listStyles.addText}>+ {labels.addButton}</Text>
        </PressableCard>
      </AnimatedListItem>
    </ScrollView>
  );
}
