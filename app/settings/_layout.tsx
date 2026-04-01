import { colors, spacing, typography } from "@/constants/theme";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { Redirect, Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Custom header for settings screens that matches the app's design language.
 * Handles safe area insets directly since settings screens are outside the (app)
 * group and don't have a parent Header component.
 * Always shows a back button — uses navigation.goBack when there's a prior
 * screen in the settings stack, otherwise falls back to router.back() to
 * return to the root stack (e.g. back to the app from the menu).
 */
function SettingsHeader({ navigation, options, back }: NativeStackHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const title = typeof options.title === "string" ? options.title : "";

  const handleBack = () => {
    if (back) {
      navigation.goBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[headerStyles.container, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable
        onPress={handleBack}
        style={({ pressed }) => [
          headerStyles.backButton,
          pressed && headerStyles.backButtonPressed,
        ]}
        hitSlop={8}
      >
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <View style={headerStyles.titleContainer}>
        <Text style={headerStyles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={headerStyles.spacer} />
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: spacing.xs,
    borderRadius: 8,
    marginRight: spacing.xs,
  },
  backButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontFamily: typography.fontFamily.serifSemiBold,
    fontSize: typography.sizes.titleLarge,
    color: colors.textPrimary,
    textAlign: "center",
  },
  spacer: {
    width: 32,
  },
});

export default function SettingsLayout() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Stack
      screenOptions={{
        header: SettingsHeader,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="recovery" options={{ headerShown: false }} />
      <Stack.Screen
        name="recover-escrow"
        options={{ title: "Recover from Backup" }}
      />
      <Stack.Screen
        name="recover-document"
        options={{ title: "Recovery Document" }}
      />
      <Stack.Screen
        name="key-backup"
        options={{ title: "Back Up Your Key" }}
      />
      <Stack.Screen
        name="key-backup-escrow"
        options={{ title: "Legacy Made Recovery" }}
      />
      <Stack.Screen
        name="key-backup-offline-document"
        options={{ title: "Recovery Document" }}
      />
      <Stack.Screen
        name="device-linking"
        options={{ title: "Link Device" }}
      />
      <Stack.Screen
        name="devices"
        options={{ title: "My Devices" }}
      />
      <Stack.Screen
        name="reminders"
        options={{ title: "Reminders" }}
      />
    </Stack>
  );
}
