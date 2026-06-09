// Premium card: dark card tinted in its own colour + a crisp SVG decorative
// motif in the top-right corner (a glowing orb, breathing rings, or waves) +
// a tag pill, title and subtitle at the bottom-left. One look across the app.

import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { radius } from '../lib/theme';

export type Motif = 'orb' | 'rings' | 'waves';

function MotifArt({ motif, color, gid }: { motif: Motif; color: string; gid: string }) {
  const glow = (
    <Defs>
      <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.4} />
        <Stop offset="34%" stopColor={color} stopOpacity={1} />
        <Stop offset="100%" stopColor={color} stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id={`${gid}_s`} cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor={color} stopOpacity={0.55} />
        <Stop offset="100%" stopColor={color} stopOpacity={0} />
      </RadialGradient>
    </Defs>
  );

  if (motif === 'orb') {
    return (
      <Svg width={230} height={230} style={{ position: 'absolute', top: -34, right: -30 }}>
        {glow}
        <Circle cx={115} cy={115} r={104} fill={`url(#${gid})`} />
      </Svg>
    );
  }
  if (motif === 'rings') {
    return (
      <Svg width={250} height={250} style={{ position: 'absolute', top: -44, right: -44 }}>
        {glow}
        <Circle cx={125} cy={125} r={120} fill={`url(#${gid}_s)`} />
        <Circle cx={125} cy={125} r={48} stroke={color} strokeWidth={2.5} fill="none" opacity={0.8} />
        <Circle cx={125} cy={125} r={74} stroke={color} strokeWidth={2} fill="none" opacity={0.5} />
        <Circle cx={125} cy={125} r={100} stroke={color} strokeWidth={1.5} fill="none" opacity={0.32} />
        <Circle cx={125} cy={125} r={16} fill={color} opacity={0.9} />
      </Svg>
    );
  }
  // waves
  return (
    <Svg width={280} height={210} style={{ position: 'absolute', top: -14, right: -34 }}>
      {glow}
      <Circle cx={170} cy={80} r={120} fill={`url(#${gid}_s)`} />
      <Path d="M0 64 Q 40 34 80 64 T 160 64 T 240 64 T 320 64" stroke={color} strokeWidth={2.5} fill="none" opacity={0.7} strokeLinecap="round" />
      <Path d="M0 100 Q 40 70 80 100 T 160 100 T 240 100 T 320 100" stroke={color} strokeWidth={2} fill="none" opacity={0.45} strokeLinecap="round" />
      <Path d="M0 136 Q 40 106 80 136 T 160 136 T 240 136 T 320 136" stroke={color} strokeWidth={1.5} fill="none" opacity={0.3} strokeLinecap="round" />
    </Svg>
  );
}

export function PremiumCard({ color, tag, title, sub, motif, gid, height = 210, onPress }: {
  color: string; tag?: string; title: string; sub?: string; motif: Motif; gid: string; height?: number; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}
      style={({ pressed }) => ({ height, borderRadius: 26, overflow: 'hidden', opacity: pressed ? 0.93 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <LinearGradient colors={[color + '30', '#12161D', '#0F131A']} locations={[0, 0.6, 1]} start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <MotifArt motif={motif} color={color} gid={gid} />
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 18, gap: 8 }}>
        {!!tag && (
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#00000055' }}>
            <Text style={{ color: '#FFFFFFCC', fontSize: 10.5, fontWeight: '800', letterSpacing: 1 }}>{tag}</Text>
          </View>
        )}
        <Text style={{ color: '#F2F6FA', fontSize: 25, fontWeight: '800', letterSpacing: -0.6, lineHeight: 29 }} numberOfLines={2}>{title}</Text>
        {!!sub && <Text style={{ color: '#9AA5B1', fontSize: 14, lineHeight: 18 }} numberOfLines={2}>{sub}</Text>}
      </View>
    </Pressable>
  );
}

export { radius };
