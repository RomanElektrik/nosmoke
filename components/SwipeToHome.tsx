// Wraps a tab screen with a horizontal swipe-right gesture that navigates to Home.
// Uses react-native-gesture-handler's Gesture API (Expo SDK 54 / RNGH 2.x).
// The gesture only fires when: dx > threshold AND velocity > min AND dy is small
// enough — so vertical scrolling is unaffected.

import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const SWIPE_X_MIN = 60;     // px translated right
const SWIPE_VX_MIN = 300;   // px/s velocity
const SWIPE_Y_MAX = 80;     // max vertical drift allowed

export function SwipeToHome({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([SWIPE_X_MIN, 9999])  // only activate on rightward movement
    .failOffsetY([-SWIPE_Y_MAX, SWIPE_Y_MAX])  // fail if vertical drift too large
    .onEnd((e) => {
      if (e.translationX > SWIPE_X_MIN && e.velocityX > SWIPE_VX_MIN) {
        Haptics.selectionAsync();
        router.navigate('/(tabs)' as any);
      }
    });

  return <GestureDetector gesture={pan}>{children as any}</GestureDetector>;
}
