import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { TrustedContactAccessLevel } from "@/api/types";
import { StatusBadge } from "@/components/family/StatusBadge";
import { Card } from "@/components/ui/Card";
import Loader from "@/components/ui/Loader";
import {
  borderRadius,
  colors,
  spacing,
  typography,
} from "@/constants/theme";
import {
  useDeleteTrustedContact,
  useResendInvitation,
  useTrustedContactQuery,
  useUpdateTrustedContact,
} from "@/hooks/queries";
import { toast } from "@/hooks/useToast";

const ACCESS_LEVEL_LABELS: Record<string, string> = {
  full_edit: "Full Edit",
  full_view: "Full View",
  limited_view: "Limited View",
  view_only: "View Only",
};

const ACCESS_TIMING_LABELS: Record<string, string> = {
  immediate: "Immediately",
  upon_passing: "Upon Passing",
};

const ACCESS_LEVEL_OPTIONS: {
  value: TrustedContactAccessLevel;
  label: string;
}[] = [
  { value: "full_edit", label: "Full Edit" },
  { value: "full_view", label: "Full View" },
  { value: "limited_view", label: "Limited View" },
];

export default function TrustedContactDetailScreen() {
  const { contactId } = useLocalSearchParams<{ contactId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showAccessPicker, setShowAccessPicker] = useState(false);

  const { data: contact, isLoading } = useTrustedContactQuery(contactId);
  const updateMutation = useUpdateTrustedContact();
  const deleteMutation = useDeleteTrustedContact();
  const resendMutation = useResendInvitation();

  if (isLoading || !contact) {
    return <Loader />;
  }

  const fullName = `${contact.firstName} ${contact.lastName}`;
  const initials =
    `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();
  const isPending = contact.accessStatus === "pending";
  const isActive =
    contact.accessStatus === "pending" ||
    contact.accessStatus === "accepted";
  const statusDate = contact.acceptedAt || contact.declinedAt || contact.revokedAt;

  const handleAccessLevelChange = async (
    newLevel: TrustedContactAccessLevel,
  ) => {
    setShowAccessPicker(false);
    if (newLevel === contact.accessLevel) return;

    try {
      await updateMutation.mutateAsync({
        contactId: contact.id,
        data: { accessLevel: newLevel },
      });
      toast.success({ message: "Access level updated." });
    } catch {
      toast.error({ message: "Couldn\u2019t update access level." });
    }
  };

  const handleResendInvitation = async () => {
    if (toast.isOffline()) return;

    try {
      await resendMutation.mutateAsync(contact.id);
      toast.success({
        title: "Invitation resent",
        message: `A new invitation has been sent to ${contact.email}.`,
      });
    } catch {
      toast.error({ message: "Couldn\u2019t resend invitation." });
    }
  };

  const handleRevoke = () => {
    Alert.alert(
      "Revoke Access",
      `Are you sure you want to revoke ${fullName}\u2019s access to your plan? They will be notified.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(contact.id);
              toast.success({ message: "Access has been revoked." });
              router.back();
            } catch {
              toast.error({
                message: "Couldn\u2019t revoke access.",
              });
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{fullName}</Text>
        {contact.relationship && (
          <Text style={styles.relationship}>{contact.relationship}</Text>
        )}
      </View>

      {/* Detail Card */}
      <Card style={styles.detailCard}>
        {/* Access Level */}
        <Pressable
          onPress={() => isActive && setShowAccessPicker(!showAccessPicker)}
          style={styles.detailRow}
          disabled={!isActive}
        >
          <View>
            <Text style={styles.detailLabel}>Access Level</Text>
            <Text style={styles.detailValue}>
              {ACCESS_LEVEL_LABELS[contact.accessLevel]}
            </Text>
          </View>
          {isActive && (
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.textTertiary}
            />
          )}
        </Pressable>

        {/* Access Level Picker (inline) */}
        {showAccessPicker && (
          <View style={styles.pickerContainer}>
            {ACCESS_LEVEL_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleAccessLevelChange(option.value)}
                style={[
                  styles.pickerOption,
                  option.value === contact.accessLevel &&
                    styles.pickerOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    option.value === contact.accessLevel &&
                      styles.pickerOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {option.value === contact.accessLevel && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={colors.featureFamily}
                  />
                )}
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        {/* Access Timing */}
        <View style={styles.detailRow}>
          <View>
            <Text style={styles.detailLabel}>Access Timing</Text>
            <Text style={styles.detailValue}>
              {ACCESS_TIMING_LABELS[contact.accessTiming]}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Status */}
        <View style={styles.detailRow}>
          <View>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusRow}>
              <StatusBadge status={contact.accessStatus} />
              {statusDate && (
                <Text style={styles.statusDate}>
                  {" \u00B7 "}
                  {new Date(statusDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Email */}
        <View style={styles.detailRow}>
          <View>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{contact.email}</Text>
          </View>
        </View>
      </Card>

      {/* Notes */}
      {contact.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>NOTES</Text>
          <Text style={styles.notesText}>{contact.notes}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {isPending && (
          <Pressable
            onPress={handleResendInvitation}
            disabled={resendMutation.isPending}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={18}
              color={colors.featureFamily}
            />
            <Text style={styles.secondaryButtonText}>
              {resendMutation.isPending
                ? "Sending..."
                : "Resend Invitation"}
            </Text>
          </Pressable>
        )}

        {isActive && (
          <Pressable
            onPress={handleRevoke}
            disabled={deleteMutation.isPending}
            style={({ pressed }) => [
              styles.destructiveButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons
              name="remove-circle-outline"
              size={18}
              color={colors.error}
            />
            <Text style={styles.destructiveButtonText}>
              Revoke Access
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  // Profile Header
  profileHeader: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.featureFamilyTint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.displayMedium,
    color: colors.featureFamilyDark,
  },
  name: {
    fontFamily: typography.fontFamily.serifBold,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    textAlign: "center",
  },
  relationship: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Detail Card
  detailCard: {
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDate: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
  // Picker
  pickerContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  pickerOptionActive: {
    backgroundColor: colors.featureFamilyTint,
  },
  pickerOptionText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  pickerOptionTextActive: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.featureFamilyDark,
  },
  // Notes
  notesSection: {
    marginBottom: spacing.xl,
  },
  notesLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.label,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  notesText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  // Actions
  actions: {
    gap: spacing.md,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.featureFamily,
    borderRadius: borderRadius.pill,
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.featureFamily,
  },
  destructiveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  destructiveButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.error,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
