// Full-screen colourful flowing waves. Several translucent wave bands scroll
// horizontally at different speeds and colours. The phase loops over exactly 2π
// (a sine is 2π-periodic) so the motion is perfectly seamless — it never visibly
// restarts. Blurred on top to melt into a dreamy aurora.

import { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const APath = Animated.createAnimatedComponent(Path);
const TAU = Math.PI * 2;

type Layer = { col: string; base: number; amp: number; per: number; dur: number; dir: 1 | -1; op: number };

function WaveLayer({ W, H, col, base, amp, per, dur, dir, op }: Layer & { W: number; H: number }) {
  const phase = useSharedValue(0);
  useEffect(() => {
    phase.value = withRepeat(withTiming(dir * TAU, { duration: dur, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(phase);
  }, []);

  const props = useAnimatedProps(() => {
    'worklet';
    const baseY = base * H;
    const N = 14;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i <= N; i++) {
      xs.push((W * i) / N);
      ys.push(baseY + Math.sin((i / N) * per * TAU + phase.value) * amp);
    }
    let d = `M ${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
    for (let i = 0; i < N; i++) {
      const x0 = xs[i - 1 < 0 ? 0 : i - 1], y0 = ys[i - 1 < 0 ? 0 : i - 1];
      const x1 = xs[i], y1 = ys[i];
      const x2 = xs[i + 1], y2 = ys[i + 1];
      const x3 = xs[i + 2 > N ? N : i + 2], y3 = ys[i + 2 > N ? N : i + 2];
      const c1x = x1 + (x2 - x0) / 6, c1y = y1 + (y2 - y0) / 6;
      const c2x = x2 - (x3 - x1) / 6, c2y = y2 - (y3 - y1) / 6;
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }
    d += ` L ${W} ${H + 90} L 0 ${H + 90} Z`;
    return { d };
  });

  return <APath animatedProps={props} fill={col} opacity={op} />;
}

export function WaveAurora({ color }: { color: string }) {
  const { width: W, height: H } = Dimensions.get('window');
  // ONE colour — the practice colour — in soft shades. Calm, slow, never-
  // repeating flow. A faint white band on top adds a gentle highlight, not a
  // second colour.
  const layers: Layer[] = [
    { col: color,     base: 0.34, amp: 30, per: 1.3, dur: 19000, dir: 1,  op: 0.55 },
    { col: color,     base: 0.50, amp: 40, per: 1.0, dur: 24000, dir: -1, op: 0.4 },
    { col: '#FFFFFF', base: 0.62, amp: 34, per: 1.5, dur: 21000, dir: 1,  op: 0.08 },
    { col: color,     base: 0.74, amp: 44, per: 1.1, dur: 27000, dir: -1, op: 0.5 },
    { col: color,     base: 0.88, amp: 36, per: 1.4, dur: 16000, dir: 1,  op: 0.6 },
  ];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width={W} height={H}>
        {layers.map((l, i) => <WaveLayer key={i} W={W} H={H} {...l} />)}
      </Svg>
      <BlurView intensity={40} tint="dark" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
    </View>
  );
}
