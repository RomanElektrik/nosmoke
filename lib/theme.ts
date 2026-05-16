import { useColorScheme } from 'react-native';

export const palette = {
  light: {
    bg: '#F2F2F7',
    bgElev: '#FFFFFF',
    card: 'rgba(255,255,255,0.78)',
    text: '#0B0F14',
    textDim: '#6B7280',
    border: 'rgba(0,0,0,0.08)',
    accent: '#34C759',
    accentSoft: 'rgba(52,199,89,0.14)',
    warn: '#FF9500',
    danger: '#FF3B30',
    info: '#0A84FF',
  },
  dark: {
    bg: '#0B0F14',
    bgElev: '#11161D',
    card: 'rgba(28,32,40,0.72)',
    text: '#F5F5F7',
    textDim: '#9AA3AF',
    border: 'rgba(255,255,255,0.08)',
    accent: '#30D158',
    accentSoft: 'rgba(48,209,88,0.18)',
    warn: '#FF9F0A',
    danger: '#FF453A',
    info: '#0A84FF',
  },
};

export type Theme = typeof palette.light;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? palette.dark : palette.light;
}

export const radius = { sm: 10, md: 14, lg: 20, xl: 26 };
export const spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 32 };
