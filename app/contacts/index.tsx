import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GuidanceCard } from '@/components/ui/GuidanceCard';
import { useAppContext } from '@/data/store';
import { categories } from '@/constants/categories';
import { colors, typography, spacing } from '@/constants/theme';

const category = categories.find((c) => c.id === 'contacts')!;

export default function ContactsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useAppContext();

  const handleAddContact = () => {
    router.push('/contacts/new');
  };

  const handleContactPress = (id: string) => {
    router.push(`/contacts/${id}`);
  };

  if (state.contacts.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={styles.emptyIcon}>👤</Text>
        <Text style={styles.emptyTitle}>No contacts added yet</Text>
        <Text style={styles.emptyDescription}>
          Add the first person your loved ones should reach out to.
        </Text>
        <Button title="Add Contact" onPress={handleAddContact} style={styles.emptyButton} />
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

      {state.contacts.map((contact) => (
        <PressableCard
          key={contact.id}
          onPress={() => handleContactPress(contact.id)}
          style={styles.card}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{contact.name}</Text>
              <Text style={styles.cardSubtitle}>
                {contact.relationship}
                {contact.isPrimary && ' · Primary contact'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </PressableCard>
      ))}

      <PressableCard onPress={handleAddContact} style={styles.addCard}>
        <Text style={styles.addText}>+ Add Contact</Text>
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
