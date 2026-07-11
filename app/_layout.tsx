import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { loadState, update, useAppState, seedReasonsFromMotivations } from '../lib/storage';
import { useTheme } from '../lib/theme';
import { recommendStep } from '../lib/stepped';
import { computeInsights } from '../lib/insights';
import * as Notifications from 'expo-notifications';
import { rescheduleAll, scheduleCravingNudge, scheduleTrialEndReminder, requestPermissions } from '../lib/notifications';
import { currentLang } from '../lib/i18n';
import { TourProvider } from '../components/Tour';
import { fetchSub } from '../lib/billing';
import '../lib/i18n';

// Держим родной сплэш (splash.png на #0A1D15) до первого кадра приложения.
// Иначе между сплэшем и UI мелькал экран с ActivityIndicator — то самое
// «колёсико и лишний значок». catch — на случай двойного вызова при Fast Refresh.
SplashScreen.preventAutoHideAsync().catch(() => {});

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
      // Сеем причины из мотиваций ОДИН раз. Флаг reasonsSeeded ставим всегда после
      // первой попытки — иначе намеренно удалённые причины возвращались бы на
      // каждом запуске (и всплывали в SOS в худший момент).
      if (s.profile && !s.profile.reasonsSeeded) {
        const seeded = seedReasonsFromMotivations(s.profile);
        await update((prev) => ({
          ...prev,
          profile: prev.profile ? {
            ...prev.profile,
            ...(seeded ? { reasons: seeded } : {}),
            reasonsSeeded: true,
          } : prev.profile,
        }));
      }
      // Приложение уже может рисоваться: профиль и премиум прочитаны из локального
      // кэша (офлайн-first). Всё тяжёлое ниже — планирование ~70 пушей и запрос к
      // серверу — уводим в фон ПОСЛЕ первого кадра. Раньше setReady стоял в самом
      // конце этой цепочки, поэтому UI висел на сплэше, пока клиент не сходит в сеть,
      // а на плохой сети / при заходе из пуша иногда не открывался вовсе.
      setReady(true);

      // Rebuild the full notification plan on every launch. This keeps
      // medication-dose reminders alive past the 7-day scheduling window
      // (they were planned once at med-gate and silently died on day 8),
      // refreshes language after a switch, and re-anchors day-1 support.
      // scheduleQuitProgram cancels everything first, so order matters:
      // program → med doses → craving nudge. Fire-and-forget — НЕ блокирует рендер.
      void (async () => {
        try {
          if (s.profile?.onboardingComplete) {
            const lang = currentLang();
            // Гарантируем права на пуши ДО планирования — иначе scheduleNotificationAsync
            // молча не регистрирует, и «не приходят вообще никакие».
            try { await requestPermissions(); } catch {}
            await rescheduleAll(s.profile, lang);
            const ins = computeInsights(s.cravings ?? []);
            await scheduleCravingNudge(ins.peakHourStart, lang);
          }
        } catch {}
        // Refresh ЮKassa subscription status (server-validated). Only ever change
        // premiumUntil on an AUTHORITATIVE 200 response — fetchSub returns null on
        // any error/parse failure, in which case we keep the cached value (never
        // wipe a paid user on a transient server hiccup).
        try {
          const sub = await fetchSub();
          if (sub) await update((prev) => ({
            ...prev,
            premiumUntil: sub.premium ? sub.until : 0,
            premiumPlan: sub.premium ? (sub.plan ?? null) : null,
            trialUsed: sub.trialUsed ?? prev.trialUsed,
            // Модель lifetime-only: карта не привязывается никогда, автопродления нет.
            boundCard: null,
          }));
          // Напоминание о конце триала ставим ПОСЛЕ rescheduleAll (её cancelAll выше
          // иначе сотрёт его). Только если сейчас активен именно пробный период.
          if (sub && sub.premium && sub.plan === 'trial') {
            const ruL = currentLang() === 'ru';
            // После триала — разовый «Навсегда» 490 ₽ (рекуррента нет).
            await scheduleTrialEndReminder(sub.until, currentLang(), ruL ? '490 ₽' : '$6.99');
          }
        } catch {}
      })();
    }).catch(() => setReady(true));
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

  // «Профиль создан» (прошёл квиз) ≠ «онбординг завершён» (вышел с paywall).
  // Между ними — экран плана и оффер; в этом промежутке профиль уже есть,
  // но completed ещё false.
  const startedProfile = !!state.profile;
  const completed = !!state.profile?.onboardingComplete;

  useEffect(() => {
    if (!ready) return;
    const first = segments[0] as string | undefined;
    // Роут '/' (app/index.tsx) сам решает начальный маршрут декларативно —
    // не вмешиваемся императивным replace, иначе гонка и залипший экран.
    if (!first) return;
    const inOnb = first === '(onboarding)';
    const onPaywall = first === 'paywall';
    // personality/depth-тесты физически лежат в (onboarding), но их открывают и
    // ПОСЛЕ онбординга как самостоятельные экраны (задачи дня 2–3). Не выкидываем
    // с них на главную — иначе тап по «Узнай тип зависимости» просто мигает домой.
    const reusable = segments[1] === 'personality' || segments[1] === 'depth';
    if (!startedProfile && !inOnb) {
      router.replace('/(onboarding)/welcome');
    } else if (startedProfile && !completed && !inOnb && !onPaywall) {
      // Профиль собран, но онбординг не закрыт (оффер не пройден) — возобновляем
      // воронку на paywall. Покрывает выгрузку приложения прямо на оффере.
      router.replace('/paywall?onb=1' as any);
    } else if (completed && inOnb && !reusable) {
      router.replace('/(tabs)');
    }
  }, [ready, startedProfile, completed, segments]);

  // Как только приложение готово рисоваться — прячем родной сплэш. До этого
  // момента экран закрыт сплэшем, поэтому промежуточного «колёсика» больше нет.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

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
        <Stack.Screen name="index" />
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
        <Stack.Screen name="payment-method" />
      </Stack>
      </TourProvider>
    </GestureHandlerRootView>
  );
}
