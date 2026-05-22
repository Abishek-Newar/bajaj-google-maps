/**
 * Pulsar design system — sleek dark mode with neon blue/teal accents.
 * Single source of truth for color, spacing, typography and radii.
 */

export const colors = {
  // Backgrounds (deep carbon)
  bg: '#07090D',
  bgElevated: '#0E1218',
  surface: '#141A22',
  surfaceAlt: '#1B2330',
  border: '#222B38',
  borderStrong: '#2E3A4B',

  // Neon accents
  accent: '#16E0C8', // teal
  accentDim: '#0E8C7E',
  blue: '#2E9CFF',
  blueDim: '#1A5C99',
  glow: 'rgba(22, 224, 200, 0.35)',

  // Status
  success: '#2BE08A',
  warning: '#FFB020',
  danger: '#FF4D5E',
  idle: '#5A6B7E',

  // Text
  text: '#EAF2F8',
  textDim: '#8A9AAC',
  textFaint: '#566576',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
} as const;

export const gradients: Record<string, string[]> = {
  screen: ['#0A0E14', '#07090D'],
  accent: ['#16E0C8', '#2E9CFF'],
  card: ['#141A22', '#0E1218'],
  danger: ['#FF4D5E', '#B0263A'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const font = {
  // Use platform monospace for a "telemetry / instrument cluster" feel on data.
  mono: 'Menlo',
  sizes: {
    caption: 11,
    small: 13,
    body: 15,
    title: 18,
    h2: 22,
    h1: 28,
    display: 44,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const elevation = {
  glow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

export type ColorKey = keyof typeof colors;
