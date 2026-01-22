import { colors, spacing } from '@/constants/theme';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  onMenuPress: () => void;
}

export function Header({ onMenuPress }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.spacer} />
        {/* <View style={styles.brand}>
          <Image
            source={require('@/assets/images/muted-green-circle-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View> */}
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
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  spacer: {
    width: 36,
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
