/**
 * Legacy Made Design System
 * "Calm, human, respectful, clear, unhurried"
 */

export const colors = {
  // Backgrounds
  background: '#F9F8F8', // Near white
  surface: '#FFFFFF', // Pure white for cards
  surfaceSecondary: '#F5F4F2', // Subtle gray for secondary surfaces

  // Text
  textPrimary: '#1A1A1A', // Near-black for headings
  textSecondary: '#6B6B6B', // Warm gray for body text
  textTertiary: '#9B9B9B', // Light gray for placeholders/hints

  // Accents
  primary: '#8a9785', // Deep navy for primary actions
  primaryPressed: '#7d8a79', // Darker navy for pressed state
  guidanceTrigger: '#7D8A79', // Collapsed guidance trigger text

  // Feature Colors (Four Pillars)
  featureInformation: '#8a9785', // Sage green - Information Vault
  featureWishes: '#B8A9C9', // Soft lavender - Wishes & Guidance
  featureLegacy: '#A3C4D8', // Soft blue - Legacy Messages
  featureFamily: '#E0B8A8', // Warm blush/peach - Family Access

  // Feature Background Tints (soft for card backgrounds)
  featureInformationTint: '#EEF2EC', // Soft sage tint
  featureWishesTint: '#F2EDF6', // Soft lavender tint
  featureLegacyTint: '#ECF2F6', // Soft blue tint
  featureFamilyTint: '#F8F0ED', // Soft blush tint

  // Semantic
  success: '#4A7C59', // Muted green
  warning: '#C17817', // Warm amber
  error: '#A63D40', // Muted red

  // Borders & Dividers
  border: '#E8E6E3', // Soft warm gray
  divider: '#F0EEEB', // Very light divider
};

export const typography = {
  fontFamily: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semibold: 'DMSans_600SemiBold',
    bold: 'DMSans_700Bold',
    serif: 'LibreBaskerville_400Regular',
    serifMedium: 'LibreBaskerville_500Medium',
    serifSemiBold: 'LibreBaskerville_600SemiBold',
    serifBold: 'LibreBaskerville_700Bold',
  },

  sizes: {
    displayLarge: 32, // Screen titles
    displayMedium: 24, // Section headers
    titleLarge: 20, // Card titles
    titleMedium: 17, // List item titles
    body: 16, // Body text
    bodySmall: 14, // Secondary text
    trigger: 13, // Collapsed guidance trigger
    caption: 12, // Labels, hints
    label: 11, // Uppercase labels
  },

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 25,
};

export const shadows = {
  card: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

export const componentStyles = {
  button: {
    height: 52,
    borderRadius: borderRadius.pill,
  },
  input: {
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: 20,
  },
};
