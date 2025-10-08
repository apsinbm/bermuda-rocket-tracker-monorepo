import { colors as colorPalette } from './colors';

// Export flattened dark theme colors for mobile app
export const colors = {
  // Base colors (dark theme)
  background: colorPalette.dark.background,
  surface: colorPalette.dark.card,
  surfaceHover: colorPalette.dark.cardHover,
  border: colorPalette.dark.border,
  textPrimary: colorPalette.dark.text,
  textSecondary: colorPalette.dark.textSecondary,
  textTertiary: colorPalette.dark.textTertiary,

  // Brand colors
  primary: colorPalette.primary,
  primaryDark: colorPalette.primaryDark,
  primaryLight: colorPalette.primaryLight,

  // Status colors
  success: colorPalette.success,
  successDark: colorPalette.successDark,
  successLight: colorPalette.successLight,
  warning: colorPalette.warning,
  warningDark: colorPalette.warningDark,
  warningLight: colorPalette.warningLight,
  error: colorPalette.error,
  errorDark: colorPalette.errorDark,
  errorLight: colorPalette.errorLight,
  info: colorPalette.info,

  // Visibility
  visibility: colorPalette.visibility,

  // Utility
  transparent: colorPalette.transparent,
  white: colorPalette.white,
  black: colorPalette.black,
};

// Export typography with additional body variants
export { typography } from './typography';

// Re-export the full color palette if needed
export { colors as colorPalette } from './colors';
