import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@/constants/theme";
import { SUPPORT_LINKS } from "@/constants/links";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const MENU_WIDTH = width * 0.8;

type MenuView = "main" | "account";

interface MenuProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItemProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  isExternal?: boolean;
}

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
}

interface ProfileHeaderProps {
  onPress: () => void;
}

// Profile Header Component
function ProfileHeader({ onPress }: ProfileHeaderProps) {
  const { user } = useUser();
  const initial =
    user?.firstName?.[0] ||
    user?.primaryEmailAddress?.emailAddress?.[0] ||
    "?";
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "User";
  const email = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.profileHeader,
        pressed && styles.profileHeaderPressed,
      ]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial.toUpperCase()}</Text>
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.profileName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.profileEmail} numberOfLines={1}>
          {email}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.textTertiary}
      />
    </Pressable>
  );
}

// Menu Section Component
function MenuSection({ title, children }: MenuSectionProps) {
  return (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// Menu Item Component
function MenuItem({ label, onPress, icon, isExternal }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={colors.textSecondary}
          style={styles.menuItemIcon}
        />
      )}
      <Text style={styles.menuItemLabel}>{label}</Text>
      <Ionicons
        name={isExternal ? "open-outline" : "chevron-forward"}
        size={isExternal ? 16 : 20}
        color={colors.textTertiary}
        style={styles.menuItemChevron}
      />
    </Pressable>
  );
}

// Account View Component
function AccountView({
  onBack,
  onClose,
  onSignOut,
  bottomInset,
}: {
  onBack: () => void;
  onClose: () => void;
  onSignOut: () => void;
  bottomInset: number;
}) {
  const { user } = useUser();
  const initial =
    user?.firstName?.[0] ||
    user?.primaryEmailAddress?.emailAddress?.[0] ||
    "?";
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "User";
  const email = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <View style={styles.accountView}>
      {/* Header */}
      <View style={styles.accountHeader}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.accountTitle}>Account</Text>
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
      </View>

      {/* Large Avatar */}
      <View style={styles.accountAvatarContainer}>
        <View style={styles.accountAvatar}>
          <Text style={styles.accountAvatarText}>{initial.toUpperCase()}</Text>
        </View>
      </View>

      {/* User Info Fields */}
      <View style={styles.accountFields}>
        <View style={styles.accountField}>
          <Text style={styles.fieldLabel}>Username</Text>
          <Text style={styles.fieldValue}>{displayName}</Text>
        </View>
        <View style={styles.accountFieldDivider} />
        <View style={styles.accountField}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{email}</Text>
        </View>
      </View>

      {/* Footer with Sign Out */}
      <View style={[styles.accountFooter, { paddingBottom: bottomInset + spacing.lg }]}>
        <Pressable
          onPress={onSignOut}
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.signOutButtonPressed,
          ]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Log Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Main Menu Component
