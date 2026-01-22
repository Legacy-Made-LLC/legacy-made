import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { borderRadius, colors, shadows, spacing, typography } from "@/constants/theme";
import { useOnboardingContext } from "@/data/OnboardingContext";
import { useAppContext } from "@/data/store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DevAction {
  id: string;
  label: string;
  icon: string;
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
  const { refresh, isLoading } = useAppContext();

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
    await refresh();
    setIsOpen(false);
  };

  const actions: DevAction[] = [
    {
      id: "skip-onboarding",
      label: hasCompletedInitialOnboarding ? "Onboarding already complete" : "Skip Onboarding",
      icon: "⏭️",
      onPress: handleSkipOnboarding,
    },
    {
      id: "restart-onboarding",
      label: "Restart Onboarding",
      icon: "🔄",
      onPress: handleRestartOnboarding,
    },
    {
      id: "sign-out",
      label: isSignedIn ? "Sign Out" : "Not signed in",
      icon: "🚪",
      onPress: handleSignOut,
    },
    {
      id: "refresh-data",
      label: isLoading ? "Refreshing..." : "Refresh Data",
      icon: "🔃",
      onPress: handleRefreshData,
    },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed,
          { bottom: insets.bottom + spacing.md },
        ]}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.fabIcon}>🛠️</Text>
      </Pressable>

      {/* Menu Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.menuContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.menu}>
                <View style={styles.header}>
                  <Text style={styles.headerIcon}>🛠️</Text>
                  <Text style={styles.headerTitle}>Dev Menu</Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Onboarding:</Text>
                  <Text style={[
                    styles.statusValue,
                    hasCompletedInitialOnboarding ? styles.statusComplete : styles.statusIncomplete
                  ]}>
                    {hasCompletedInitialOnboarding ? "Complete" : "Not complete"}
                  </Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Auth:</Text>
                  <Text style={[
                    styles.statusValue,
                    isSignedIn ? styles.statusComplete : styles.statusIncomplete
                  ]}>
                    {isSignedIn ? "Signed in" : "Not signed in"}
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
                    <Text style={styles.menuItemIcon}>{action.icon}</Text>
                    <Text style={[
                      styles.menuItemLabel,
                      action.destructive && styles.menuItemLabelDestructive,
                    ]}>
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
  fabIcon: {
    fontSize: 24,
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
    fontSize: 20,
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
    fontSize: 18,
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
