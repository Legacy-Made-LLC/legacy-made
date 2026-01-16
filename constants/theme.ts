/**
 * Legacy Made Design System
 * "Calm, human, respectful, clear, unhurried"
 */

export const colors = {
  // Backgrounds
  background: '#FAF9F7', // Warm off-white
  surface: '#FFFFFF', // Pure white for cards
  surfaceSecondary: '#F5F4F2', // Subtle gray for secondary surfaces

  // Text
  textPrimary: '#1A1A1A', // Near-black for headings
  textSecondary: '#6B6B6B', // Warm gray for body text
  textTertiary: '#9B9B9B', // Light gray for placeholders/hints

  // Accents
  primary: '#1C2541', // Deep navy for primary actions
  primaryPressed: '#0F1629', // Darker navy for pressed state

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
    serif: 'DMSerifDisplay_400Regular',
  },

  sizes: {
    displayLarge: 32, // Screen titles
    displayMedium: 24, // Section headers
    titleLarge: 20, // Card titles
    titleMedium: 17, // List item titles
    body: 16, // Body text
    bodySmall: 14, // Secondary text
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
