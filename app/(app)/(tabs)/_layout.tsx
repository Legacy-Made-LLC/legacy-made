import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Pillar } from "@/api/types";
import { colors, typography } from "@/constants/theme";
import { useEntitlements } from "@/data/EntitlementsProvider";

const iconSize = 26;

/**
 * Mapping from tab names to pillars
 */
const TAB_TO_PILLAR: Record<string, Pillar> = {
  information: 'important_info',
  wishes: 'wishes',
  legacy: 'messages',
  family: 'family_access',
};

/**
 * Tab icon wrapper that shows a lock badge when the pillar is locked
 */
function TabIconWithLock({
  icon,
  isLocked,
}: {
  icon: React.ReactNode;
  isLocked: boolean;
}) {
  if (!isLocked) {
    return <>{icon}</>;
  }

  return (
    <View style={styles.lockedIconContainer}>
      {icon}
      <View style={styles.lockBadge}>
        <Ionicons name="lock-closed" size={8} color={colors.surface} />
      </View>
    </View>
  );
}

// Home icon with special circular background
function HomeTabIcon({ focused }: { focused: boolean }) {
  if (focused) {
    return (
      <Image
        source={require("@/assets/images/muted-green-logo-rounded-rectangle.png")}
        style={styles.homeIcon}
      />
    );
  }
  return (
    <Image
      source={require("@/assets/images/muted-green-logo-rounded-rectangle-outline.png")}
      style={styles.homeIcon}
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isLockedPillar } = useEntitlements();

  // Check if each pillar is locked
  const isWishesLocked = isLockedPillar(TAB_TO_PILLAR.wishes);
  const isLegacyLocked = isLockedPillar(TAB_TO_PILLAR.legacy);
  const isFamilyLocked = isLockedPillar(TAB_TO_PILLAR.family);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.medium,
          fontSize: 10,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="information"
        options={{
          title: "Info",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "document-text" : "document-text-outline"}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wishes"
        options={{
          title: "Wishes",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithLock
              isLocked={isWishesLocked}
              icon={
                <Ionicons
                  name={focused ? "heart" : "heart-outline"}
                  size={iconSize}
                  color={isWishesLocked ? colors.textTertiary : color}
                />
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <HomeTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="legacy"
        options={{
          title: "Legacy",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithLock
              isLocked={isLegacyLocked}
              icon={
                <Ionicons
                  name={focused ? "videocam" : "videocam-outline"}
                  size={iconSize}
                  color={isLegacyLocked ? colors.textTertiary : color}
                />
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: "Family",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWithLock
              isLocked={isFamilyLocked}
              icon={
                <Ionicons
                  name={focused ? "people" : "people-outline"}
                  size={iconSize}
                  color={isFamilyLocked ? colors.textTertiary : color}
                />
              }
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  homeIcon: {
    width: iconSize + 5,
    height: iconSize + 5,
  },
  homeIconFocused: {
    opacity: 0.8,
  },
  lockedIconContainer: {
    position: "relative",
  },
  lockBadge: {
    position: "absolute",
    bottom: -2,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.textTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
});
