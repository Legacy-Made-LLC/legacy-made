import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { onboardingStyles as styles } from "./onboardingStyles";

interface OnboardingHeaderProps {
  showBackButton?: boolean;
}

export function OnboardingHeader({
  showBackButton = false,
}: OnboardingHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={{ paddingTop: insets.top }}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          {showBackButton && (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
              hitSlop={12}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>
          )}
        </View>
        <Image
          source={require("@/assets/images/muted-green-circle-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerRight} />
      </View>
    </View>
  );
}
