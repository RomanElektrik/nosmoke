import type { ComponentProps } from 'react';
import Svg, { Path, Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = { size?: number; color?: string; bg?: string };

// Bridge to the bundled MaterialCommunityIcons set — thousands of distinct
// glyphs, so different actions get genuinely different icons.
const mci = (name: ComponentProps<typeof MaterialCommunityIcons>['name']) =>
  ({ size = 24, color = '#9AA3AF' }: Props) => <MaterialCommunityIcons name={name} size={size} color={color} />;

const wrap = (children: any, size = 24) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{children}</Svg>
);

// Apple-like line icons. 1.7px stroke, rounded caps.
const stroke = (color: string, w = 1.7) => ({ stroke: color, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' });

export const Icon = {
  // Sealed envelope with a heart on the flap — «Письмо себе».
  letter: ({ size = 24, color = '#FFD60A' }: Props) => wrap(
    <G {...stroke(color)}>
      <Rect x="3" y="6" width="18" height="13" rx="2.5" />
      <Path d="M3.6 7.2 12 13l8.4-5.8" />
      <Path d="M12 10.6s-1.9-1.3-1.9-2.6a1.1 1.1 0 0 1 1.9-.74 1.1 1.1 0 0 1 1.9.74c0 1.3-1.9 2.6-1.9 2.6Z" fill={color} strokeWidth={0.9} />
    </G>, size),

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
  chevronDown: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <Path d="m6 9 6 6 6-6" {...stroke(color, 2)} />, size),
  chevronUp: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <Path d="m6 15 6-6 6 6" {...stroke(color, 2)} />, size),
  mirror: ({ size = 24, color = '#FF453A' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M12 3a6 6 0 0 1 0 12 6 6 0 0 1 0-12Z" />
      <Path d="M12 15v6M9 21h6" />
    </G>, size),

  // ── Custom SVG glyphs (replacing MaterialCommunityIcons). One unified style:
  // 1.7px stroke, rounded caps/joins, 24×24 viewBox. Each glyph is original. ──

  // Phone handset with talk-bubble dot — for the AI coach.
  phone: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M5 4h4l1.5 4-2 1.5a11 11 0 0 0 6 6L16 13.5l4 1.5v4a2 2 0 0 1-2 2A14 14 0 0 1 3 6a2 2 0 0 1 2-2Z" />
      <Path d="M16 4a4 4 0 0 1 4 4" />
    </G>, size),

  // Two sine waves — urge surfing.
  waves: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M3 9c1.5 0 1.5 3 3 3s1.5-3 3-3 1.5 3 3 3 1.5-3 3-3 1.5 3 3 3 1.5-3 3-3" />
      <Path d="M3 16c1.5 0 1.5 3 3 3s1.5-3 3-3 1.5 3 3 3 1.5-3 3-3 1.5 3 3 3 1.5-3 3-3" />
    </G>, size),

  // Two lungs with central airway.
  lungs: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color, 1.7)}>
      {/* trachea + two bronchi (the Y that makes it read as lungs, not eggs) */}
      <Path d="M12 4v6" />
      <Path d="M12 10c0-1.4-1-2.4-2.5-2.5M12 10c0-1.4 1-2.4 2.5-2.5" />
      {/* left & right lobes — inner edge near the stem, bulge outward+down */}
      <Path d="M9.5 7.5C7 9 5.5 12.5 6 16.5c.2 1.8 1.8 2.6 3.1 1.7.9-.6 1.4-1.8 1.4-3.2V9.5C10.5 8.4 10 7.6 9.5 7.5Z" />
      <Path d="M14.5 7.5C17 9 18.5 12.5 18 16.5c-.2 1.8-1.8 2.6-3.1 1.7-.9-.6-1.4-1.8-1.4-3.2V9.5C13.5 8.4 14 7.6 14.5 7.5Z" />
    </G>, size),

  // Headphones — audio / listen tiles.
  headphones: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color, 1.8)}>
      <Path d="M5 13v-1a7 7 0 0 1 14 0v1" />
      <Path d="M4 14.5A1.5 1.5 0 0 1 5.5 13H7v6H5.5A1.5 1.5 0 0 1 4 17.5Z" />
      <Path d="M20 14.5A1.5 1.5 0 0 0 18.5 13H17v6h1.5A1.5 1.5 0 0 0 20 17.5Z" />
    </G>, size),

  // Box breathing — square with a dot on each edge (the 4 equal phases).
  boxBreath: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color, 1.8)}>
      <Path d="M6.5 5h11a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5v-11A1.5 1.5 0 0 1 6.5 5Z" />
      <Circle cx="12" cy="5" r="1.4" fill={color} stroke="none" />
      <Circle cx="19" cy="12" r="1.4" fill={color} stroke="none" />
      <Circle cx="12" cy="19" r="1.4" fill={color} stroke="none" />
      <Circle cx="5" cy="12" r="1.4" fill={color} stroke="none" />
    </G>, size),

  // Swap arrows — replacement ritual.
  swap: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color, 1.8)}>
      <Path d="M4 8h13l-3-3" />
      <Path d="M20 16H7l3 3" />
    </G>, size),

  // Capsule split in two colors.
  pill: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M9 3a4 4 0 0 1 4 4v10a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4Z" transform="rotate(-30 9 12)" />
      <Path d="M3 9.5 14.5 21" />
    </G>, size),

  // Running figure — physical activity.
  run: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Circle cx="15" cy="4.5" r="1.6" />
      <Path d="M9 21l3-6 3 2v4" />
      <Path d="M6 13l4-2 3 1 4-4-3-2-3 2-2 3" />
    </G>, size),

  // Water cup with droplet.
  water: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M6 8h12l-1.5 11a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2L6 8Z" />
      <Path d="M12 3c-1 1.5-2 2.5-2 4a2 2 0 0 0 4 0c0-1.5-1-2.5-2-4Z" />
    </G>, size),

  // Lotus / meditation — head + folded body, arms resting on knees.
  meditate: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Circle cx="12" cy="6" r="2.5" />
      <Path d="M6 18c0-3 2.5-5 6-5s6 2 6 5H6Z" />
      <Path d="M7 15c1.5 1 3 1.5 5 1.5s3.5-.5 5-1.5" />
    </G>, size),

  // Sprout — a curved stem with two leaves.
  sprout: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M12 21v-9" />
      <Path d="M12 12c-4 0-6-3-6-7 4 0 6 3 6 7Z" />
      <Path d="M12 12c4 0 6-3 6-7-4 0-6 3-6 7Z" />
    </G>, size),

  // Bell with ringing lines on each side.
  bell: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16Z" />
      <Path d="M10 20a2 2 0 0 0 4 0" />
      <Path d="M3 6l2 2M21 6l-2 2" />
    </G>, size),

  // Line chart with two data points — for symptoms / analytics.
  chart: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M3 21h18" />
      <Path d="M4 17l5-6 4 3 6-8" />
      <Circle cx="9" cy="11" r="1.2" fill={color} stroke="none" />
      <Circle cx="13" cy="14" r="1.2" fill={color} stroke="none" />
    </G>, size),

  // Gauge / dependence meter — semicircle with needle.
  gauge: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M4 16a8 8 0 0 1 16 0" />
      <Path d="M12 16l5-4" />
      <Circle cx="12" cy="16" r="1.4" fill={color} stroke="none" />
    </G>, size),

  // Two hands meeting — support / handshake.
  handshake: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M3 13l4-2 5 4 3-1 6-3" />
      <Path d="M3 10l3-2 4 1" />
      <Path d="M21 11l-3-3-3 1" />
      <Path d="M12 15l-2 2" />
    </G>, size),

  // Cigarette with a diagonal "no" line — no smoking.
  noSmoke: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M3 11h14v3H3z" />
      <Path d="M17 11v3M20 11v3" />
      <Path d="M5 8c1-1 1-2 0-3" />
      <Path d="M3 21 21 3" {...stroke(color, 2.2)} />
    </G>, size),

  // Coffee cup with steam.
  coffee: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M5 9h12v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" />
      <Path d="M17 11h2a2 2 0 0 1 0 4h-2" />
      <Path d="M8 3c0 1.5 2 1.5 2 3M12 3c0 1.5 2 1.5 2 3" />
    </G>, size),

  // Wine glass.
  wineGlass: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M7 3h10c0 5-2 9-5 9s-5-4-5-9Z" />
      <Path d="M12 12v7" />
      <Path d="M8 21h8" />
    </G>, size),

  // Side-view car.
  car: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M4 14l2-5a2 2 0 0 1 2-1h8a2 2 0 0 1 2 1l2 5v3H4v-3Z" />
      <Path d="M3 14h18" />
      <Circle cx="8" cy="17.5" r="1.5" />
      <Circle cx="16" cy="17.5" r="1.5" />
    </G>, size),

  // Group of three figures.
  group: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Circle cx="12" cy="8" r="2.5" />
      <Path d="M7 19c0-3 2-5 5-5s5 2 5 5" />
      <Circle cx="5" cy="9.5" r="2" />
      <Path d="M2 18c0-2 1.5-3.5 3.5-3.5" />
      <Circle cx="19" cy="9.5" r="2" />
      <Path d="M22 18c0-2-1.5-3.5-3.5-3.5" />
    </G>, size),

  // Crescent moon with «Zzz» — sleep.
  sleepy: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M20 14a8 8 0 1 1-9-10 6.5 6.5 0 0 0 9 10Z" />
      <Path d="M15 3.5h3l-3 3.5h3" />
      <Path d="M17.5 9h2.2l-2.2 2.8h2.2" />
    </G>, size),

  // Trophy with base.
  trophy: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <Path d="M7 6H4v2a3 3 0 0 0 3 3" />
      <Path d="M17 6h3v2a3 3 0 0 1-3 3" />
      <Path d="M9 14l-1 4h8l-1-4" />
      <Path d="M7 21h10" />
    </G>, size),

  // Clipboard with lines.
  list: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M9 4h6v3H9z" />
      <Path d="M6 5h2v3h8V5h2v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5Z" />
      <Path d="M9 12h6M9 16h4" />
    </G>, size),

  // Compass — classic dual diamond needle.
  compass: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 6l2.2 5.8L12 18l-2.2-6.2Z" fill={color + '30'} />
      <Circle cx="12" cy="12" r="1" fill={color} stroke="none" />
    </G>, size),

  // Skip-previous: bar + triangle.
  skipBack: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color, 1.8)}>
      <Path d="M6 5v14M19 5 8 12l11 7V5Z" />
    </G>, size),

  // Skip-next: triangle + bar.
  skipFwd: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color, 1.8)}>
      <Path d="M18 5v14M5 5l11 7-11 7V5Z" />
    </G>, size),

  // Speedometer (different gauge: full needle inside).
  speedo: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M4 17a8 8 0 1 1 16 0" />
      <Path d="M12 17 9 9" />
      <Circle cx="12" cy="17" r="1.2" fill={color} stroke="none" />
      <Path d="M6.5 13.5l1 1M17.5 13.5l-1 1" />
    </G>, size),

  // Rewind 15 seconds — counter-clockwise arc + clean «15».
  back15: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G>
      <G {...stroke(color, 1.7)}>
        <Path d="M5.5 8.5A8 8 0 1 0 9 4.2" />
        <Path d="M4 3.5v5h5" />
      </G>
      <SvgText x="12" y="16.3" fontSize="8.5" fontWeight="800" fill={color} textAnchor="middle">15</SvgText>
    </G>, size),

  // Forward 15 seconds — clockwise arc + clean «15».
  fwd15: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G>
      <G {...stroke(color, 1.7)}>
        <Path d="M18.5 8.5A8 8 0 1 1 15 4.2" />
        <Path d="M20 3.5v5h-5" />
      </G>
      <SvgText x="12" y="16.3" fontSize="8.5" fontWeight="800" fill={color} textAnchor="middle">15</SvgText>
    </G>, size),

  // Real ✕ (two diagonals).
  close: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <Path d="M6 6 18 18M18 6 6 18" {...stroke(color, 2)} />, size),

  // ── Unique award / health glyphs (so nothing repeats per screen) ──

  // Calendar with «7» — one solid week.
  cal7: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G>
      <Path d="M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" {...stroke(color)} />
      <Path d="M4 10h16M8 4v3M16 4v3" {...stroke(color)} />
      <SvgText x="12" y="18" fontSize="8" fontWeight="700" fill={color} textAnchor="middle">7</SvgText>
    </G>, size),

  // Dumbbell — two weeks of strength.
  muscle: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color, 1.9)}>
      <Path d="M6 9v6M4 7.5v9M18 9v6M20 7.5v9M6 12h12" />
    </G>, size),

  // «100» badge — one hundred days. Smaller digits so they don't crowd the rim.
  hundred: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G>
      <Circle cx="12" cy="12" r="9.2" {...stroke(color, 1.7)} />
      <SvgText x="12" y="14.4" fontSize="7" fontWeight="800" fill={color} stroke="none" textAnchor="middle">100</SvgText>
    </G>, size),

  // Coin with a drawn ruble «₽» (paths, not font — centers reliably).
  coin: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color, 1.7)}>
      <Circle cx="12" cy="12" r="8.5" />
      <Path d="M10.5 8.5h2.2a2 2 0 0 1 0 4h-2.2V8.5M10.5 8.5v7M10.5 14h3" />
    </G>, size),

  // Gift box with a clean two-loop bow.
  gift: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M4 10h16v3H4z" />
      <Path d="M5 13h14v7H5z" />
      <Path d="M12 10v10" />
      <Path d="M12 10C12 7.5 9.5 6.5 9.5 8.3 9.5 10 12 10 12 10Z" />
      <Path d="M12 10C12 7.5 14.5 6.5 14.5 8.3 14.5 10 12 10 12 10Z" />
    </G>, size),

  // Wallet with a clear flap + snap button.
  wallet: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M4 8h15a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H4Z" />
      <Path d="M4 8V6a1 1 0 0 1 1-1h12v3" />
      <Circle cx="16.5" cy="13.5" r="1.4" fill={color} stroke="none" />
    </G>, size),

  // Heart with an ECG pulse — pulse normalising.
  heartPulse: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
      <Path d="M5 11.5h2.5L9 9l2 5 1.5-2.5H19" />
    </G>, size),

  // O₂ molecule with a double bond (O=O) — oxygen returns.
  o2: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Circle cx="8" cy="12" r="4.5" />
      <Circle cx="17.5" cy="12" r="3" />
      <Path d="M12.5 11h2M12.5 13h2" />
    </G>, size),

  // Open mouth + clear tongue — taste returns.
  taste: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color, 1.8)}>
      <Path d="M6 8a6 4 0 0 1 12 0" />
      <Path d="M10 10c0 3 .8 5 2 5s2-2 2-5" />
      <Path d="M12 11v3" />
      <Path d="M18.5 5.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4L16.5 7.5l1.4-.6Z" fill={color} stroke="none" />
    </G>, size),

  // Single cigarette.
  cig: ({ size = 24, color = '#9AA3AF' }: Props) => wrap(
    <G {...stroke(color)}>
      <Path d="M3 13h15v3H3z" />
      <Path d="M14.5 13v3" />
      <Path d="M18 13c0-1.5 2-1.5 2-3M6 9c1-1 1-2.2 0-3" />
    </G>, size),
};

export type IconKey = keyof typeof Icon;
