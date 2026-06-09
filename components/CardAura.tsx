// Lightweight native animated background for a single card — a few soft colour
// blobs slowly drift and breathe over a dark base. Cheap (reanimated, no
// WebView), so it's safe inside a scrolling list. Fill a parent that has
// `overflow: 'hidden'` and rounded corners.

import { useEffect } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';

function Blob({ color, size, top, left, dur, dx, dy }: {
  color: string; size: number; top: number; left: number; dur: number; dx: number; dy: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(p);
  }, []);
  const a = useAnimatedStyle(() => ({
    opacity: 0.45 + p.value * 0.3,
    transform: [{ translateX: dx * p.value }, { translateY: dy * p.value }, { scale: 1 + p.value * 0.18 }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, top, left }, a]}>
      <LinearGradient colors={[color, 'transparent']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1, borderRadius: size / 2 }} />
    </Animated.View>
  );
}

export function CardAura({ colors, base = '#0E1420' }: { colors: string[]; base?: string }) {
  const [c1, c2, c3] = [colors[0], colors[1] ?? colors[0], colors[2] ?? colors[0]];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: base }}>
      <Blob color={c1} size={260} top={-90} left={-50} dur={6000} dx={70} dy={40} />
      <Blob color={c2} size={230} top={-50} left={150} dur={8200} dx={-60} dy={70} />
      <Blob color={c3} size={210} top={40} left={70} dur={7000} dx={50} dy={-55} />
      <Blob color={c1} size={180} top={30} left={220} dur={9000} dx={-45} dy={-40} />
    </View>
  );
}
