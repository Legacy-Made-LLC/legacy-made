import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@/constants/theme";
import { useClerk } from "@clerk/clerk-expo";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const MENU_WIDTH = width * 0.8;

interface MenuProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItemProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

function MenuItem({ label, onPress, icon }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
    >
      {icon && <Ionicons name={icon} size={20} color={colors.textPrimary} style={styles.menuItemIcon} />}
      <Text style={styles.menuItemLabel}>{label}</Text>
    </Pressable>
  );
}

export function Menu({ visible, onClose }: MenuProps) {
  const insets = useSafeAreaInsets();
  const { signOut } = useClerk();
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(MENU_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleSignOut = async () => {
    onClose();
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  useEffect(() => {
    if (visible) {
      // Reset animation values before showing
      slideAnim.setValue(MENU_WIDTH);
      fadeAnim.setValue(0);
      setModalVisible(true);

      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      // Animate out, then hide modal
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: MENU_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [fadeAnim, modalVisible, slideAnim, visible]);

  return (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={styles.overlayPressable} onPress={onClose}>
          <View style={styles.overlayBackground} />
        </Pressable>
      </Animated.View>
      <Animated.View
        style={[
          styles.menuContainer,
          { paddingTop: insets.top, transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.menuContent}>
          <View style={styles.menuHeader}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              hitSlop={8}
            >
              <Text style={styles.closeIcon}>×</Text>
            </Pressable>
            <Text style={styles.menuTitle}>Menu</Text>
          </View>

          <View style={styles.menuItems}>
            <MenuItem
              icon="home-outline"
              label="Home"
              onPress={() => {
                onClose();
              }}
            />
            <MenuItem
              icon="settings-outline"
              label="Settings"
              onPress={() => {
                onClose();
              }}
            />
            <MenuItem
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => {
                onClose();
              }}
            />
            <MenuItem
              icon="book-outline"
              label="About Legacy Made"
              onPress={() => {
                onClose();
              }}
            />
          </View>

          <View
            style={[
              styles.menuFooter,
              { paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.signOutButton,
                pressed && styles.signOutButtonPressed,
              ]}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
            <Text style={styles.footerText}>Version 1.0.0</Text>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayPressable: {
    flex: 1,
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  menuContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuContent: {
    flex: 1,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuTitle: {
    fontSize: typography.sizes.titleMedium,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  closeButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  closeIcon: {
    fontSize: 24,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  menuItems: {
    flex: 1,
    paddingTop: spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuItemPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  menuItemIcon: {
    marginRight: spacing.md,
  },
  menuItemLabel: {
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  menuFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  signOutButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.md,
  },
  signOutButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  signOutText: {
    fontSize: typography.sizes.body,
    color: colors.error,
    fontWeight: typography.weights.medium,
  },
  footerText: {
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
});
