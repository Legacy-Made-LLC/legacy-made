import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, typography } from "@/constants/theme";

// Home icon with special circular background
function HomeTabIcon() {
  return (
    <View style={styles.homeIconContainer}>
      <Feather name="user" size={22} color="#FFFFFF" />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

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
          title: "Information",
          tabBarIcon: ({ color }) => (
            <Feather name="clipboard" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishes"
        options={{
          title: "Wishes",
          tabBarIcon: ({ color }) => (
            <Feather name="heart" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: () => <HomeTabIcon />,
          tabBarLabel: () => null, // Hide label for home tab
        }}
      />
      <Tabs.Screen
        name="legacy"
        options={{
          title: "Legacy",
          tabBarIcon: ({ color }) => (
            <Feather name="video" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: "Family",
          tabBarIcon: ({ color }) => (
            <Feather name="users" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  homeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#5C6B5D", // Sage green from the image
    justifyContent: "center",
    alignItems: "center",
    marginTop: -12, // Elevate above the tab bar
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
