import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/constants/theme';

interface HeaderProps {
  onMenuPress: () => void;
}

export function Header({ onMenuPress }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.spacer} />
        <View style={styles.brand}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Legacy Made</Text>
        </View>
        <View style={styles.menuContainer}>
          <Pressable
            onPress={onMenuPress}
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.menuButtonPressed,
            ]}
            hitSlop={8}
          >
            <View style={styles.menuIcon}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  spacer: {
    width: 36,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 20,
    height: 20,
    marginRight: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.titleMedium,
    color: colors.textPrimary,
  },
  menuContainer: {
    width: 36,
    alignItems: 'flex-end',
  },
  menuButton: {
    padding: spacing.xs,
    borderRadius: 8,
  },
  menuButtonPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  menuIcon: {
    width: 20,
    height: 16,
    justifyContent: 'space-between',
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: colors.textPrimary,
    borderRadius: 1,
  },
});
