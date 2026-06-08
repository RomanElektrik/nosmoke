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

  // Build a filled wave path in a worklet. Level = (1-fill)*size from the top;
  // a little overshoot (-amp..size+amp) so crests never clip the rim.
  const wave = (phase: number, f: number, a: number, per: number) => {
    'worklet';
    const baseline = (1 - f) * size;
    const N = 16;
    let d = `M 0 ${baseline}`;
    for (let i = 0; i <= N; i++) {
      const x = (size * i) / N;
      const y = baseline + Math.sin((i / N) * per * TAU + phase) * a;
      d += ` L ${Math.round(x)} ${Math.round(y)}`;
    }
    d += ` L ${size} ${size + a} L 0 ${size + a} Z`;
    return d;
  };

  const frontProps = useAnimatedProps(() => ({ d: wave(p1.value, fill.value, amp, periods) }));
  const backProps = useAnimatedProps(() => ({ d: wave(-p2.value, fill.value, amp * 0.7, periods + 0.6) }));

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
        <Rect x={0} y={0} width={size} height={size} rx={size / 2} fill={color} opacity={0.1} clipPath="url(#wc-clip)" />
        <APath animatedProps={backProps} fill={back} opacity={0.4} clipPath="url(#wc-clip)" />
        <APath animatedProps={frontProps} fill="url(#wc-front)" clipPath="url(#wc-clip)" />
        <Circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="none" stroke={color} strokeOpacity={0.55} strokeWidth={2} />
      </Svg>
      {children}
    </View>
  );
}
