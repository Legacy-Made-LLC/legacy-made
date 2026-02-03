import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/constants/theme';

interface PacingNoteProps {
  text?: string;
}

const DEFAULT_PACING_NOTE = "There's no rush — come back anytime.";

export function PacingNote({ text = DEFAULT_PACING_NOTE }: PacingNoteProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    width: '100%',
  },
  text: {
    fontSize: typography.sizes.bodySmall,
    color: colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
