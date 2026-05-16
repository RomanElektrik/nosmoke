import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../lib/theme';

type Props = { size?: number; progress: number; label: string; sub?: string };

export function StreakRing({ size = 220, progress, label, sub }: Props) {
  const t = useTheme();
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.max(0, Math.min(1, progress));
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={t.accent} />
            <Stop offset="1" stopColor={t.info} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="url(#g)" strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill as any}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: t.text, fontSize: 36, fontWeight: '700', letterSpacing: -1 }}>{label}</Text>
          {sub ? <Text style={{ color: t.textDim, marginTop: 4 }}>{sub}</Text> : null}
        </View>
      </View>
    </View>
  );
}
