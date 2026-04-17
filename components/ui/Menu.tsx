import { useApi } from "@/api/useApi";
import { QuotaIndicator, TierBadge } from "@/components/entitlements";
import { EXTERNAL_LINKS } from "@/constants/links";
import { colors, spacing, typography } from "@/constants/theme";
import { useKeyValue } from "@/contexts/KeyValueContext";
import { useEntitlements } from "@/data/EntitlementsProvider";
import { useUpgradePrompt } from "@/data/UpgradePromptContext";
import { useOpenPortal } from "@/hooks/queries";
import { PUSH_TOKEN_STORAGE_KEY } from "@/hooks/usePushNotifications";
import { toast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as Updates from "expo-updates";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const { tierName } = useEntitlements();
  const initial =
    user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || "?";
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "User";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const profileImageUrl = user?.imageUrl;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.profileHeader,
        pressed && styles.profileHeaderPressed,
      ]}
    >
      {profileImageUrl ? (
        <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial.toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.profileInfo}>
        <Text style={styles.profileName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.profileEmail} numberOfLines={1}>
          {email}
        </Text>
        <Text style={styles.profilePlan} numberOfLines={1}>
          {tierName} Plan
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
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
  const { tier, tierName, isFree, getQuotaInfo } = useEntitlements();
  const { showUpgradePrompt } = useUpgradePrompt();
  const portalMutation = useOpenPortal();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSuccess, setImageSuccess] = useState(false);
  const imageSuccessTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showImageSuccess = useCallback(() => {
    setImageSuccess(true);
    clearTimeout(imageSuccessTimer.current);
    imageSuccessTimer.current = setTimeout(() => setImageSuccess(false), 3000);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearTimeout(imageSuccessTimer.current);
  }, []);

  const entriesQuota = getQuotaInfo("entries");

  // Reset form when user changes or when entering edit mode
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  const initial =
    firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || "?";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const profileImageUrl = user?.imageUrl;

  const hasChanges =
    firstName !== (user?.firstName || "") ||
    lastName !== (user?.lastName || "");

  const pickAndUploadImage = async () => {
    if (!user) return;

    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setError(
          "Permission to access photos is required to change your profile picture.",
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setIsUploadingImage(true);
      setError(null);

      if (Platform.OS === "web") {
        // Web: fetch the blob URI and upload directly
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        await user.setProfileImage({ file: blob });
      } else {
        // Native: use expo-file-system to read as base64
        const base64 = new FileSystem.File(asset.uri).base64Sync();
        const mimeType = asset.mimeType || "image/jpeg";
        const dataUri = `data:${mimeType};base64,${base64}`;
        await user.setProfileImage({ file: dataUri });
      }

      showImageSuccess();
    } catch (err) {
      logger.error("Profile image upload failed", err);
      const clerkError = err as { errors?: { message: string }[] };
      if (clerkError.errors && clerkError.errors.length > 0) {
        setError(clerkError.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update profile picture. Please try again.");
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user || !hasChanges) return;

    setIsSaving(true);
    setError(null);

    try {
      await user.update({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      setIsEditing(false);
    } catch (err) {
      const clerkError = err as { errors?: { message: string }[] };
      if (clerkError.errors && clerkError.errors.length > 0) {
        setError(clerkError.errors[0].message);
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setError(null);
    setIsEditing(false);
  };

  const handleBack = () => {
    if (isEditing) {
      handleCancel();
    }
    onBack();
  };

  return (
    <View style={styles.accountView}>
      {/* Header */}
      <View style={styles.accountHeader}>
        <Pressable
          onPress={handleBack}
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

      <ScrollView
        style={styles.accountScrollView}
        contentContainerStyle={styles.accountScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Large Avatar */}
        <View style={styles.accountAvatarContainer}>
          <Pressable
            onPress={isEditing ? pickAndUploadImage : undefined}
            disabled={!isEditing || isUploadingImage}
            style={({ pressed }) => [
              styles.avatarPressable,
              isEditing && pressed && styles.avatarPressablePressed,
            ]}
          >
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.accountAvatarImage}
              />
            ) : (
              <View style={styles.accountAvatar}>
                <Text style={styles.accountAvatarText}>
                  {initial.toUpperCase()}
                </Text>
              </View>
            )}
            {isEditing && (
              <View style={styles.avatarEditOverlay}>
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Ionicons name="camera" size={24} color={colors.surface} />
                )}
              </View>
            )}
          </Pressable>
          {!isEditing && (
            <Pressable
              onPress={() => setIsEditing(true)}
              style={({ pressed }) => [
                styles.editProfileButton,
                pressed && styles.editProfileButtonPressed,
              ]}
            >
              <Ionicons
                name="pencil-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </Pressable>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Image Upload Success */}
        {imageSuccess && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>Profile picture updated</Text>
          </View>
        )}

        {/* User Info Fields */}
        {isEditing ? (
          <View style={styles.editableFields}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>FIRST NAME</Text>
              <TextInput
                style={styles.textInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isSaving}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>LAST NAME</Text>
              <TextInput
                style={styles.textInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isSaving}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyValue}>{email}</Text>
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={colors.textTertiary}
                />
              </View>
              <Text style={styles.fieldHint}>Email cannot be changed here</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                onPress={handleCancel}
                disabled={isSaving}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.cancelButtonPressed,
                  isSaving && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={isSaving || !hasChanges}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.saveButtonPressed,
                  (isSaving || !hasChanges) && styles.buttonDisabled,
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.accountFields}>
            <View style={styles.accountField}>
              <Text style={styles.fieldLabel}>First Name</Text>
              <Text style={styles.fieldValue}>{firstName || "Not set"}</Text>
            </View>
            <View style={styles.accountFieldDivider} />
            <View style={styles.accountField}>
              <Text style={styles.fieldLabel}>Last Name</Text>
              <Text style={styles.fieldValue}>{lastName || "Not set"}</Text>
            </View>
            <View style={styles.accountFieldDivider} />
            <View style={styles.accountField}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{email}</Text>
            </View>
          </View>
        )}

        {/* Subscription Section */}
        <View style={styles.subscriptionSection}>
          <Text style={styles.subscriptionSectionTitle}>SUBSCRIPTION</Text>
          <View style={styles.accountFields}>
            <View style={styles.accountField}>
              <Text style={styles.fieldLabel}>Plan</Text>
              <TierBadge tier={tier} tierName={tierName} />
            </View>
            {!isFree && entriesQuota && !entriesQuota.unlimited && (
              <>
                <View style={styles.accountFieldDivider} />
                <View style={styles.accountField}>
                  <Text style={styles.fieldLabel}>Entries</Text>
                  <QuotaIndicator quota={entriesQuota} />
                </View>
              </>
            )}
            {isFree && (
              <>
                <View style={styles.accountFieldDivider} />
                <Pressable
                  onPress={() => showUpgradePrompt()}
                  style={({ pressed }) => [
                    styles.accountField,
                    pressed && styles.upgradeFieldPressed,
                  ]}
                >
                  <Text style={styles.upgradeFieldLabel}>
                    Upgrade your plan
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.primary}
                  />
                </Pressable>
              </>
            )}
            {!isFree && (
              <>
                <View style={styles.accountFieldDivider} />
                <Pressable
                  onPress={() =>
                    portalMutation.mutate(undefined, {
                      onError: () => {
                        toast.error({
                          message:
                            "We couldn’t open billing right now. Please try again in a moment.",
                        });
                      },
                    })
                  }
                  disabled={portalMutation.isPending}
                  style={({ pressed }) => [
                    styles.accountField,
                    pressed && styles.upgradeFieldPressed,
                  ]}
                >
                  <Text style={styles.upgradeFieldLabel}>
                    {portalMutation.isPending
                      ? "Opening..."
                      : "Manage Subscription"}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.primary}
                  />
                </Pressable>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer with Sign Out */}
      <View
        style={[
          styles.accountFooter,
          { paddingBottom: bottomInset + spacing.lg },
        ]}
      >
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
        <Pressable
          onPress={() =>
            WebBrowser.openBrowserAsync(
              "https://app.mylegacymade.com/delete-account",
            )
          }
          style={({ pressed }) => [
            styles.deleteAccountLink,
            pressed && styles.deleteAccountLinkPressed,
          ]}
        >
          <Text style={styles.deleteAccountText}>Delete Account</Text>
          <Ionicons
            name="open-outline"
            size={14}
            color={colors.textTertiary}
            style={{ marginLeft: spacing.xs }}
          />
        </Pressable>
      </View>
    </View>
  );
}

