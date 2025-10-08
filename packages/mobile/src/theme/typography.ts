import { TextStyle } from 'react-native';

export const typography = {
  // Headers
  h1: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 36,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 28,
  },
  
  // Titles
  title: {
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 22,
  },
  
  // Body
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 20,
  },
  
  // Captions
  caption: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 16,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 16,
  },
  
  // Special
  countdown: {
    fontSize: 48,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 56,
  },
  badge: {
    fontSize: 11,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 14,
    textTransform: 'uppercase' as TextStyle['textTransform'],
    letterSpacing: 0.5,
  },
};

export type TypographyVariant = keyof typeof typography;
