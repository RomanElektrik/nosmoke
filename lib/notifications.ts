import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MILESTONES } from './health';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Returns whether notifications are actually allowed, so callers can stop
// promising reminders that will never arrive.
export async function requestPermissions(): Promise<boolean> {
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return status === 'granted';
}

type T = (ru: string, en: string) => string;

// Adaptive 14-day program based on Cochrane / SG 2020 / Shiffman relapse-dynamics:
// • Day 1: every 2.5h (acute receptor changes, peak risk).
// • Day 2–3: morning hot-zone + post-meal + evening (Day 3 = withdrawal peak).
// • Day 4–7: morning hot-zone + evening reflection.
// • Day 8–14: morning + check-in.
// • After day 14: occasional + milestones.
export async function scheduleQuitProgram(quitDateMs: number, locale: 'ru' | 'en', wakeHour = 8, checkInHour = 21) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const t: T = (ru, en) => (locale === 'ru' ? ru : en);
  const now = Date.now();

  const at = (dayOffset: number, hour: number, minute = 0) =>
    quitDateMs + dayOffset * 86400_000 + hour * 3600_000 + minute * 60_000;

  // `url` rides in the payload — the response listener in app/_layout.tsx
  // routes there, so a push lands the user in the right tool, not on Home.
  const schedule = async (date: number, title: string, body: string, url?: string) => {
    if (date <= now) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: url ? { url } : undefined },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(date) },
    });
  };

  // ---------- DAY 1 — every 2.5h, anti-craving --------------
  // Anchor to max(quitDate, now): with an evening onboarding all quitDate-based
  // slots land in the past and day 1 — the riskiest day — gets zero support.
  // Night slots (22:00–07:59 local) are skipped, the wave continues next morning.
  const acuteStart = Math.max(quitDateMs, now);
  for (let h = 1; h <= 24; h += 2.5) {
    const slot = acuteStart + h * 3600_000;
    const localHour = new Date(slot).getHours();
    if (localHour >= 22 || localHour < 8) continue;
    if (slot >= quitDateMs + 2 * 86400_000) break; // stay within the acute window
    await schedule(slot,
      t('Тяга — это волна. 4 минуты — и пройдёт.', 'A craving is a wave. 4 minutes — and it passes.'),
      t('Открой SOS — 60 секунд дыхания. Просто попробуй.', 'Tap SOS — 60s breathing. Just try.'),
      '/craving',
    );
  }

  // ---------- DAYS 2–14 — morning hot-zone --------------
  for (let d = 1; d <= 13; d++) {
    await schedule(at(d, wakeHour, 5),
      t(`День ${d + 1} · утро`, `Day ${d + 1} · morning`),
      t('Сделай дыхание перед чаем/кофе — это твоя зона риска.', 'Do the breath before tea/coffee — this is your risk window.'),
    );
  }

  // ---------- DAY 3 — peak warning --------------
  await schedule(at(2, wakeHour + 1),
    t('Сегодня пик. Знай это.', 'Today is the peak. Know this.'),
    t('После сегодня станет проще — это биохимия, а не настроение.', 'After today it gets easier — biochemistry, not mood.'),
  );
  await schedule(at(2, 14),
    t('Пик абстиненции — день 3.', 'Day 3 — withdrawal peak.'),
    t('Тебе сейчас по-настоящему трудно. Это пройдёт.', 'You\'re genuinely struggling. It will pass.'),
  );
  await schedule(at(2, 19),
    t('Ещё несколько часов — и пик позади.', 'A few more hours and the peak is behind you.'),
    t('Ты прошёл самое сложное. Завтра легче.', 'You made it through the hardest. Tomorrow is easier.'),
  );

  // ---------- DAYS 2–7 — proactive evening check-in --------------
  // Days 3–7 are the retention cliff: the push opens a ready conversation with
  // the coach instead of dropping the user on a blank journal.
  for (let d = 1; d <= 6; d++) {
    await schedule(at(d, 21),
      t(`День ${d + 1} · как ты?`, `Day ${d + 1} · how are you?`),
      t('Бриз рядом. Расскажи, как прошёл день — одно сообщение.', 'Breeze is here. Tell me about your day — one message.'),
      '/chat?mode=support',
    );
  }

  // ---------- DAY 7 — week milestone --------------
  await schedule(at(6, wakeHour + 2),
    t('Неделя без сигарет', 'One week clean'),
    t('Лёгкие уже начали восстанавливаться. Загляни в Прогресс.', 'Lungs are already healing. Open Progress.'),
    '/(tabs)/progress',
  );

  // ---------- DAY 14 — graduation from critical window --------------
  await schedule(at(13, wakeHour + 2),
    t('2 недели. Острая фаза позади.', '2 weeks. Acute phase is behind you.'),
    t('Поддержка переходит в плавный режим. Ты молодец.', 'Support shifts to maintenance mode. Well done.'),
  );

  // ---------- HEALTH milestones (first 6 only) --------------
  for (const m of MILESTONES.slice(0, 6)) {
    await schedule(quitDateMs + m.at * 1000,
      t('Веха достигнута', 'Milestone reached'),
      t('В разделе «Здоровье» — новое восстановление.', 'In Health — a new recovery just unlocked.'),
      '/(tabs)/progress',
    );
  }

  // Daily "did you smoke today?" check-in removed — pestering users
  // every evening was the #1 complaint.
}

