import { Stack } from 'expo-router';

export default function OnbLayout() {
  // gestureEnabled: false — an accidental edge swipe used to pop a multi-step
  // screen (personality/depth) and wipe all in-progress answers. Every step
  // now has its own explicit back button instead.
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: false }} />;
}
