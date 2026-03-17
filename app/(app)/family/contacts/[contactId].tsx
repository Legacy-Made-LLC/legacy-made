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

import { useApi } from "@/api";
import type {
  CreateTrustedContactRequest,
  TrustedContactAccessLevel,
} from "@/api/types";
import { StatusBadge } from "@/components/family/StatusBadge";
import { Card } from "@/components/ui/Card";
import Loader from "@/components/ui/Loader";
import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { useNotificationPrompt } from "@/contexts/NotificationPromptContext";
import {
  useCreateTrustedContact,
  useDeleteTrustedContact,
  useResendInvitation,
  useRevokeTrustedContact,
  useTrustedContactQuery,
  useUpdateTrustedContact,
} from "@/hooks/queries";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { usePillarGuard } from "@/hooks/usePillarGuard";
import { useRevokeDEK, useShareDEK } from "@/hooks/useShareDEK";
import { toast } from "@/hooks/useToast";
import { useCrypto } from "@/lib/crypto/CryptoProvider";
import { wrapDEKForRecipient } from "@/lib/crypto/wrapDEKForRecipient";
import { logger } from "@/lib/logger";

const ACCESS_LEVEL_LABELS: Record<string, string> = {
  full_edit: "Can Edit",
  full_view: "View Only",
  // limited_view: "Limited View",
};

const ACCESS_TIMING_LABELS: Record<string, string> = {
  immediate: "Immediately",
  upon_passing: "Upon Passing",
};

const ACCESS_LEVEL_OPTIONS: {
  value: TrustedContactAccessLevel;
  label: string;
}[] = [
  { value: "full_edit", label: "Can Edit" },
  { value: "full_view", label: "View Only" },
  // { value: "limited_view", label: "Limited View" },
];