// Schedule per-dose medication reminders for next 7 days.
// Uses dosesForDay() to know what dose at what hour for each day of the course.
export async function scheduleMedicationDoses(
  locale: 'ru' | 'en',
  med: 'cytisine' | 'bupropion' | 'varenicline',
  startedAtMs: number,
) {
  const { dosesForDay } = await import('./medication');
  const t: T = (ru, en) => (locale === 'ru' ? ru : en);
  const now = Date.now();
  const startMidnight = new Date(startedAtMs); startMidnight.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() + i);
    const courseDay = Math.floor((date.getTime() - startMidnight.getTime()) / 86400_000) + 1;
    if (courseDay < 1) continue;
    const doses = dosesForDay(med, courseDay);
    const medName = med === 'cytisine' ? t('Цитизин (Табекс)', 'Cytisine (Tabex)')
      : med === 'bupropion' ? t('Бупропион', 'Bupropion')
      : t('Варениклин', 'Varenicline');
    for (const d of doses) {
      const fire = new Date(date);
      fire.setHours(d.hour, d.minute, 0, 0);
      if (fire.getTime() < now) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${medName} · ${t('доза', 'dose')} ${d.doseNumber}/${d.totalDoses}`,
          body: locale === 'ru' ? (d.noteRu ?? '') : (d.noteEn ?? ''),
          data: { route: '/meds' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire },
      });
    }
  }
}

// Schedules a recurring daily check-in notification at the user's check-in hour.
// On iOS we cannot truly recur, so we batch-schedule for next 30 days.
export async function scheduleDailyCheckIn(locale: 'ru' | 'en', checkInHour: number) {
  const t: T = (ru, en) => (locale === 'ru' ? ru : en);
  const now = Date.now();
  for (let d = 0; d < 30; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    date.setHours(checkInHour, 0, 0, 0);
    if (date.getTime() < now) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('Чек-ин дня', 'Daily check-in'),
        body: t('Ты сегодня курил? Один тап в приложении.', 'Did you smoke today? One tap in the app.'),
        data: { route: '/checkin' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  }
}

// Proactive, data-driven nudge: fires ~10 min before the user's personal peak
// craving window (computed from their logged cravings). A fixed identifier so
// re-scheduling on each app open replaces it instead of stacking duplicates.
export async function scheduleCravingNudge(peakHourStart: number | null, locale: 'ru' | 'en') {
  const id = 'craving-nudge';
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
  if (peakHourStart == null) return;
  let hour = peakHourStart, minute = -10;
  if (minute < 0) { minute += 60; hour = (hour + 23) % 24; }
  const t: T = (ru, en) => (locale === 'ru' ? ru : en);
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: t('Скоро твоё время тяги', 'Your craving window is near'),
        body: t('Обычно сейчас тянет — и обычно ты держишься. Под рукой: холодная вода и пара вдохов.',
                'You usually crave now — and usually you hold. Cold water and a few breaths help.'),
        data: { route: '/craving' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  } catch {}
}
