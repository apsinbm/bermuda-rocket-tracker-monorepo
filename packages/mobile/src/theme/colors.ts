export const colors = {
  // Dark mode (primary)
  dark: {
    background: '#0f172a',    // slate-900
    card: '#1e293b',          // slate-800
    cardHover: '#334155',     // slate-700
    border: '#475569',        // slate-600
    text: '#f1f5f9',          // slate-100
    textSecondary: '#cbd5e1', // slate-300
    textTertiary: '#94a3b8',  // slate-400
  },
  
  // Light mode
  light: {
    background: '#f8fafc',    // slate-50
    card: '#ffffff',
    cardHover: '#f1f5f9',     // slate-100
    border: '#e2e8f0',        // slate-200
    text: '#0f172a',          // slate-900
    textSecondary: '#475569', // slate-600
    textTertiary: '#64748b',  // slate-500
  },
  
  // Brand & accents
  primary: '#3b82f6',         // blue-500
  primaryDark: '#2563eb',     // blue-600
  primaryLight: '#60a5fa',    // blue-400
  
  success: '#10b981',         // emerald-500
  successDark: '#059669',     // emerald-600
  successLight: '#34d399',    // emerald-400
  
  warning: '#f59e0b',         // amber-500
  warningDark: '#d97706',     // amber-600
  warningLight: '#fbbf24',    // amber-400
  
  error: '#ef4444',           // red-500
  errorDark: '#dc2626',       // red-600
  errorLight: '#f87171',      // red-400
  
  // Visibility colors
  visibility: {
    high: '#10b981',          // emerald-500
    medium: '#f59e0b',        // amber-500
    low: '#ef4444',           // red-500
    none: '#6b7280',          // gray-500
  },
  
  // Semantic colors
  info: '#3b82f6',            // blue-500
  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',
};

export type ColorScheme = 'light' | 'dark';

export const getThemeColors = (scheme: ColorScheme = 'dark') => {
  return scheme === 'dark' ? colors.dark : colors.light;
};
