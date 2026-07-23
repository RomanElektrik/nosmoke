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
  // Приложение только русское — экрана выбора языка больше нет, сразу welcome.
  if (!state.profile) return <Redirect href={'/(onboarding)/welcome' as any} />;
  // Квиз пройден, но план ещё не подтверждён → возвращаем на план, а не на
  // пейвол: иначе выгрузка приложения между экранами навсегда съедала
  // ага-момент, поле «Я становлюсь…» и запрос прав на уведомления.
  if (!state.profile.onboardingComplete && !state.profile.planConfirmed) {
    return <Redirect href={'/(onboarding)/plan' as any} />;
  }
  if (!state.profile.onboardingComplete) return <Redirect href={'/paywall?onb=1' as any} />;
  return <Redirect href="/(tabs)" />;
}
