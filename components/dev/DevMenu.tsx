import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";

import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from "@/constants/theme";
import { usePerspective } from "@/contexts/LocaleContext";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DevAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

export function DevMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { signOut, isSignedIn } = useAuth();
  const {
    hasCompletedInitialOnboarding,
    setHasCompletedInitialOnboarding,
    resetOnboardingState,
  } = useOnboardingContext();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const isLoading = isFetching > 0;
  const { perspective, setPerspective, familyTense, setFamilyTense, isFamily } =
    usePerspective();

  const insets = useSafeAreaInsets();

  // Only render in development
  if (!__DEV__) {
    return null;
  }

  const handleSkipOnboarding = () => {
    setHasCompletedInitialOnboarding(true);
    setIsOpen(false);
    router.replace("/(app)");
  };

  const handleRestartOnboarding = () => {
    setHasCompletedInitialOnboarding(false);
    resetOnboardingState();
    setIsOpen(false);
    router.replace("/(onboarding)");
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    router.replace("/(auth)");
  };

  const handleRefreshData = async () => {
    await queryClient.invalidateQueries();
    setIsOpen(false);
  };

  const handleTogglePerspective = () => {
    setPerspective(perspective === "owner" ? "family" : "owner");
  };

  const handleToggleFamilyTense = () => {
    setFamilyTense(familyTense === "present" ? "past" : "present");
  };

  const perspectiveLabel =
    perspective === "owner"
      ? "Owner (you/your)"
      : `Family (they/their) — ${familyTense}`;

  const actions: DevAction[] = [
    {
      id: "toggle-perspective",
      label: `Perspective: ${perspectiveLabel}`,
      icon: "people-outline",
      onPress: handleTogglePerspective,
    },
    ...(isFamily
      ? [
          {
            id: "toggle-family-tense",
            label: `Family Tense: ${familyTense === "present" ? "Present (alive)" : "Past (passed)"}`,
            icon: "time-outline" as keyof typeof Ionicons.glyphMap,
            onPress: handleToggleFamilyTense,
          },
        ]
      : []),
    {
      id: "skip-onboarding",
      label: hasCompletedInitialOnboarding
        ? "Onboarding already complete"
        : "Skip Onboarding",
      icon: "play-skip-forward-outline",
      onPress: handleSkipOnboarding,
    },
    {
      id: "restart-onboarding",
      label: "Restart Onboarding",
      icon: "refresh-outline",
      onPress: handleRestartOnboarding,
    },
    {
      id: "sign-out",
      label: isSignedIn ? "Sign Out" : "Not signed in",
      icon: "log-out-outline",
      onPress: handleSignOut,
    },
    {
      id: "refresh-data",
      label: isLoading ? "Refreshing..." : "Refresh Data",
      icon: "sync-outline",
      onPress: handleRefreshData,
    },
    {
      id: "test-error",
      label: "Test Error",
      icon: "bug-outline",
      onPress: () => {
        Sentry.captureException(new Error("Test error"));
      },
    },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed,
          { bottom: insets.bottom + spacing.lg },
        ]}
        onPress={() => setIsOpen(true)}
      >
        <Ionicons name="build-outline" size={24} color="white" />
      </Pressable>

      {/* Menu Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.menuContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.menu}>
                <View style={styles.header}>
                  <Ionicons
                    name="build-outline"
                    size={20}
                    color={colors.textPrimary}
                    style={styles.headerIcon}
                  />
                  <Text style={styles.headerTitle}>Dev Menu</Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Onboarding:</Text>
                  <Text
                    style={[
                      styles.statusValue,
                      hasCompletedInitialOnboarding
                        ? styles.statusComplete
                        : styles.statusIncomplete,
                    ]}
                  >
                    {hasCompletedInitialOnboarding
                      ? "Complete"
                      : "Not complete"}
                  </Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Auth:</Text>
                  <Text
                    style={[
                      styles.statusValue,
                      isSignedIn
                        ? styles.statusComplete
                        : styles.statusIncomplete,
                    ]}
                  >
                    {isSignedIn ? "Signed in" : "Not signed in"}
                  </Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Perspective:</Text>
                  <Text style={[styles.statusValue, styles.statusComplete]}>
                    {perspective === "owner"
                      ? "Owner"
                      : `Family (${familyTense})`}
                  </Text>
                </View>

                <View style={styles.divider} />

                {actions.map((action) => (
                  <Pressable
                    key={action.id}
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && styles.menuItemPressed,
                      action.destructive && styles.menuItemDestructive,
                    ]}
                    onPress={action.onPress}
                  >
                    <Ionicons
                      name={action.icon}
                      size={18}
                      color={
                        action.destructive ? colors.error : colors.textPrimary
                      }
                      style={styles.menuItemIcon}
                    />
                    <Text
                      style={[
                        styles.menuItemLabel,
                        action.destructive && styles.menuItemLabelDestructive,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                ))}

                <View style={styles.divider} />

                <Pressable
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.closeButtonPressed,
                  ]}
                  onPress={() => setIsOpen(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(60, 60, 60, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    ...shadows.card,
    shadowOpacity: 0.2,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    width: "85%",
    maxWidth: 320,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.card,
    shadowOpacity: 0.1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerIcon: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleLarge,
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  statusLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  statusValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.bodySmall,
  },
  statusComplete: {
    color: colors.success,
  },
  statusIncomplete: {
    color: colors.warning,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs / 2,
  },
  menuItemPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  menuItemDestructive: {},
  menuItemIcon: {
    marginRight: spacing.md,
  },
  menuItemLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  menuItemLabelDestructive: {
    color: colors.error,
  },
  closeButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
  },
  closeButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  closeButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
});