export default function TrustedContactDetailScreen() {
  const { contactId } = useLocalSearchParams<{ contactId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showAccessPicker, setShowAccessPicker] = useState(false);

  const { data: contact, isLoading } = useTrustedContactQuery(contactId);
  const createMutation = useCreateTrustedContact();
  const updateMutation = useUpdateTrustedContact();
  const revokeMutation = useRevokeTrustedContact();
  const deleteMutation = useDeleteTrustedContact();
  const resendMutation = useResendInvitation();
  const shareDEK = useShareDEK();
  const revokeDEK = useRevokeDEK();
  const { keys } = useApi();
  const { dekCryptoKey } = useCrypto();
  const { triggerPrompt } = useNotificationPrompt();
  const { guardOverlay } = usePillarGuard({
    pillar: "family_access",
    featureName: "Family Access",
    lockedDescription:
      "Manage who can access your legacy information and when they can see it.",
    restrictedDescription:
      "Your access level doesn't include Family Access for this plan.",
  });

  // Check if the contact has encryption keys (needed for DEK sharing).
  // Only query when the contact has accepted and we haven't shared the DEK yet.
  const recipientKeysQuery = useQuery({
    queryKey: queryKeys.crypto.serverKeys(contact?.clerkUserId ?? ""),
    queryFn: () => keys.getPublicKeys(contact?.clerkUserId ?? ""),
    enabled:
      !!contact?.clerkUserId &&
      contact?.accessStatus === "accepted" &&
      contact?.dekShared === false,
    staleTime: 60 * 1000,
  });
  const recipientHasKeys =
    recipientKeysQuery.data && recipientKeysQuery.data.length > 0;

  if (guardOverlay) {
    return guardOverlay;
  }

  if (isLoading || !contact) {
    return <Loader />;
  }

  const fullName = `${contact.firstName} ${contact.lastName}`;
  const initials =
    `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();
  const isPending = contact.accessStatus === "pending";
  const isAccepted = contact.accessStatus === "accepted";
  const isActive =
    contact.accessStatus === "pending" || contact.accessStatus === "accepted";
  const isDeclined = contact.accessStatus === "declined";
  const isRevoked =
    contact.accessStatus === "revoked_by_owner" ||
    contact.accessStatus === "revoked_by_contact";
  const isInactive = isRevoked || isDeclined;
  const statusDate =
    contact.acceptedAt || contact.declinedAt || contact.revokedAt;
  const needsDEKShare = isAccepted && contact.dekShared === false;

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
    } catch (err) {
      logger.error("Failed to update access level", { contactId: contact.id, newLevel, error: err });
      toast.error({ message: "Couldn\u2019t update access level." });
    }
  };

  const handleShareDEK = async () => {
    if (!contact.clerkUserId) return;
    try {
      await shareDEK.mutateAsync({ recipientUserId: contact.clerkUserId });
      toast.success({ message: "Encryption key shared." });
    } catch (err) {
      logger.error("Failed to share DEK with trusted contact", { contactId: contact.id, recipientUserId: contact.clerkUserId, error: err });
      toast.error({ message: "Couldn\u2019t share encryption key." });
    }
  };

  const handleResendInvitation = async () => {
    try {
      await resendMutation.mutateAsync(contact.id);
      toast.success({
        title: "Invitation resent",
        message: `A new invitation has been sent to ${contact.email}.`,
      });
    } catch (err) {
      logger.error("Failed to resend invitation", { contactId: contact.id, error: err });
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
              await revokeMutation.mutateAsync(contact.id);
              // Revoke DEK access if the contact had encryption keys shared
              if (contact.clerkUserId) {
                revokeDEK.mutate(contact.clerkUserId);
              }
              toast.success({ message: "Access has been revoked." });
            } catch (err) {
              logger.error("Failed to revoke trusted contact access", { contactId: contact.id, error: err });
              toast.error({
                message: "Couldn\u2019t revoke access.",
              });
            }
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Trusted Contact",
      `This will permanently remove ${fullName} from your trusted contacts. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(contact.id);
              toast.success({ message: "Trusted contact has been deleted." });
              router.back();
            } catch (err) {
              logger.error("Failed to delete trusted contact", { contactId: contact.id, error: err });
              toast.error({
                message: "Couldn\u2019t delete trusted contact.",
              });
            }
          },
        },
      ],
    );
  };

  const handleRestore = () => {
    Alert.alert(
      "Restore Access",
      `This will send a new invitation to ${fullName}. They\u2019ll need to accept it to regain access.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            try {
              const request: CreateTrustedContactRequest = {
                email: contact.email,
                firstName: contact.firstName,
                lastName: contact.lastName,
                relationship: contact.relationship,
                accessLevel: contact.accessLevel,
                accessTiming: contact.accessTiming,
                notes: contact.notes ?? undefined,
              };

              // Atomic DEK pre-share: if the contact has a known userId,
              // fetch their active public keys and wrap the DEK for each device
              const recipientUserId = contact.clerkUserId;
              if (recipientUserId && dekCryptoKey) {
                try {
                  const recipientKeys =
                    await keys.getPublicKeys(recipientUserId);
                  if (recipientKeys.length > 0) {
                    request.deks = await wrapDEKForRecipient(
                      dekCryptoKey,
                      recipientUserId,
                      recipientKeys,
                    );
                  }
                } catch (dekError) {
                  logger.warn("DEK pre-share failed on restore", {
                    error: dekError,
                  });
                }
              }

              await createMutation.mutateAsync(request);

              toast.success({
                title: "Invitation sent",
                message: `A new invitation has been sent to ${contact.email}.`,
              });
              triggerPrompt(contact.firstName);
              router.back();
            } catch (err) {
              logger.error("Failed to restore trusted contact access", { contactId: contact.id, error: err });
              toast.error({ message: "Couldn\u2019t restore access." });
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

      {/* DEK Sharing Banner */}
      {needsDEKShare && (
        <Card style={styles.dekBanner}>
          <View style={styles.dekBannerContent}>
            <View style={styles.dekBannerIcon}>
              <Ionicons
                name="key-outline"
                size={22}
                color={colors.featureFamily}
              />
            </View>
            <View style={styles.dekBannerText}>
              <Text style={styles.dekBannerTitle}>
                {recipientKeysQuery.isLoading
                  ? "Checking encryption status\u2026"
                  : recipientHasKeys
                    ? "Share encryption access"
                    : "Waiting for account setup"}
              </Text>
              <Text style={styles.dekBannerDescription}>
                {recipientKeysQuery.isLoading
                  ? `Checking whether ${fullName} is ready to receive your encryption key.`
                  : recipientHasKeys
                    ? `${fullName} has accepted your invitation but can\u2019t view your plan until you share your encryption key.`
                    : `${fullName} has accepted your invitation but hasn\u2019t finished setting up their account yet. Once they log in and complete setup, you\u2019ll be able to share your encryption key.`}
              </Text>
            </View>
          </View>
          {recipientHasKeys ? (
            <Pressable
              onPress={handleShareDEK}
              disabled={shareDEK.isPending}
              style={({ pressed }) => [
                styles.dekShareButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.dekShareButtonText}>
                {shareDEK.isPending ? "Sharing..." : "Share Encryption Key"}
              </Text>
            </Pressable>
          ) : recipientKeysQuery.isLoading ? null : (
            <View style={styles.dekShareButtonDisabled}>
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.textTertiary}
              />
              <Text style={styles.dekShareButtonDisabledText}>
                Waiting for {contact.firstName} to finish setup
              </Text>
            </View>
          )}
        </Card>
      )}

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
              {resendMutation.isPending ? "Sending..." : "Resend Invitation"}
            </Text>
          </Pressable>
        )}

        {isRevoked && (
          <Pressable
            onPress={handleRestore}
            disabled={createMutation.isPending}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color={colors.featureFamily}
            />
            <Text style={styles.secondaryButtonText}>
              {createMutation.isPending ? "Restoring..." : "Restore Access"}
            </Text>
          </Pressable>
        )}

        {isActive && (
          <Pressable
            onPress={handleRevoke}
            disabled={revokeMutation.isPending}
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
            <Text style={styles.destructiveButtonText}>Revoke Access</Text>
          </Pressable>
        )}

        {isInactive && (
          <Pressable
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
            style={({ pressed }) => [
              styles.destructiveButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={styles.destructiveButtonText}>
              {deleteMutation.isPending ? "Deleting..." : "Delete Contact"}
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
  // DEK Sharing Banner
  dekBanner: {
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.featureFamily,
    backgroundColor: colors.featureFamilyTint,
  },
  dekBannerContent: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dekBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  dekBannerText: {
    flex: 1,
  },
  dekBannerTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  dekBannerDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
  },
  dekShareButton: {
    backgroundColor: colors.featureFamily,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    alignItems: "center",
  },
  dekShareButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.body,
    color: colors.surface,
  },
  dekShareButtonDisabled: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.pill,
  },
  dekShareButtonDisabledText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
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
