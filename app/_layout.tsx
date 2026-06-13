import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { loadState, update, useAppState, seedReasonsFromMotivations } from '../lib/storage';
import { useTheme } from '../lib/theme';
import { recommendStep } from '../lib/stepped';
import { computeInsights } from '../lib/insights';
import * as Notifications from 'expo-notifications';
import { scheduleCravingNudge, scheduleQuitProgram, scheduleMedicationDoses, scheduleWeeklyReflection } from '../lib/notifications';
import { currentLang } from '../lib/i18n';
import { TourProvider } from '../components/Tour';
import '../lib/i18n';

export default function Root() {
  const t = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [state] = useAppState();
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
      // «Почему я бросаю» starts from the onboarding answers — seed once if
      // the board is empty but motivations were given.
      if (s.profile) {
        const seeded = seedReasonsFromMotivations(s.profile);
        if (seeded) {
          await update((prev) => ({
            ...prev,
            profile: prev.profile ? { ...prev.profile, reasons: seeded } : prev.profile,
          }));
        }
      }
      // Rebuild the full notification plan on every launch. This keeps
      // medication-dose reminders alive past the 7-day scheduling window
      // (they were planned once at med-gate and silently died on day 8),
      // refreshes language after a switch, and re-anchors day-1 support.
      // scheduleQuitProgram cancels everything first, so order matters:
      // program → med doses → craving nudge.
      try {
        if (s.profile?.onboardingComplete) {
          const lang = currentLang();
          await scheduleQuitProgram(s.profile.quitDate, lang, 8, s.profile.checkInHour ?? 21);
          if (s.profile.medication && s.profile.medicationStartedAt) {
            await scheduleMedicationDoses(lang, s.profile.medication, s.profile.medicationStartedAt);
          }
          const ins = computeInsights(s.cravings ?? []);
          await scheduleCravingNudge(ins.peakHourStart, lang);
          await scheduleWeeklyReflection(lang);
        }
      } catch {}
      setReady(true);
    });
  }, []);

  // Tapping a push routes to the tool it promised (SOS, chat, health) instead
  // of dropping the user on Home. The url rides in the notification payload.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data as { url?: string; route?: string } | undefined;
      const url = data?.url ?? data?.route;
      if (typeof url === 'string' && url.startsWith('/')) {
        setTimeout(() => router.push(url as any), 300);
      }
    });
    return () => sub.remove();
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
      <TourProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.bg },
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          // Edge-only back swipe (iOS standard) — full-screen was too sensitive,
          // triggering "back" while just scrolling content (e.g. articles).
          fullScreenGestureEnabled: false,
        }}
      >
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="craving" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
        <Stack.Screen name="slip" />
        <Stack.Screen name="practice/[id]" />
        <Stack.Screen name="goal" />
        <Stack.Screen name="journal" />
        <Stack.Screen name="program" />
        <Stack.Screen name="checkin" />
        <Stack.Screen name="method" />
        <Stack.Screen name="transition" />
        <Stack.Screen name="meds" />
        <Stack.Screen name="articles" />
        <Stack.Screen name="article/[id]" />
        <Stack.Screen name="med-gate" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
        <Stack.Screen name="chat" options={{ fullScreenGestureEnabled: false }} />
        <Stack.Screen name="paywall" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
        <Stack.Screen name="symptoms" />

        <Stack.Screen name="game" options={{ animation: 'slide_from_bottom', gestureEnabled: false, fullScreenGestureEnabled: false }} />
        <Stack.Screen name="audio/[id]" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
        <Stack.Screen name="day/[day]" />
        <Stack.Screen name="coping" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
        <Stack.Screen name="insights" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
        <Stack.Screen name="reasons" options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }} />
        {/* Regular push (not a bottom sheet) so the iOS edge-swipe-back works */}
        <Stack.Screen name="letter" />
      </Stack>
      </TourProvider>
    </GestureHandlerRootView>
  );
}
