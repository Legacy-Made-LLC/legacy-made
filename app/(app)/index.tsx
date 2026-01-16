import { CategoryCard } from '@/components/dashboard/CategoryCard';
import { categories } from '@/constants/categories';
import { colors, spacing, typography } from '@/constants/theme';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const greeting = getGreeting();

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.welcome}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.pageTitle}>Your Legacy Plan</Text>
      </View>

      <View style={styles.categories}>
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  welcome: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  greeting: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  pageTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  categories: {
    gap: spacing.xs,
  },
});
