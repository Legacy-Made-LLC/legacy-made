/**
 * i18n Usage Example
 *
 * This file demonstrates how to use the i18n system with perspective switching.
 * Copy these patterns when building new components or migrating existing ones.
 */

import React from 'react';
import { View, Text, FlatList, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { vaultSections } from '@/constants/vault-structure';
import { useTranslations, usePerspective } from '@/contexts/LocaleContext';
import type { VaultSection as StructuralVaultSection } from '@/constants/vault-structure';

// ============================================================================
// Example 1: Dashboard with Vault Sections
// ============================================================================

/**
 * Displays all vault sections with titles and descriptions.
 * Text automatically changes based on current perspective.
 */
export function VaultDashboard() {
  const t = useTranslations();

  return (
    <FlatList
      data={vaultSections}
      keyExtractor={(section) => section.id}
      renderItem={({ item: section }) => {
        const text = t.vault[section.id];
        return (
          <SectionCard
            icon={section.ionIcon}
            title={text.title}
            description={text.description}
          />
        );
      }}
    />
  );
}

// ============================================================================
// Example 2: Task Detail Screen
// ============================================================================

/**
 * Displays a single task with all its text content.
 * Text automatically updates when perspective changes.
 */
export function TaskDetailScreen({
  sectionId,
  taskId,
}: {
  sectionId: string;
  taskId: string;
}) {
  const t = useTranslations();

  // Type-safe access to task text
  const taskText = t.vault[sectionId].tasks[taskId];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{taskText.title}</Text>
      <Text style={styles.description}>{taskText.description}</Text>

      {taskText.guidanceHeading && (
        <Text style={styles.guidanceHeading}>{taskText.guidanceHeading}</Text>
      )}

      <Text style={styles.guidance}>{taskText.guidance}</Text>

      {taskText.tips && taskText.tips.length > 0 && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsHeading}>What else should I know?</Text>
          {taskText.tips.map((tip, index) => (
            <Text key={index} style={styles.tip}>
              • {tip}
            </Text>
          ))}
        </View>
      )}

      {taskText.pacingNote && (
        <Text style={styles.pacingNote}>{taskText.pacingNote}</Text>
      )}
    </View>
  );
}

// ============================================================================
// Example 3: Empty State
// ============================================================================

/**
 * Shows empty state with appropriate text for current perspective.
 */
export function ContactsEmptyState() {
  const t = useTranslations();

  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="person-outline" size={64} color="#9B9B9B" />
      <Text style={styles.emptyTitle}>
        {t.common.emptyStates.contacts.title}
      </Text>
      <Text style={styles.emptyDescription}>
        {t.common.emptyStates.contacts.description}
      </Text>
    </View>
  );
}

// ============================================================================
// Example 4: Progress Indicator
// ============================================================================

/**
 * Shows progress with appropriate text.
 * Uses function for proper singular/plural handling.
 */
export function ProgressBadge({ count }: { count: number }) {
  const t = useTranslations();

  const text =
    count === 0
      ? t.common.progress.notStarted
      : t.common.progress.itemsAdded(count);

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

// ============================================================================
// Example 5: Perspective Toggle
// ============================================================================

/**
 * UI component to switch between owner and family perspectives.
 * All components automatically re-render with new text.
 */
export function PerspectiveToggle() {
  const { perspective, setPerspective, isOwner, isFamily } = usePerspective();

  return (
    <View style={styles.toggleContainer}>
      <Text style={styles.toggleLabel}>
        {isOwner ? 'Owner View' : 'Family View'}
      </Text>
      <Switch
        value={isFamily}
        onValueChange={(isFamilyView) =>
          setPerspective(isFamilyView ? 'family' : 'owner')
        }
      />
      <Text style={styles.toggleHint}>
        {isOwner
          ? 'Switch to see how your family will see this'
          : 'Switch back to owner view'}
      </Text>
    </View>
  );
}

// ============================================================================
// Example 6: Combined Section + Task List
// ============================================================================

/**
 * Shows a section with its tasks, combining structure and translations.
 */
export function SectionDetailScreen({ sectionId }: { sectionId: string }) {
  const t = useTranslations();

  // Get structural data
  const section = vaultSections.find((s) => s.id === sectionId);
  if (!section) return null;

  // Get translated text
  const sectionText = t.vault[sectionId];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name={section.ionIcon} size={32} color="#8a9785" />
        <Text style={styles.sectionTitle}>{sectionText.title}</Text>
      </View>

      <Text style={styles.sectionDescription}>{sectionText.description}</Text>

      <FlatList
        data={section.tasks}
        keyExtractor={(task) => task.id}
        renderItem={({ item: task }) => {
          const taskText = sectionText.tasks[task.id];
          return (
            <View style={styles.taskCard}>
              <Text style={styles.taskTitle}>{taskText.title}</Text>
              <Text style={styles.taskDescription}>{taskText.description}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

// ============================================================================
// Example 7: Conditional Rendering Based on Perspective
// ============================================================================

/**
 * Shows how to conditionally render different UI based on perspective.
 */
export function ConditionalPerspectiveComponent() {
  const { isOwner, isFamily } = usePerspective();
  const t = useTranslations();

  return (
    <View>
      {isOwner && (
        <Text style={styles.ownerHint}>
          This information will help your family when they need it.
        </Text>
      )}

      {isFamily && (
        <Text style={styles.familyHint}>
          This is the information they wanted you to have.
        </Text>
      )}

      {/* Common content that changes text automatically */}
      <Text>{t.vault.contacts.title}</Text>
    </View>
  );
}

// ============================================================================
// Example 8: Using Wishes Translations
// ============================================================================

/**
 * Shows how to access wishes translations (same pattern as vault).
 */
export function WishesTaskScreen({
  sectionId,
  taskId,
}: {
  sectionId: string;
  taskId: string;
}) {
  const t = useTranslations();

  // Access wishes translations
  const taskText = t.wishes[sectionId].tasks[taskId];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{taskText.title}</Text>
      <Text style={styles.description}>{taskText.description}</Text>
      <Text style={styles.guidance}>{taskText.guidance}</Text>
    </View>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function SectionCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <Ionicons name={icon as any} size={24} color="#8a9785" />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FAF9F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6B6B6B',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B6B6B',
    marginBottom: 16,
  },
  guidanceHeading: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 16,
  },
  guidance: {
    fontSize: 16,
    color: '#6B6B6B',
    lineHeight: 24,
  },
  tipsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F5F4F2',
    borderRadius: 12,
  },
  tipsHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  tip: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 8,
    lineHeight: 20,
  },
  pacingNote: {
    fontSize: 14,
    color: '#9B9B9B',
    fontStyle: 'italic',
    marginTop: 16,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  taskCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F4F2',
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  toggleContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  toggleHint: {
    fontSize: 12,
    color: '#9B9B9B',
    marginTop: 8,
    textAlign: 'center',
  },
  ownerHint: {
    fontSize: 14,
    color: '#8a9785',
    backgroundColor: '#F5F4F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  familyHint: {
    fontSize: 14,
    color: '#8a9785',
    backgroundColor: '#F5F4F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
});
