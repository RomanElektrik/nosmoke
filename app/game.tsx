import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, spacing, radius } from '../lib/theme';
import { currentLang } from '../lib/i18n';
import { Icon } from '../components/Icon';

const { width: W, height: H } = Dimensions.get('window');

const GAME_DURATION = 3 * 60; // 3 minutes in seconds

const BUBBLE_COLORS = [
  '#5AC8FA', '#64D2FF', '#0A84FF',
  '#30D158', '#34C759', '#4CD964',
  '#BF5AF2', '#AF52DE',
  '#FF9F0A', '#FF9500',
  '#FF6B6B', '#FF453A',
];

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  popped: boolean;
}

let nextId = 0;

function makeBubble(): Bubble {
  const size = 48 + Math.random() * 52; // 48–100 px
  return {
    id: nextId++,
    x: size / 2 + Math.random() * (W - size),
    y: H + size,
    size,
    color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
    popped: false,
  };
}

function BubbleView({ bubble, onPop }: { bubble: Bubble; onPop: (id: number) => void }) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const duration = 6000 + Math.random() * 6000; // 6–12 s rise

  useEffect(() => {
    // Rise from bottom to above screen
    translateY.value = withTiming(-(H + bubble.size + 100), {
      duration,
      easing: Easing.linear,
    });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  function pop() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(1.4, { damping: 6, stiffness: 300 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onPop)(bubble.id);
    });
  }

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: bubble.x - bubble.size / 2,
          top: bubble.y - bubble.size / 2,
          width: bubble.size,
          height: bubble.size,
          borderRadius: bubble.size / 2,
        },
        animStyle,
      ]}
    >
      <Pressable onPress={pop} style={{ flex: 1 }}>
        <View style={{
          flex: 1,
          borderRadius: bubble.size / 2,
          backgroundColor: bubble.color + '55',
          borderWidth: 2,
          borderColor: bubble.color + 'CC',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Shine spot */}
          <View style={{
            position: 'absolute',
            top: bubble.size * 0.15,
            left: bubble.size * 0.2,
            width: bubble.size * 0.25,
            height: bubble.size * 0.15,
            borderRadius: bubble.size * 0.1,
            backgroundColor: 'rgba(255,255,255,0.55)',
            transform: [{ rotate: '-30deg' }],
          }} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function Game() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const ru = lang === 'ru';

  const [phase, setPhase] = useState<'play' | 'done'>('play');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [popped, setPopped] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    setPhase('done');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  useEffect(() => {
    // Countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Spawn bubbles every 800 ms
    spawnRef.current = setInterval(() => {
      setBubbles((prev) => {
        // Limit max simultaneous bubbles to 14
        const active = prev.filter((b) => !b.popped);
        if (active.length >= 14) return prev;
        return [...prev.filter((b) => !b.popped), makeBubble()];
      });
    }, 800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, [finish]);

  function handlePop(id: number) {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    setPopped((n) => n + 1);
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerStr = `${mins}:${String(secs).padStart(2, '0')}`;

  if (phase === 'done') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: 20 }}>
          <LinearGradient
            colors={['#30D15838', '#30D15808']}
            style={{ width: 100, height: 100, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.wave2 size={56} color="#30D158" />
          </LinearGradient>
          <Text style={{ color: t.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center' }}>
            {ru ? 'Волна прошла' : 'Wave passed'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 17, textAlign: 'center', lineHeight: 24 }}>
            {ru
              ? `Ты лопнул ${popped} ${bubbles_ru(popped)} и пережил 3 минуты тяги. Так и работает — она проходит.`
              : `You popped ${popped} bubble${popped !== 1 ? 's' : ''} and rode out a 3-minute craving. That's how it works — it passes.`}
          </Text>
          <View style={{ gap: 10, width: '100%', marginTop: 8 }}>
            <Pressable onPress={() => router.back()}
              style={{ padding: 18, borderRadius: radius.xl, backgroundColor: t.accent, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
                {ru ? 'Отлично, я справился' : 'Great, I made it'}
              </Text>
            </Pressable>
            <Pressable onPress={() => {
              setPhase('play');
              setBubbles([]);
              setPopped(0);
              setTimeLeft(GAME_DURATION);
              nextId = 0;
            }}
              style={{ padding: 16, borderRadius: radius.xl, borderWidth: 1, borderColor: t.border, alignItems: 'center' }}>
              <Text style={{ color: t.textDim, fontSize: 15 }}>
                {ru ? 'Ещё раз' : 'Play again'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Bubbles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {bubbles.map((b) => (
          <BubbleView key={b.id} bubble={b} onPop={handlePop} />
        ))}
      </View>

      {/* HUD */}
      <SafeAreaView style={{ flex: 1 }} pointerEvents="box-none">
        <Animated.View entering={FadeInDown.duration(300)} pointerEvents="box-none">
          {/* Top bar */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
          }}>
            <Pressable onPress={() => router.back()}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.bgElev + 'CC', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.cross size={18} color={t.textDim} />
            </Pressable>

            {/* Timer */}
            <View style={{
              paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999,
              backgroundColor: t.bgElev + 'EE', borderWidth: 1, borderColor: t.border,
            }}>
              <Text style={{ color: t.text, fontSize: 18, fontWeight: '800', letterSpacing: 1 }}>
                {timerStr}
              </Text>
            </View>

            {/* Counter */}
            <View style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
              backgroundColor: t.accentSoft + 'CC',
            }}>
              <Text style={{ color: t.accent, fontSize: 16, fontWeight: '800' }}>
                {popped}
              </Text>
            </View>
          </View>

          {/* Hint at bottom */}
          <View style={{ position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' }}>
            <View style={{
              paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999,
              backgroundColor: t.bgElev + 'DD',
            }}>
              <Text style={{ color: t.textDim, fontSize: 14 }}>
                {ru ? 'Лопай пузыри, пока не пройдёт тяга' : 'Pop bubbles until the craving fades'}
              </Text>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function bubbles_ru(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'пузырь';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'пузыря';
  return 'пузырей';
}
