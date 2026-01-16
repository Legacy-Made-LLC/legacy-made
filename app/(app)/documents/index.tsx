import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GuidanceCard } from '@/components/ui/GuidanceCard';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import { useAppContext } from '@/data/store';
import { categories } from '@/constants/categories';
import { colors, typography, spacing } from '@/constants/theme';

const category = categories.find((c) => c.id === 'documents')!;

export default function DocumentsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, isLoading, error, refresh } = useAppContext();

  const handleAdd = () => {
    router.push('/documents/new');
  };

  const handleItemPress = (id: string) => {
    router.push(`/documents/${id}`);
  };

  if (isLoading) {
    return <LoadingScreen message="Loading documents..." />;
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={refresh} />;
  }

  if (state.documents.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={styles.emptyIcon}>📄</Text>
        <Text style={styles.emptyTitle}>No documents added yet</Text>
        <Text style={styles.emptyDescription}>
          Add your important legal documents so your loved ones know where to find them.
        </Text>
        <Button title="Add Document" onPress={handleAdd} style={styles.emptyButton} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <GuidanceCard text={category.guidance} />

      {state.documents.map((item) => (
        <PressableCard
          key={item.id}
          onPress={() => handleItemPress(item.id)}
          style={styles.card}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.documentName}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </PressableCard>
      ))}

      <PressableCard onPress={handleAdd} style={styles.addCard}>
        <Text style={styles.addText}>+ Add Document</Text>
      </PressableCard>
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
    paddingTop: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.sizes.titleMedium,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  addCard: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  addText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.titleLarge,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
});
