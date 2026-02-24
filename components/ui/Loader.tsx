import { colors, spacing, typography } from "@/constants/theme";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface LoaderProps {
  /** Show branded loading screen with logo and app name (requires fonts to be loaded) */
  branded?: boolean;
}

export default function Loader({ branded = false }: LoaderProps) {
  if (!branded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return <BrandedLoader />;
}

function BrandedLoader() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.loading, { opacity: fadeAnim }]}>
      <View style={styles.brandedContent}>
        <Image
          source={require("@/assets/images/muted-green-circle-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Legacy Made</Text>
        <Text style={styles.loadingText}>Getting things ready for you...</Text>
        <ActivityIndicator
          size="small"
          color={colors.textTertiary}
          style={styles.spinner}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  brandedContent: {
    alignItems: "center",
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: spacing.lg,
  },
  appName: {
    fontFamily: typography.fontFamily.serifSemiBold,
    fontSize: typography.sizes.displayMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  spinner: {
    opacity: 0.5,
  },
});
