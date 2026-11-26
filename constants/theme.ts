import { useColorScheme } from 'react-native';

export interface Palette {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  inputBackground: string;
  inputBorder: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  danger: string;
  dangerSoft: string;
  tabBar: string;
  /** Segment colours for the breakdown bar. */
  segments: {
    net: string;
    taxes: string;
    expenses: string;
    margin: string;
    platformFees: string;
  };
}

const light: Palette = {
  background: '#F5F5F4',
  card: '#FFFFFF',
  cardBorder: '#E7E5E4',
  text: '#1C1917',
  textMuted: '#57534E',
  textSubtle: '#78716C',
  inputBackground: '#FAFAF9',
  inputBorder: '#D6D3D1',
  primary: '#16A34A',
  primaryPressed: '#15803D',
  primarySoft: '#DCFCE7',
  onPrimary: '#FFFFFF',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  tabBar: '#FFFFFF',
  segments: {
    net: '#16A34A',
    taxes: '#F59E0B',
    expenses: '#3B82F6',
    margin: '#8B5CF6',
    platformFees: '#EF4444',
  },
};

const dark: Palette = {
  background: '#0C0A09',
  card: '#1C1917',
  cardBorder: '#292524',
  text: '#FAFAF9',
  textMuted: '#D6D3D1',
  textSubtle: '#A8A29E',
  inputBackground: '#0C0A09',
  inputBorder: '#44403C',
  primary: '#22C55E',
  primaryPressed: '#16A34A',
  primarySoft: '#14532D',
  onPrimary: '#052E16',
  danger: '#F87171',
  dangerSoft: '#450A0A',
  tabBar: '#1C1917',
  segments: {
    net: '#22C55E',
    taxes: '#FBBF24',
    expenses: '#60A5FA',
    margin: '#A78BFA',
    platformFees: '#F87171',
  },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28, hero: 44 } as const;

export function useTheme(): { colors: Palette; isDark: boolean } {
  const isDark = useColorScheme() === 'dark';
  return { colors: isDark ? dark : light, isDark };
}