export function Menu({ visible, onClose }: MenuProps) {
  const insets = useSafeAreaInsets();
  const { signOut } = useClerk();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentView, setCurrentView] = useState<MenuView>("main");
  const slideAnim = useRef(new Animated.Value(MENU_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const viewSlideAnim = useRef(new Animated.Value(0)).current;

  // Your Plan navigation items
  const planItems = [
    {
      label: "Information Vault",
      route: "/(app)/(tabs)/information",
      icon: "document-text-outline" as const,
    },
    {
      label: "Wishes & Guidance",
      route: "/(app)/(tabs)/wishes",
      icon: "heart-outline" as const,
    },
    {
      label: "Legacy Messages",
      route: "/(app)/(tabs)/legacy",
      icon: "videocam-outline" as const,
    },
    {
      label: "Family",
      route: "/(app)/(tabs)/family",
      icon: "people-outline" as const,
    },
  ];

  // Support items with external links
  const supportItems = [
    {
      label: "Help & FAQ",
      url: SUPPORT_LINKS.helpFaq,
      icon: "help-circle-outline" as const,
    },
    {
      label: "Contact Support",
      url: SUPPORT_LINKS.contactSupport,
      icon: "chatbubble-outline" as const,
    },
    {
      label: "Privacy Policy",
      url: SUPPORT_LINKS.privacyPolicy,
      icon: "shield-outline" as const,
    },
  ];

  const handleSignOut = async () => {
    onClose();
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleNavigation = (route: string) => {
    onClose();
    router.push(route as never);
  };

  const handleExternalLink = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  const navigateToAccount = () => {
    setCurrentView("account");
    Animated.timing(viewSlideAnim, {
      toValue: -MENU_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const navigateToMain = () => {
    Animated.timing(viewSlideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setCurrentView("main"));
  };

  useEffect(() => {
    if (visible) {
      // Reset animation values and view before showing
      slideAnim.setValue(MENU_WIDTH);
      fadeAnim.setValue(0);
      viewSlideAnim.setValue(0);
      setCurrentView("main");
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
  }, [fadeAnim, modalVisible, slideAnim, viewSlideAnim, visible]);

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
        <View style={styles.viewsWrapper}>
          <Animated.View
            style={[
              styles.viewsContainer,
              { transform: [{ translateX: viewSlideAnim }] },
            ]}
          >
            {/* Main Menu View */}
            <View
              style={styles.mainView}
              pointerEvents={currentView === "main" ? "auto" : "none"}
            >
              {/* Header with close button */}
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
              </View>

              {/* Profile Header */}
              <ProfileHeader onPress={navigateToAccount} />

              {/* Scrollable Content */}
              <ScrollView
                style={styles.menuScrollView}
                contentContainerStyle={styles.menuScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Your Plan Section */}
                <MenuSection title="YOUR PLAN">
                  {planItems.map((item) => (
                    <MenuItem
                      key={item.label}
                      label={item.label}
                      icon={item.icon}
                      onPress={() => handleNavigation(item.route)}
                    />
                  ))}
                </MenuSection>

                {/* Support Section */}
                <MenuSection title="SUPPORT">
                  {supportItems.map((item) => (
                    <MenuItem
                      key={item.label}
                      label={item.label}
                      icon={item.icon}
                      isExternal
                      onPress={() => handleExternalLink(item.url)}
                    />
                  ))}
                </MenuSection>
              </ScrollView>

              {/* Fixed Footer with Sign Out */}
              <View
                style={[
                  styles.mainMenuFooter,
                  { paddingBottom: insets.bottom + spacing.lg },
                ]}
              >
                <Pressable
                  onPress={handleSignOut}
                  style={({ pressed }) => [
                    styles.mainSignOutButton,
                    pressed && styles.mainSignOutButtonPressed,
                  ]}
                >
                  <Ionicons name="log-out-outline" size={20} color={colors.error} />
                  <Text style={styles.mainSignOutText}>Log Out</Text>
                </Pressable>
                <Text style={styles.footerText}>Version 1.0.0</Text>
              </View>
            </View>

            {/* Account View (positioned to the right) */}
            <View
              style={[styles.accountViewWrapper, { left: MENU_WIDTH }]}
              pointerEvents={currentView === "account" ? "auto" : "none"}
            >
              <AccountView
                onBack={navigateToMain}
                onClose={onClose}
                onSignOut={handleSignOut}
                bottomInset={insets.bottom}
              />
            </View>
          </Animated.View>
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
  viewsWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  viewsContainer: {
    flexDirection: "row",
    width: MENU_WIDTH * 2,
    height: "100%",
  },
  mainView: {
    width: MENU_WIDTH,
    height: "100%",
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  closeIcon: {
    fontSize: 28,
    color: colors.textSecondary,
    lineHeight: 30,
  },

  // Profile Header
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  profileHeaderPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: typography.sizes.titleMedium,
    fontFamily: typography.fontFamily.semibold,
    color: colors.surface,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Menu Sections
  menuScrollView: {
    flex: 1,
  },
  menuScrollContent: {
    paddingTop: spacing.sm,
  },
  menuSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.label,
    fontFamily: typography.fontFamily.medium,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },

  // Menu Items
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
    width: 24,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  menuItemChevron: {
    marginLeft: spacing.sm,
  },

  // Main Menu Footer
  mainMenuFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  mainSignOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  mainSignOutButtonPressed: {
    opacity: 0.7,
  },
  mainSignOutText: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    marginLeft: spacing.md,
  },
  footerText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily.regular,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.sm,
  },

  // Account View
  accountViewWrapper: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
  },
  accountView: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backText: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.regular,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  accountTitle: {
    fontSize: typography.sizes.titleMedium,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  accountAvatarContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  accountAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  accountAvatarText: {
    fontSize: 32,
    fontFamily: typography.fontFamily.semibold,
    color: colors.surface,
  },
  accountFields: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  accountField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  accountFieldDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  fieldValue: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    flex: 1,
    textAlign: "right",
    marginLeft: spacing.md,
  },
  accountFooter: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  signOutButtonPressed: {
    opacity: 0.7,
  },
  signOutText: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    marginLeft: spacing.sm,
  },
});
