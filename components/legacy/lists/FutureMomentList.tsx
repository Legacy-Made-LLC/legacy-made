/**
 * FutureMomentList - Displays a list of future moment messages
 *
 * Used for: messages.future
 * Shows occasion name, recipient, and content type indicators.
 */

import type { FutureMomentMetadata } from "@/api/types";
import { AnimatedListItem } from "@/components/ui/AnimatedListItem";
import { PressableCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { EntryDraftBadge } from "@/components/ui/EntryDraftBadge";
import { ExpandableGuidanceCard } from "@/components/ui/ExpandableGuidanceCard";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import { colors, spacing } from "@/constants/theme";
import { getLegacySectionByTaskKey, getLegacyTaskByKey } from "@/constants/legacy";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LegacyListProps } from "../registry";
import { listStyles } from "./listStyles";

export function FutureMomentList({
  taskKey,
  messages,
  isLoading,
  onEntryPress,
  onAddPress,
  readOnly,
}: LegacyListProps) {
  const insets = useSafeAreaInsets();
  const task = getLegacyTaskByKey(taskKey);
  const section = getLegacySectionByTaskKey(taskKey);

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
        accentColor={colors.featureLegacy}
        accentTint={colors.featureLegacyTint}
        accentDark={colors.featureLegacyDark}
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

  if (messages.length === 0) {
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
          title="No future moments yet"
          description="Think of the milestones you want to be part of — graduations, weddings, birthdays — and leave a message for that day."
          buttonTitle={readOnly ? undefined : "Add Your First Moment"}
          onButtonPress={readOnly ? undefined : onAddPress}
          icon="gift-outline"
          iconColor={colors.featureLegacy}
          buttonColor={colors.featureLegacy}
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

      {messages.map((message, index) => {
        const metadata = message.metadata as unknown as FutureMomentMetadata;
        const title = metadata.occasion || message.title || "Untitled";
        const subtitle = metadata.recipientName
          ? `For: ${metadata.recipientName}`
          : "";
        const isDraft = message.completionStatus === "draft";

        return (
          <AnimatedListItem key={message.id} index={index}>
            <PressableCard
              onPress={() => onEntryPress(message.id)}
              style={[
                listStyles.card,
                { marginTop: index === 0 ? spacing.sm : 0 },
              ]}
            >
              <View style={listStyles.cardContent}>
                <View style={listStyles.cardText}>
                  <Text style={listStyles.cardTitle}>{title}</Text>
                  {subtitle ? (
                    <Text style={listStyles.cardSubtitle}>{subtitle}</Text>
                  ) : null}
                </View>
                {isDraft && (
                  <EntryDraftBadge
                    color={colors.featureLegacy}
                    backgroundColor={colors.featureLegacyTint}
                  />
                )}
                <Text style={listStyles.chevron}>›</Text>
              </View>
            </PressableCard>
          </AnimatedListItem>
        );
      })}

      {!readOnly && (
        <AnimatedListItem index={messages.length}>
          <PressableCard onPress={onAddPress} style={listStyles.addCard}>
            <Text style={listStyles.addText}>+ Add Another Moment</Text>
          </PressableCard>
        </AnimatedListItem>
      )}
    </ScrollView>
  );
}