// Main Menu Component
export function Menu({ visible, onClose }: MenuProps) {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { userStorage } = useKeyValue();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { pushTokens } = useApi();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentView, setCurrentView] = useState<MenuView>("main");
  const [buildInfoVisible, setBuildInfoVisible] = useState(false);
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

  // Security items
  const securityItems = [
    {
      label: "Key Backup",
      route: "/settings/key-backup",
      icon: "key-outline" as const,
    },
    {
      label: "My Devices",
      route: "/settings/devices",
      icon: "phone-portrait-outline" as const,
    },
  ];

  // Support items with external links
  const supportItems = [
    {
      label: "Help & FAQ",
      url: EXTERNAL_LINKS.helpFaq,
      icon: "help-circle-outline" as const,
    },
    {
      label: "Contact Support",
      url: EXTERNAL_LINKS.contactSupport,
      icon: "chatbubble-outline" as const,
    },
    {
      label: "Privacy Policy",
      url: EXTERNAL_LINKS.privacyPolicy,
      icon: "shield-outline" as const,
    },
  ];

  const handleSignOut = async () => {
    onClose();
    try {
      // Best-effort: unregister push token before clearing auth
      try {
        const token = userStorage.getString(PUSH_TOKEN_STORAGE_KEY);
        if (token) {
          await pushTokens.unregister(token);
          userStorage.remove(PUSH_TOKEN_STORAGE_KEY);
        }
      } catch (tokenErr) {
        logger.error("Push token cleanup failed", tokenErr);
      }

      queryClient.clear();
      await signOut();
    } catch (err) {
      logger.error("Sign-out failed", err);
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

                {/* Security Section */}
                <MenuSection title="SECURITY">
                  {securityItems.map((item) => (
                    <MenuItem
                      key={item.label}
                      label={item.label}
                      icon={item.icon}
                      onPress={() => handleNavigation(item.route)}
                    />
                  ))}
                </MenuSection>

                {/* Reminders Section */}
                <MenuSection title="REMINDERS">
                  <MenuItem
                    label="Reminder Settings"
                    icon="notifications-outline"
                    onPress={() => handleNavigation("/settings/reminders")}
                  />
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
                  <Ionicons
                    name="log-out-outline"
                    size={20}
                    color={colors.error}
                  />
                  <Text style={styles.mainSignOutText}>Log Out</Text>
                </Pressable>
                <View style={styles.footerVersionRow}>
                  <Text style={styles.footerText}>
                    Version {Constants.expoConfig?.version ?? "1"}
                  </Text>
                  <Pressable
                    onPress={() => setBuildInfoVisible(true)}
                    hitSlop={12}
                    accessibilityLabel="Build information"
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                </View>
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
      <BuildInfoModal
        visible={buildInfoVisible}
        onClose={() => setBuildInfoVisible(false)}
      />
    </Modal>
  );
}

