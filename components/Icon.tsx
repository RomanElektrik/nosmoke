import Svg, { Path, Circle, G, Line, Rect } from 'react-native-svg';

type Props = { size?: number; color?: string; bg?: string };

const wrap = (children: any, size = 24) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{children}</Svg>
);

// Apple-like line icons. 1.7px stroke, rounded caps.
const stroke = (color: string, w = 1.7) => ({ stroke: color, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' });

export const Icon = {
  heart: ({ size = 24, color = '#FF453A' }: Props) => wrap(
    <Path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" {...stroke(color)} />, size),

  lung: ({ size = 24, color = '#5AC8FA' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M12 4v9" />
      <Path d="M12 13c-1.5-3-4-3.5-5.5-2.5C5 11.5 5 14 5.5 17c.4 2 1.7 3 3 3 1.6 0 3-1.5 3-3.5V13Z" />
      <Path d="M12 13c1.5-3 4-3.5 5.5-2.5 1.5 1 1.5 3.5 1 6.5-.4 2-1.7 3-3 3-1.6 0-3-1.5-3-3.5V13Z" />
    </G>, size),

  brain: ({ size = 24, color = '#BF5AF2' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M9 6.5A2.5 2.5 0 0 1 12 4a2.5 2.5 0 0 1 3 2.5" />
      <Path d="M9 6.5C7.3 6.7 6 8 6 9.7c0 .9.4 1.7 1 2.3-.6.5-1 1.4-1 2.3 0 1.7 1.3 3 3 3.2" />
      <Path d="M15 6.5c1.7.2 3 1.5 3 3.2 0 .9-.4 1.7-1 2.3.6.5 1 1.4 1 2.3 0 1.7-1.3 3-3 3.2" />
      <Path d="M9 17.5A2.5 2.5 0 0 0 12 20a2.5 2.5 0 0 0 3-2.5" />
      <Path d="M12 4v16" />
    </G>, size),

  drop: ({ size = 24, color = '#FF9F0A' }: Props) => wrap(
    <Path d="M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11Z" {...stroke(color)} />, size),

  wind: ({ size = 24, color = '#5AC8FA' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5" />
      <Path d="M3 12h15a2.5 2.5 0 1 1-2.5 2.5" />
      <Path d="M3 16h9" />
    </G>, size),

  bed: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M3 18v-6h18v6" />
      <Path d="M3 18v2M21 18v2" />
      <Path d="M7 12V9a2 2 0 0 1 2-2h4" />
      <Circle cx="7" cy="11" r="1" fill={color} />
    </G>, size),

  shield: ({ size = 24, color = '#30D158' }: Props) => wrap(
    <Path d="M12 3 5 6v6c0 4.4 3 7.5 7 9 4-1.5 7-4.6 7-9V6l-7-3Z" {...stroke(color)} />, size),

  ribbon: ({ size = 24, color = '#FF9F0A' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M9 4l3 6 3-6" />
      <Path d="M12 10c-2 2-4 5-4 7a4 4 0 0 0 8 0c0-2-2-5-4-7Z" />
    </G>, size),

  sparkle: ({ size = 24, color = '#30D158' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M12 4v16M4 12h16" />
      <Path d="M7 7l10 10M17 7L7 17" />
    </G>, size),

  fire: ({ size = 24, color = '#FF9500' }: Props) => wrap(
    <Path d="M12 3c1 4 5 5 5 9.5a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-2-1-5 1-8.5Z" {...stroke(color)} />, size),

  flask: ({ size = 24, color = '#0A84FF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M9 3h6M10 3v6L5 18a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" />
      <Path d="M7.5 14h9" />
    </G>, size),

  brush: ({ size = 24, color = '#FF9F0A' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M14 5l5 5-9 9-5 1 1-5 8-10Z" />
      <Path d="M13 6l5 5" />
    </G>, size),

  // Tabs
  home: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <Path d="M4 11.5 12 4l8 7.5V20H4v-8.5Z" {...stroke(color)} />, size),
  pulse: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M3 12h4l2-5 4 10 2-5h6" />
    </G>, size),
  toolbox: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Rect x="3" y="8" width="18" height="11" rx="2" />
      <Path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <Path d="M3 13h18" />
    </G>, size),
  chat: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <Path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" {...stroke(color)} />, size),
  user: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" />
    </G>, size),

  // Misc
  cross: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M12 3v18" />
      <Path d="M5 8h14" />
    </G>, size),
  feather: ({ size = 24, color = '#5AC8FA' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M20 4c-6 0-12 5-13 12l-1 4 4-1c7-1 12-7 12-13" />
      <Path d="M16 8 6 18" />
    </G>, size),
  book: ({ size = 24, color = '#BF5AF2' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4Z" />
      <Path d="M5 20a3 3 0 0 1 3-3h10" />
    </G>, size),
  flame: ({ size = 24, color = '#FF9500' }: Props) => wrap(
    <Path d="M12 3c0 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 3-5 0 2 1 2 2 2-1-2-1-4 0-7Z" {...stroke(color)} />, size),

  // Levels & UI custom glyphs
  seedling: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M12 21v-7" />
      <Path d="M12 14c0-3-2-5-5-5 0 3 2 5 5 5Z" />
      <Path d="M12 14c0-3 2-5 5-5 0 3-2 5-5 5Z" />
    </G>, size),
  wave2: ({ size = 24, color = '#5AC8FA' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M3 13c2 0 2-3 4.5-3S10 13 12 13s2.5-3 4.5-3S19 13 21 13" />
      <Path d="M3 18c2 0 2-3 4.5-3S10 18 12 18s2.5-3 4.5-3S19 18 21 18" />
    </G>, size),
  drop2: ({ size = 24, color = '#0A84FF' }: Props) => wrap(
    <Path d="M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12Z" {...stroke(color, 1.6)} />, size),
  bolt: ({ size = 24, color = '#FF9F0A' }: Props) => wrap(
    <Path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" {...stroke(color)} />, size),
  leaf: ({ size = 24, color = '#30D158' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M5 19c0-9 6-14 15-14 0 9-6 14-15 14Z" />
      <Path d="M5 19 14 10" />
    </G>, size),
  tree: ({ size = 24, color = '#34C759' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M12 3 6 11h3l-3 5h4l-2 4h8l-2-4h4l-3-5h3L12 3Z" />
      <Path d="M12 20v2" />
    </G>, size),
  gem: ({ size = 24, color = '#BF5AF2' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M6 4h12l3 5-9 12L3 9l3-5Z" />
      <Path d="M3 9h18" />
      <Path d="M9 4 6 9l6 12 6-12-3-5" />
    </G>, size),
  star: ({ size = 24, color = '#FF2D55' }: Props) => wrap(
    <Path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.2L12 17l-5.5 3 1-6.2-4.5-4.4 6.3-.9L12 3Z" {...stroke(color)} />, size),
  crown: ({ size = 24, color = '#FFD60A' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M3 8l4 7 5-9 5 9 4-7v11H3V8Z" />
      <Path d="M3 19h18" />
    </G>, size),
  dove: ({ size = 24, color = '#FFD60A' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M3 14c3-7 11-9 18-7-2 8-9 12-15 11" />
      <Path d="M9 14c2 0 4-1 5-3" />
    </G>, size),
  target: ({ size = 24, color = '#30D158' }: Props) => wrap(
    <G {...stroke(color)}>
      <Circle cx="12" cy="12" r="9" />
      <Circle cx="12" cy="12" r="5" />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
    </G>, size),
  confetti: ({ size = 24, color = '#FF9500' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="m4 20 6-12 4 8-10 4Z" />
      <Path d="M14 4l2 2M19 7l1 2M16 14l3-1M9 4l1 3" />
    </G>, size),
  check: ({ size = 24, color = '#30D158' }: Props) => wrap(
    <Path d="M5 12.5 10 17 19 7" {...stroke(color, 2.4)} />, size),
  hand: ({ size = 24, color = '#5AC8FA' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M9 11V5a1.5 1.5 0 1 1 3 0v5" />
      <Path d="M12 10V4a1.5 1.5 0 1 1 3 0v6" />
      <Path d="M15 10V6a1.5 1.5 0 1 1 3 0v8" />
      <Path d="M9 11V8a1.5 1.5 0 0 0-3 0v7c0 4 3 6 6 6s6-2 6-6" />
    </G>, size),
  shieldStar: ({ size = 24, color = '#34C759' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" />
      <Path d="m12 9 1.4 2.7 3 .4-2.2 2.1.5 3-2.7-1.4-2.7 1.4.5-3-2.2-2.1 3-.4L12 9Z" />
    </G>, size),
  spark: ({ size = 24, color = '#30D158' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M12 4v6M12 14v6M4 12h6M14 12h6" />
      <Path d="m6 6 3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />
    </G>, size),
  play: ({ size = 24, color = '#0A84FF' }: Props) => wrap(
    <Path d="M7 5v14l12-7L7 5Z" fill={color} stroke="none" />, size),
  arrowRight: ({ size = 24, color = '#0A84FF' }: Props) => wrap(
    <G {...stroke(color, 2)}>
      <Path d="M5 12h14" />
      <Path d="m13 6 6 6-6 6" />
    </G>, size),
  mirror: ({ size = 24, color = '#FF453A' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M12 3a6 6 0 0 1 0 12 6 6 0 0 1 0-12Z" />
      <Path d="M12 15v6M9 21h6" />
    </G>, size),
};

export type IconKey = keyof typeof Icon;
