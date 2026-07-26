export const colors = {
  primary: '#5DD3B6',
  primaryDark: '#45C4A5',
  primaryMuted: 'rgba(93, 211, 182, 0.14)',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#18181B',
  textSecondary: '#71717A',
  textTertiary: '#A1A1AA',
  border: '#E4E4E7',
  error: '#F04438',
  success: '#12B76A',
  tabInactive: '#A1A1AA',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.37 },
  title1: { fontSize: 28, fontWeight: '700' as const },
  title2: { fontSize: 22, fontWeight: '700' as const },
  title3: { fontSize: 20, fontWeight: '600' as const },
  headline: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 17, fontWeight: '400' as const },
  callout: { fontSize: 16, fontWeight: '400' as const },
  subhead: { fontSize: 15, fontWeight: '400' as const },
  footnote: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
};