// ─── Build Info Modal ────────────────────────────────────────────────

function BuildInfoModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  if (!visible) return null;

  const appVersion = Constants.expoConfig?.version;
  const runtimeVersion =
    typeof Updates.runtimeVersion === "string"
      ? Updates.runtimeVersion
      : undefined;
  const updateId = Updates.updateId;
  const updateCreatedAt = Updates.createdAt;
  const channel = Updates.channel;
  const isEmbeddedLaunch = Updates.isEmbeddedLaunch;

  const rows: { label: string; value: string }[] = [
    { label: "App Version", value: appVersion ?? "–" },
    ...(runtimeVersion
      ? [{ label: "Runtime Version", value: runtimeVersion }]
      : []),
    ...(channel ? [{ label: "Channel", value: channel }] : []),
    {
      label: "Update",
      value: isEmbeddedLaunch
        ? "Embedded (native build)"
        : updateId
          ? `OTA (${updateId.slice(0, 8)})`
          : "–",
    },
    ...(updateCreatedAt
      ? [
          {
            label: "Update Published",
            value: updateCreatedAt.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]
      : []),
  ];

  return (
    <Pressable style={buildInfoStyles.overlay} onPress={onClose}>
      <View style={buildInfoStyles.container}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={buildInfoStyles.card}>
            <Text style={buildInfoStyles.title}>Build Info</Text>

            {rows.map((row) => (
              <View key={row.label} style={buildInfoStyles.row}>
                <Text style={buildInfoStyles.label}>{row.label}</Text>
                <Text style={buildInfoStyles.value} selectable>
                  {row.value}
                </Text>
              </View>
            ))}

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                buildInfoStyles.closeButton,
                pressed && buildInfoStyles.closeButtonPressed,
              ]}
            >
              <Text style={buildInfoStyles.closeButtonText}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </View>
    </Pressable>
  );
}

const buildInfoStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  container: {
    width: "80%",
    maxWidth: 300,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: spacing.xs + 2,
  },
  label: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  value: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.bodySmall,
    color: colors.textPrimary,
    flex: 1.2,
    textAlign: "right",
  },
  closeButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  closeButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
});

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
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  profilePlan: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily.medium,
    color: colors.textTertiary,
    marginTop: 4,
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
  footerVersionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  footerText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily.regular,
    color: colors.textTertiary,
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
  avatarPressable: {
    position: "relative",
  },
  avatarPressablePressed: {
    opacity: 0.8,
  },
  accountAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  accountAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  accountAvatarText: {
    fontSize: 32,
    fontFamily: typography.fontFamily.semibold,
    color: colors.surface,
  },
  avatarEditOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
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
  deleteAccountLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  deleteAccountLinkPressed: {
    opacity: 0.5,
  },
  deleteAccountText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    color: colors.textTertiary,
  },

  // Account View - Scrollable Content
  accountScrollView: {
    flex: 1,
  },
  accountScrollContent: {
    paddingBottom: spacing.lg,
  },

  // Edit Profile Button
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  editProfileButtonPressed: {
    opacity: 0.7,
  },
  editProfileText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },

  // Error Display
  errorContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: `${colors.error}15`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  errorText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    color: colors.error,
    textAlign: "center",
  },
  successContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: `${colors.success}15`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.success}30`,
  },
  successText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily.regular,
    color: colors.success,
    textAlign: "center",
  },

  // Editable Fields
  editableFields: {
    paddingHorizontal: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sizes.label,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  readOnlyField: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSecondary,
  },
  readOnlyValue: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    flex: 1,
  },
  fieldHint: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily.regular,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  cancelButtonText: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  saveButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  saveButtonText: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.medium,
    color: colors.surface,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Subscription Section
  subscriptionSection: {
    marginTop: spacing.lg,
  },
  subscriptionSectionTitle: {
    fontSize: typography.sizes.label,
    fontFamily: typography.fontFamily.medium,
    color: colors.textTertiary,
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  upgradeFieldLabel: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  upgradeFieldPressed: {
    backgroundColor: colors.divider,
  },
});
