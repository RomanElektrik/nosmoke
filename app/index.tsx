// Стартовый роут '/'. Без него expo-router резолвил '/' в случайный экран
// (мелькание (tabs)), а гард в _layout императивно делал router.replace прямо
// во время монтирования — отсюда «мелькнул-закрылся» и залипшая кнопка на
// welcome (навигация не успевала устаканиться). Здесь решаем маршрут ДЕКЛАРАТИВНО
// через <Redirect> — роутер уводит чисто, без нестабильного мида-маунт replace.
import { Redirect } from 'expo-router';
import { useAppState } from '../lib/storage';

export default function Index() {
  const [state] = useAppState();
  // Нет профиля → онбординг. Профиль есть, но онбординг не закрыт → воронка на
  // paywall (возобновление). Иначе → приложение.
  // Первый запуск: язык не выбран → экран выбора языка, он уводит на welcome.
  if (!state.profile) return <Redirect href={(state.lang ? '/(onboarding)/welcome' : '/(onboarding)/language') as any} />;
  if (!state.profile.onboardingComplete) return <Redirect href={'/paywall?onb=1' as any} />;
  return <Redirect href="/(tabs)" />;
}
