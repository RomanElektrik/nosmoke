import { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../lib/theme';
import { useTranslation } from '../lib/i18n';

const PHASES = [
  { key: 'inhale', dur: 4000, scale: 1.0,  opacity: 0.85 },
  { key: 'hold',   dur: 4000, scale: 1.0,  opacity: 0.85 },
  { key: 'exhale', dur: 4000, scale: 0.55, opacity: 0.4  },
  { key: 'hold',   dur: 4000, scale: 0.55, opacity: 0.4  },
] as const;

// Smooth ease curve — standard CSS-like ease-in-out cubic-bezier(0.42, 0, 0.58, 1).
const ease = Easing.bezier(0.42, 0, 0.58, 1);

export function BreathingOrb({ onDone, totalSeconds = 60 }: { onDone?: () => void; totalSeconds?: number }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const scale = useSharedValue(0.55);
  const opacity = useSharedValue(0.4);
  const haloScale = useSharedValue(0.55);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const startedAt = useRef<number>(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    startedAt.current = Date.now();
    const id = setInterval(() => {
      const e = Math.floor((Date.now() - startedAt.current) / 1000);
      setElapsedSec(e);
      if (e >= totalSeconds) {
        clearInterval(id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onDone?.();
      }
    }, 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const phase = PHASES[phaseIdx];
    Haptics.selectionAsync();
    scale.value = withTiming(phase.scale, { duration: phase.dur, easing: ease });
    haloScale.value = withTiming(phase.scale * 1.15, { duration: phase.dur, easing: ease });
    opacity.value = withTiming(phase.opacity, { duration: phase.dur, easing: ease });
    const id = setTimeout(() => setPhaseIdx((i) => (i + 1) % PHASES.length), phase.dur);
    return () => clearTimeout(id);
  }, [phaseIdx]);

  const aOuter = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const aHalo  = useAnimatedStyle(() => ({ transform: [{ scale: haloScale.value }], opacity: opacity.value * 0.5 }));
  const aGlow  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value * 1.5 }], opacity: opacity.value * 0.18 }));

  const phase = PHASES[phaseIdx];
  const remaining = Math.max(0, totalSeconds - elapsedSec);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
      <View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer glow */}
        <Animated.View style={[
          { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: t.accent },
          aGlow,
        ]} />
        {/* Halo */}
        <Animated.View style={[
          { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: t.accent + '20' },
          aHalo,
        ]} />
        {/* Main orb */}
        <Animated.View style={[
          {
            width: 200, height: 200, borderRadius: 100,
            backgroundColor: t.accentSoft, borderWidth: 2, borderColor: t.accent,
            alignItems: 'center', justifyContent: 'center',
          },
          aOuter,
        ]}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '700' }}>
            {tr(`sos.${phase.key}`)}
          </Text>
        </Animated.View>
      </View>
      <Text style={{
        color: t.textDim, marginTop: 24, fontSize: 18, fontWeight: '600',
        fontVariant: ['tabular-nums'], letterSpacing: 0.5,
      }}>
        {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
      </Text>
    </View>
  );
}
