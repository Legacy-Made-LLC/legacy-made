/**
 * SharedPlanCard - List card for a plan shared with the current user
 *
 * Shows different UI based on status:
 * - Pending: accept/decline action buttons
 * - Accepted: chevron to view the plan
 */

import type { SharedPlan } from "@/api/types";
import { PressableCard } from "@/components/ui/Card";
import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "./StatusBadge";

const ACCESS_LEVEL_LABELS: Record<string, string> = {
  full_edit: "Full Edit",
  full_view: "Full View",
  limited_view: "Limited View",
  view_only: "View Only",
};

const ACCESS_TIMING_LABELS: Record<string, string> = {
  immediate: "Immediate",
  upon_passing: "Upon Passing",
};

interface SharedPlanCardProps {
  sharedPlan: SharedPlan;
  /** Called when tapping an accepted plan to view it */
  onPress: () => void;
  /** Called when accepting a pending invitation */
  onAccept?: () => void;
  /** Called when declining a pending invitation */
  onDecline?: () => void;
  /** Whether an accept/decline action is in progress */
  isActioning?: boolean;
}

export function SharedPlanCard({
  sharedPlan,
  onPress,
  onAccept,
  onDecline,
  isActioning,
}: SharedPlanCardProps) {
  const { ownerFirstName, ownerLastName, accessLevel, accessTiming, accessStatus } = sharedPlan;
  const fullName = `${ownerFirstName} ${ownerLastName}`;
  const initials =
    `${ownerFirstName.charAt(0)}${ownerLastName.charAt(0)}`.toUpperCase();
  const isPending = accessStatus === "pending";

  const cardContent = (
    <View>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {isPending
              ? `${fullName} invited you`
              : `${fullName}\u2019s Plan`}
          </Text>
          <Text style={styles.accessInfo}>
            {ACCESS_LEVEL_LABELS[accessLevel]}
            {" \u00B7 "}
            {ACCESS_TIMING_LABELS[accessTiming]}
          </Text>
          {isPending && <StatusBadge status="pending" />}
        </View>
        {!isPending && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
            style={styles.chevron}
          />
        )}
      </View>

      {/* Accept / Decline buttons for pending invitations */}
      {isPending && (
        <View style={styles.actions}>
          <Pressable
            onPress={onDecline}
            disabled={isActioning}
            style={({ pressed }) => [
              styles.declineButton,
              pressed && styles.declineButtonPressed,
              isActioning && styles.disabledButton,
            ]}
          >
            <Text
              style={[
                styles.declineButtonText,
                isActioning && styles.disabledText,
              ]}
            >
              Decline
            </Text>
          </Pressable>
          <Pressable
            onPress={onAccept}
            disabled={isActioning}
            style={({ pressed }) => [
              styles.acceptButton,
              pressed && styles.acceptButtonPressed,
              isActioning && styles.disabledButton,
            ]}
          >
            <Text
              style={[
                styles.acceptButtonText,
                isActioning && styles.disabledText,
              ]}
            >
              Accept
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  // Pending cards are not tappable (use action buttons instead)
  if (isPending) {
    return <View style={styles.pendingCard}>{cardContent}</View>;
  }

  return (
    <PressableCard onPress={onPress} style={styles.card}>
      {cardContent}
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  pendingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md + 4,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.featureFamilyTint,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.featureFamilyDark,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
  },
  accessInfo: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  declineButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  declineButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  declineButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  acceptButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  acceptButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.bodySmall,
    color: colors.surface,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});
