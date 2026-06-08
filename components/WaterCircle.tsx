// A mesmerising "liquid fill" circle — the water level is driven by `fill`
// (0..1) and two sine-wave surfaces drift in opposite directions so it never
// looks static. Pure reanimated + react-native-svg, Expo-Go safe.
//
// Used by the SOS wave timer (level rises as the urge passes) and the
// breathing orb (level rises on inhale, drains on exhale).

import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, ClipPath, Circle, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing, cancelAnimation,
  type SharedValue,
} from 'react-native-reanimated';

const APath = Animated.createAnimatedComponent(Path);
const TAU = Math.PI * 2;

export function WaterCircle({
  size, fill, color, color2, amp = 7, periods = 1.25, speedMs = 2600, children,
}: {
  size: number;
  fill: SharedValue<number>;     // 0..1 water level
  color: string;                  // front wave
  color2?: string;                // back wave (defaults to color)
  amp?: number;                   // wave height in px
  periods?: number;               // number of crests across the width
  speedMs?: number;
  children?: React.ReactNode;
}) {
  const back = color2 ?? color;
  const p1 = useSharedValue(0);
  const p2 = useSharedValue(0);

  useEffect(() => {
    p1.value = withRepeat(withTiming(TAU, { duration: speedMs, easing: Easing.linear }), -1, false);
    p2.value = withRepeat(withTiming(TAU, { duration: speedMs * 1.7, easing: Easing.linear }), -1, false);
    return () => { cancelAnimation(p1); cancelAnimation(p2); };
  }, []);

  // Smooth wave path via a Catmull-Rom spline → cubic béziers. Straight `L`
  // segments looked faceted/"rough"; béziers give a glassy, flowing surface.
  // `close=true` seals the shape into a fill (down past the rim); false leaves
  // an open polyline for the crisp crest stroke.
  const build = (phase: number, f: number, a: number, per: number, close: boolean) => {
    'worklet';
    const baseline = (1 - f) * size;
    const N = 9; // fewer points — the spline interpolates them smoothly
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i <= N; i++) {
      xs.push((size * i) / N);
      ys.push(baseline + Math.sin((i / N) * per * TAU + phase) * a);
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
    if (close) d += ` L ${size} ${size + a} L 0 ${size + a} Z`;
    return d;
  };

  const frontProps = useAnimatedProps(() => ({ d: build(p1.value, fill.value, amp, periods, true) }));
  const backProps = useAnimatedProps(() => ({ d: build(-p2.value, fill.value, amp * 0.7, periods + 0.6, true) }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <ClipPath id="wc-clip"><Circle cx={size / 2} cy={size / 2} r={size / 2} /></ClipPath>
          <SvgLinearGradient id="wc-front" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.95} />
            <Stop offset="1" stopColor={color} stopOpacity={0.65} />
          </SvgLinearGradient>
        </Defs>
        <Rect x={0} y={0} width={size} height={size} rx={size / 2} fill={color} opacity={0.12} clipPath="url(#wc-clip)" />
        <APath animatedProps={backProps} fill={back} opacity={0.5} clipPath="url(#wc-clip)" />
        <APath animatedProps={frontProps} fill="url(#wc-front)" clipPath="url(#wc-clip)" />
        <Circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="none" stroke={color} strokeOpacity={0.6} strokeWidth={2} />
      </Svg>
      {children}
    </View>
  );
}
