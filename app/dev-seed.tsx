// ВРЕМЕННЫЙ dev-экран для скриншотов: сеет демо-профиль (день 8, премиум,
// накопления) и уходит на главную. НЕ КОММИТИТЬ — удалить после съёмки.
import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { update } from '../lib/storage';

const DAY = 86400_000;

export default function DevSeed() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      // 🔴 Только dev: в прод-сборке роут просто уводит на главную, ничего не сея
      // (иначе любой, узнавший URL/scheme, получил бы вечный премиум).
      if (!__DEV__) { router.replace('/'); return; }
      const now = Date.now();
      await update((prev) => ({
        ...prev,
        premiumUntil: now + 3650 * DAY,
        premiumPlan: 'lifetime',
        tourV1Done: true,
        // Ачивки за прошедшие 8 дней помечаем полученными заранее — иначе при
        // первом же заходе поверх главной вылезает модалка «Достижение открыто».
        achievements: {
          d1: now - 7 * DAY, d7: now - DAY, m1000: now - 2 * DAY,
          h20m: now - 8 * DAY, h8h: now - 8 * DAY, h48h: now - 6 * DAY, h2w: now - DAY,
          streak7: now - DAY, c100: now - DAY, logs25: now - DAY, sos10: now - DAY,
        } as any,
        profile: {
          yearsSmoked: 9,
          cigsPerDay: 15,
          cigsInPack: 20,
          packPrice: 240,
          currency: 'RUB',
          type: 'cigarette',
          triggers: ['stress', 'coffee', 'after_meal'],
          motivations: ['health', 'money', 'family'],
          method: 'cold_turkey',
          quitDate: now - 8 * DAY - 5 * 3600_000,
          faithEnabled: false,
          onboardingComplete: true,
          reasonsSeeded: true,
          devPremium: true,
          currentStep: 'L1_behavioral' as any,
          stepEnteredAt: now - 8 * DAY,
          commitmentMode: 'soft' as any,
          checkInHour: 21,
          wakeHour: 8,
          importance: 9,
          confidence: 7,
          identityStatement: 'свободным человеком',
          reasons: [
            { text: 'Дышать полной грудью', emoji: '🫁' },
            { text: 'Дети не должны видеть меня с сигаретой', emoji: '👨‍👧' },
            { text: 'Накопить на путешествие', emoji: '✈️' },
          ],
        },
        cravings: [
          { ts: now - 7 * DAY, intensity: 8, trigger: 'stress', outcome: 'resisted' },
          { ts: now - 6 * DAY, intensity: 7, trigger: 'coffee', outcome: 'resisted' },
          { ts: now - 5 * DAY, intensity: 6, trigger: 'after_meal', outcome: 'resisted' },
          { ts: now - 3 * DAY, intensity: 5, trigger: 'stress', outcome: 'resisted' },
          { ts: now - 1 * DAY, intensity: 4, trigger: 'coffee', outcome: 'resisted' },
        ] as any,
        bookProgress: { intro: 1, willpower: 1, trap: 1 } as any,
      }));
      router.replace('/');
    })();
  }, []);
  return <View style={{ flex: 1, backgroundColor: '#0A1D15' }} />;
}
