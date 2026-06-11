// Celebration overlay shown the moment an achievement unlocks.
// Particles burst out from behind the badge (instead of the old static squares),
// the badge glows with an SVG radial halo, text cascades in.
import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay,
  FadeInDown, Easing, cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { Icon } from '../components/Icon';
import { getAchievement } from '../lib/achievements';

const CONFETTI = ['#FF453A', '#FF9F0A', '#30D158', '#0A84FF', '#BF5AF2', '#FFD60A', '#5AC8FA', '#FF2D78', '#30D158', '#FFD60A'];

// One particle flying out from the badge centre, fading as it goes.
function Particle({ color, angle, dist, size, delay }: {
  color: string; angle: number; dist: number; size: number; delay: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = 0;
    p.value = withDelay(delay, withTiming(1, { duration: 820, easing: Easing.out(Easing.cubic) }));
    return () => cancelAnimation(p);
  }, []);
  const st = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [
      { translateX: Math.cos(angle) * dist * p.value },
      { translateY: Math.sin(angle) * dist * p.value },
      { scale: 1 - p.value * 0.4 },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{
      position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color,
    }, st]} />
  );
}

export function AchievementUnlock({ achId, onClose }: { achId: string; onClose: () => void }) {
  const t = useTheme();
  const ru = currentLang() === 'ru';
  const a = getAchievement(achId);

  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 220 });
    scale.value = 0.3;
    scale.value = withDelay(80, withSpring(1, { damping: 11, stiffness: 130 }));
    return () => { cancelAnimation(opacity); cancelAnimation(scale); };
  }, [achId]);

  const aBadge = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const aBg = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!a) return null;
  const I = Icon[a.icon];

  return (
    <Animated.View style={[{
      position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
      backgroundColor: t.bg + 'F5', alignItems: 'center', justifyContent: 'center', padding: 28,
    }, aBg]}>

      {/* Badge with halo + particle burst behind it */}
      <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={220} height={220} style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id="ach_halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={a.color} stopOpacity={0.5} />
              <Stop offset="70%" stopColor={a.color} stopOpacity={0.12} />
              <Stop offset="100%" stopColor={a.color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={110} cy={110} r={105} fill="url(#ach_halo)" />
        </Svg>
        {CONFETTI.map((c, i) => (
          <Particle key={`${achId}_${i}`} color={c}
            angle={(i / CONFETTI.length) * Math.PI * 2 + 0.4}
            dist={92 + (i % 3) * 22}
            size={7 + (i % 3) * 3}
            delay={120 + i * 28} />
        ))}
        <Animated.View style={[{
          width: 132, height: 132, borderRadius: 40,
          backgroundColor: a.color + '24', alignItems: 'center', justifyContent: 'center',
          borderWidth: 2, borderColor: a.color,
          shadowColor: a.color, shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 0 }, elevation: 12,
        }, aBadge]}>
          <I size={68} color={a.color} />
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(180).duration(320)} style={{ alignItems: 'center' }}>
        <Text style={{ color: a.color, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginTop: 14, textTransform: 'uppercase' }}>
          {ru ? 'Достижение открыто' : 'Achievement unlocked'}
        </Text>
        <Text style={{ color: t.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginTop: 8, textAlign: 'center' }}>
          {ru ? a.titleRu : a.titleEn}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 15, marginTop: 6, textAlign: 'center', lineHeight: 21 }}>
          {ru ? a.descRu : a.descEn}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(320).duration(320)}>
        <Pressable onPress={onClose}
          style={({ pressed }) => ({ marginTop: 28, paddingVertical: 15, paddingHorizontal: 48, borderRadius: radius.xl, backgroundColor: a.color, opacity: pressed ? 0.9 : 1 })}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{ru ? 'Класс!' : 'Nice!'}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
