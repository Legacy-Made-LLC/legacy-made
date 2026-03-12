/**
 * TrustedContactCard - List card for a trusted contact
 */

import type { TrustedContact } from "@/api/types";
import { PressableCard } from "@/components/ui/Card";
import {
  colors,
  spacing,
  typography,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

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

interface TrustedContactCardProps {
  contact: TrustedContact;
  onPress: () => void;
}

export function TrustedContactCard({
  contact,
  onPress,
}: TrustedContactCardProps) {
  const fullName = `${contact.firstName} ${contact.lastName}`;
  const initials = `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();

  return (
    <PressableCard onPress={onPress} style={styles.card}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {fullName}
          </Text>
          {contact.relationship && (
            <Text style={styles.relationship} numberOfLines={1}>
              {contact.relationship}
            </Text>
          )}
          <Text style={styles.accessInfo}>
            {ACCESS_LEVEL_LABELS[contact.accessLevel]}
            {" \u00B7 "}
            {ACCESS_TIMING_LABELS[contact.accessTiming]}
          </Text>
          <View style={styles.statusRow}>
            <StatusBadge status={contact.accessStatus} />
            {contact.accessStatus === "accepted" &&
              contact.dekShared === false && (
                <View style={styles.needsKeyBadge}>
                  <Ionicons name="key-outline" size={10} color={colors.featureFamilyDark} />
                  <Text style={styles.needsKeyText}>Needs key</Text>
                </View>
              )}
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textTertiary}
          style={styles.chevron}
        />
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
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
  relationship: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  accessInfo: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  needsKeyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.featureFamilyTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  needsKeyText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption - 1,
    color: colors.featureFamilyDark,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
});
