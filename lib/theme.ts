import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';

// ─── 5 design styles ────────────────────────────────────────────────────────
// Each style differs not only in colour but in FORM: corner radius scale,
// border weight and whether cards are flat or elevated. Picked in Settings.

export type Palette = {
  bg: string; bgElev: string; card: string;
  text: string; textDim: string; border: string;
  accent: string; accentSoft: string;
  warn: string; danger: string; info: string;
};

export type Shape = { sm: number; md: number; lg: number; xl: number };

export type ThemeId = 'clean' | 'soft' | 'graphite' | 'aurora' | 'paper';

export type ThemeStyle = {
  id: ThemeId;
  nameRu: string; nameEn: string;
  descRu: string; descEn: string;
  light: Palette; dark: Palette;
  shape: Shape;
  borderW: number;     // card border width
  cardFlat: boolean;   // true = no shadow / minimal elevation
};

export const THEMES: Record<ThemeId, ThemeStyle> = {
  // 1. Clean — Apple HIG default: light grey, white cards, soft 1px borders.
  clean: {
    id: 'clean',
    nameRu: 'Чистый', nameEn: 'Clean',
    descRu: 'Классика Apple: светло, аккуратно, тонкие рамки',
    descEn: 'Apple classic: light, neat, thin borders',
    shape: { sm: 10, md: 14, lg: 20, xl: 26 }, borderW: 1, cardFlat: false,
    light: {
      bg: '#F2F2F7', bgElev: '#FFFFFF', card: 'rgba(255,255,255,0.78)',
      text: '#0B0F14', textDim: '#6B7280', border: 'rgba(0,0,0,0.08)',
      accent: '#34C759', accentSoft: 'rgba(52,199,89,0.14)',
      warn: '#FF9500', danger: '#FF3B30', info: '#0A84FF',
    },
    dark: {
      bg: '#0B0F14', bgElev: '#11161D', card: 'rgba(28,32,40,0.72)',
      text: '#F5F5F7', textDim: '#9AA3AF', border: 'rgba(255,255,255,0.08)',
      accent: '#30D158', accentSoft: 'rgba(48,209,88,0.18)',
      warn: '#FF9F0A', danger: '#FF453A', info: '#0A84FF',
    },
  },

  // 2. Soft — pillowy: very rounded, borderless, gentle teal-green.
  soft: {
    id: 'soft',
    nameRu: 'Мягкий', nameEn: 'Soft',
    descRu: 'Очень округлые карточки, без рамок, спокойный',
    descEn: 'Very rounded, borderless, calm',
    shape: { sm: 16, md: 22, lg: 28, xl: 34 }, borderW: 0, cardFlat: false,
    light: {
      bg: '#ECEFF3', bgElev: '#FFFFFF', card: '#FFFFFF',
      text: '#1A2230', textDim: '#7C8696', border: 'rgba(0,0,0,0.04)',
      accent: '#2BB3A3', accentSoft: 'rgba(43,179,163,0.14)',
      warn: '#F0A330', danger: '#EF5350', info: '#4C8DFF',
    },
    dark: {
      bg: '#13171C', bgElev: '#1E242C', card: '#1E242C',
      text: '#EDEFF2', textDim: '#99A1AD', border: 'rgba(255,255,255,0.05)',
      accent: '#3FD0BE', accentSoft: 'rgba(63,208,190,0.18)',
      warn: '#F2B24A', danger: '#F2685F', info: '#5C97FF',
    },
  },

  // 3. Graphite — sharp & editorial: tiny radius, hairline borders, flat, mono.
  graphite: {
    id: 'graphite',
    nameRu: 'Графит', nameEn: 'Graphite',
    descRu: 'Резкие углы, чёткие линии, монохром с одним акцентом',
    descEn: 'Sharp corners, crisp lines, mono with one accent',
    shape: { sm: 4, md: 7, lg: 10, xl: 12 }, borderW: 1, cardFlat: true,
    light: {
      bg: '#FFFFFF', bgElev: '#FAFAFA', card: '#FAFAFA',
      text: '#0A0A0A', textDim: '#767676', border: 'rgba(0,0,0,0.16)',
      accent: '#16A34A', accentSoft: 'rgba(22,163,74,0.12)',
      warn: '#B45309', danger: '#DC2626', info: '#1D4ED8',
    },
    dark: {
      bg: '#0A0A0A', bgElev: '#151515', card: '#151515',
      text: '#F5F5F5', textDim: '#8A8A8A', border: 'rgba(255,255,255,0.16)',
      accent: '#22C55E', accentSoft: 'rgba(34,197,94,0.16)',
      warn: '#D98A2B', danger: '#EF4444', info: '#3B82F6',
    },
  },

  // 4. Aurora — vibrant: violet accent, glassy translucent cards, glow.
  aurora: {
    id: 'aurora',
    nameRu: 'Аврора', nameEn: 'Aurora',
    descRu: 'Яркий, насыщенный, стеклянные карточки и сияние',
    descEn: 'Vivid, saturated, glassy cards and glow',
    shape: { sm: 12, md: 18, lg: 24, xl: 30 }, borderW: 1, cardFlat: false,
    light: {
      bg: '#F4F2FB', bgElev: '#FFFFFF', card: 'rgba(255,255,255,0.70)',
      text: '#1A1633', textDim: '#6F6A86', border: 'rgba(124,92,255,0.14)',
      accent: '#7C5CFF', accentSoft: 'rgba(124,92,255,0.14)',
      warn: '#FF8A3D', danger: '#FF4D6D', info: '#2DA8FF',
    },
    dark: {
      bg: '#0E0B1A', bgElev: '#181232', card: 'rgba(34,24,68,0.72)',
      text: '#F1EEFF', textDim: '#A99FC9', border: 'rgba(160,130,255,0.16)',
      accent: '#9D7BFF', accentSoft: 'rgba(157,123,255,0.20)',
      warn: '#FF9F5A', danger: '#FF6080', info: '#4FB6FF',
    },
  },

  // 5. Paper — warm & cozy: cream tones, flat tinted cards, olive-green accent.
  paper: {
    id: 'paper',
    nameRu: 'Бумага', nameEn: 'Paper',
    descRu: 'Тёплые бумажные тона, плоские карточки, уют',
    descEn: 'Warm paper tones, flat cards, cozy',
    shape: { sm: 8, md: 14, lg: 18, xl: 22 }, borderW: 1, cardFlat: true,
    light: {
      bg: '#F2EBDC', bgElev: '#FBF6EC', card: '#FBF6EC',
      text: '#2B2419', textDim: '#8A7F6B', border: 'rgba(80,60,30,0.14)',
      accent: '#5E8C4F', accentSoft: 'rgba(94,140,79,0.16)',
      warn: '#D98E2B', danger: '#C4452F', info: '#4A7FA5',
    },
    dark: {
      bg: '#1A1712', bgElev: '#232019', card: '#232019',
      text: '#EDE6D6', textDim: '#A39A86', border: 'rgba(255,240,210,0.10)',
      accent: '#84B36F', accentSoft: 'rgba(132,179,111,0.18)',
      warn: '#E0A045', danger: '#D9614B', info: '#6FA0C4',
    },
  },
};

export const THEME_LIST: ThemeStyle[] = Object.values(THEMES);

// Mutable shape tokens — themes mutate these in place so every component that
// does `import { radius }` picks up the new corner scale on the next render.
export const radius = { sm: 10, md: 14, lg: 20, xl: 26 };
export const spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 32 };

let currentId: ThemeId = 'clean';
const listeners = new Set<() => void>();

export function getThemeId(): ThemeId { return currentId; }

export function setThemeId(id: ThemeId) {
  const ts = THEMES[id];
  if (!ts) return;
  currentId = id;
  radius.sm = ts.shape.sm; radius.md = ts.shape.md;
  radius.lg = ts.shape.lg; radius.xl = ts.shape.xl;
  listeners.forEach((l) => l());
}

// Theme object returned by the hook: every colour key plus form tokens.
export type Theme = Palette & {
  borderW: number;
  cardFlat: boolean;
  radius: Shape;
  id: ThemeId;
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((x) => x + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  const ts = THEMES[currentId];
  const pal = scheme === 'dark' ? ts.dark : ts.light;
  return { ...pal, borderW: ts.borderW, cardFlat: ts.cardFlat, radius: ts.shape, id: currentId };
}
