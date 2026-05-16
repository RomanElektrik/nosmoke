import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { loadState, update, useAppState } from '../lib/storage';
import { useTheme } from '../lib/theme';
import { recommendStep } from '../lib/stepped';
import { initPurchases } from '../lib/subscription';
import '../lib/i18n';

export default function Root() {
  const t = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [state] = useAppState();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initPurchases();
    loadState().then(async (s) => {
      // Migration: legacy profile without currentStep → auto-recommend.
      if (s.profile && !s.profile.currentStep) {
        const recommended = recommendStep(s.profile);
        await update((prev) => ({
          ...prev,
          profile: prev.profile ? {
            ...prev.profile,
            currentStep: recommended,
            stepEnteredAt: prev.profile.stepEnteredAt ?? prev.profile.quitDate ?? Date.now(),
            commitmentMode: prev.profile.commitmentMode ?? 'soft',
            checkInHour: prev.profile.checkInHour ?? 21,
          } : prev.profile,
        }));
      }
      setReady(true);
    });
  }, []);

  const hasProfile = !!state.profile?.onboardingComplete;

  useEffect(() => {
    if (!ready) return;
    const first = segments[0] as string | undefined;
    const inOnb = first === '(onboarding)';
    if (!hasProfile && !inOnb) router.replace('/(onboarding)/welcome');
    else if (hasProfile && inOnb) router.replace('/(tabs)');
  }, [ready, hasProfile, segments]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.bg },
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="craving" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
        <Stack.Screen name="slip" />
        <Stack.Screen name="faith" />
        <Stack.Screen name="practice/[id]" />
        <Stack.Screen name="goal" />
        <Stack.Screen name="journal" />
        <Stack.Screen name="program" />
        <Stack.Screen name="checkin" />
        <Stack.Screen name="method" />
        <Stack.Screen name="transition" />
        <Stack.Screen name="meds" />
        <Stack.Screen name="med-gate" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
        <Stack.Screen name="paywall" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
        <Stack.Screen name="chat" options={{ fullScreenGestureEnabled: false }} />
        <Stack.Screen name="game" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
