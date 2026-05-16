// Celebration overlay shown the moment an achievement unlocks.
import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay } from 'react-native-reanimated';
import { useTheme, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { Icon } from '../components/Icon';
import { getAchievement } from '../lib/achievements';

const CONFETTI = ['#FF453A', '#FF9F0A', '#30D158', '#0A84FF', '#BF5AF2', '#FFD60A'];

export function AchievementUnlock({ achId, onClose }: { achId: string; onClose: () => void }) {
  const t = useTheme();
  const ru = currentLang() === 'ru';
  const a = getAchievement(achId);

  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 180 });
    scale.value = withDelay(60, withSpring(1, { damping: 9, stiffness: 140 }));
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
      {/* simple confetti row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
        {CONFETTI.map((c, i) => (
          <View key={i} style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: c,
            transform: [{ rotate: `${i * 25}deg` }] }} />
        ))}
      </View>

      <Animated.View style={[{
        width: 132, height: 132, borderRadius: 40,
        backgroundColor: a.color + '24', alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: a.color,
      }, aBadge]}>
        <I size={68} color={a.color} />
      </Animated.View>

      <Text style={{ color: a.color, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginTop: 22, textTransform: 'uppercase' }}>
        {ru ? 'Достижение открыто' : 'Achievement unlocked'}
      </Text>
      <Text style={{ color: t.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginTop: 8, textAlign: 'center' }}>
        {ru ? a.titleRu : a.titleEn}
      </Text>
      <Text style={{ color: t.textDim, fontSize: 15, marginTop: 6, textAlign: 'center', lineHeight: 21 }}>
        {ru ? a.descRu : a.descEn}
      </Text>

      <Pressable onPress={onClose}
        style={{ marginTop: 28, paddingVertical: 15, paddingHorizontal: 48, borderRadius: radius.xl, backgroundColor: a.color }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{ru ? 'Класс!' : 'Nice!'}</Text>
      </Pressable>
    </Animated.View>
  );
}
