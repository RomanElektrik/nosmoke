import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MILESTONES } from './health';
import { abstinenceStartMs } from './stepped';
import type { Profile } from './storage';

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
export async function scheduleQuitProgram(quitDateMs: number, locale: 'ru' | 'en', wakeHour = 8, checkInHour = 21, healthAnchorMs?: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const t: T = (ru, en) => (locale === 'ru' ? ru : en);
  const now = Date.now();
  // Вехи здоровья считаем от ДНЯ ОТКАЗА ОТ НИКОТИНА (на фарме он сдвинут на
  // grace-период титрования), а не от quitDate — иначе пуш «лёгкие восстановились»
  // прилетал на 4–7 дней раньше, чем веха открывается на экране Прогресса.
  const healthAnchor = healthAnchorMs ?? quitDateMs;

  // Якорим на ПОЛНОЧЬ дня отказа, а не на момент. Иначе «утро» считалось от
  // времени, когда человек бросил: бросил в 09:08 → at(1,8) = +1д +8ч = 17:08,
  // и «Доброе утро» прилетало вечером. (РФ без переходов на летнее время.)
  const dayBase = (() => { const d = new Date(quitDateMs); d.setHours(0, 0, 0, 0); return d.getTime(); })();
  const at = (dayOffset: number, hour: number, minute = 0) =>
    dayBase + dayOffset * 86400_000 + hour * 3600_000 + minute * 60_000;

  // `url` rides in the payload — the response listener in app/_layout.tsx
  // routes there, so a push lands the user in the right tool, not on Home.
  const schedule = async (date: number, title: string, body: string, url?: string) => {
    // Кривую/прошедшую дату пропускаем. try/catch — чтобы один сбойный пуш НЕ
    // ронял всю функцию: иначе после cancelAll выше юзер остался бы вообще без
    // уведомлений (regression «не приходят вообще никакие»).
    if (!Number.isFinite(date) || date <= now) return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: url ? { url } : undefined },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(date) },
      });
    } catch {}
  };

  // ---------- DAY 1 --------------
  // Анти-краш-пуши «Тяга — это волна / Открой SOS» каждые 2.5 ч УБРАНЫ:
  // повторяющиеся напоминания о тяге сами её праймят и лишний раз напоминают о
  // сигаретах (жалоба пользователя). Поддержка — через мягкие утренние пуши без
  // слова «тяга». Сама кнопка SOS всегда под рукой в приложении.
  void now;

  // ---------- DAYS 2–14 — morning, encouraging (no craving priming) --------------
  for (let d = 1; d <= 13; d++) {
    await schedule(at(d, wakeHour, 5),
      t(`День ${d + 1} · утро`, `Day ${d + 1} · morning`),
      t('Доброе утро. Ещё один свободный день — и ты уже его начал.', 'Good morning. Another free day — and you\'ve already begun it.'),
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
      '/chat?mode=support&opener=evening',
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
    await schedule(healthAnchor + m.at * 1000,
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
  // Персональный пуш «Скоро твоё время тяги / обычно сейчас тянет» УБРАН: он
  // напоминает о тяге и сигаретах (жалоба пользователя). Оставляем только отмену
  // ранее запланированного, чтобы старые экземпляры не всплывали после апдейта.
  void peakHourStart; void locale;
  try { await Notifications.cancelScheduledNotificationAsync('craving-nudge'); } catch {}
}

// Sunday reflection: a weekly ritual that keeps the long-term relationship
// alive. Opens a chat where Breeze proactively reviews the week from data
// (opener=weekly) and asks one question about the next. Batched ~8 weeks ahead;
// re-created on each launch (scheduleQuitProgram's cancelAll wipes the prior
// batch first, so no duplicates).
export async function scheduleWeeklyReflection(locale: 'ru' | 'en') {
  const t: T = (ru, en) => (locale === 'ru' ? ru : en);
  const now = Date.now();
  const d = new Date();
  // next Sunday at 11:00 local
  d.setHours(11, 0, 0, 0);
  const daysToSun = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + (daysToSun === 0 && d.getTime() <= now ? 7 : daysToSun));
  for (let w = 0; w < 8; w++) {
    const fire = new Date(d.getTime() + w * 7 * 86400_000);
    if (fire.getTime() <= now) continue;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t('Разбор недели с Бризом', 'Weekly reflection with Breeze'),
          body: t('Глянем, как прошла неделя — пара минут.', "Let's look back on your week — a couple of minutes."),
          data: { url: '/chat?mode=support&opener=weekly' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire },
      });
    } catch {}
  }
}

// Напоминание за сутки до конца пробного периода → мягкий paywall. Фикс-id, чтобы
// перепланирование заменяло, а не плодило. Ставить после rescheduleAll (её
// cancelAll иначе сотрёт это напоминание).
export async function scheduleTrialEndReminder(untilMs: number, locale: 'ru' | 'en', renewAmount?: string) {
  const id = 'trial-end';
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
  const fire = untilMs - 86400_000;
  if (fire <= Date.now()) return;
  const t: T = (ru, en) => (locale === 'ru' ? ru : en);
  const amt = renewAmount ? ` ${renewAmount}` : '';
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        // Триал с привязкой карты → продлится АВТОМАТИЧЕСКИ. Честно говорим про
        // списание и куда нажать, чтобы отменить (не «оформи» — это dark pattern).
        title: t('Пробный заканчивается завтра', 'Your trial ends tomorrow'),
        body: t(`Завтра спишется${amt} и Премиум продлится. Не хочешь продолжать — отмени в «Способ оплаты» сегодня.`,
                `Tomorrow${amt} will be charged and Premium continues. To stop it, cancel in “Payment method” today.`),
        data: { url: '/payment-method' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(fire) },
    });
  } catch {}
}

// Единая точка перепланирования ВСЕХ напоминаний. scheduleQuitProgram внутри
// делает cancelAll — поэтому медикаментозные дозы, недельную рефлексию и опрос
// самочувствия НУЖНО ставить заново после неё. Этот хелпер вызывают _layout (при
// запуске), restart() (новый старт после срыва) и transition (смена ступени),
// чтобы планы не «терялись» до следующего холодного запуска.
export async function rescheduleAll(p: Profile, locale: 'ru' | 'en') {
  await scheduleQuitProgram(p.quitDate, locale, 8, p.checkInHour ?? 21, abstinenceStartMs(p));
  if (p.medication && p.medicationStartedAt) {
    await scheduleMedicationDoses(locale, p.medication, p.medicationStartedAt);
  }
  await scheduleWeeklyReflection(locale);
  await scheduleSymptomReminder(locale);
}

// Weekly nudge to log the body-recovery survey, so the trend actually builds.
// Wednesday 12:00 — spaced away from the Sunday reflection push.
export async function scheduleSymptomReminder(locale: 'ru' | 'en') {
  const t: T = (ru, en) => (locale === 'ru' ? ru : en);
  const now = Date.now();
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const daysToWed = (3 - d.getDay() + 7) % 7; // 3 = Wednesday
  d.setDate(d.getDate() + (daysToWed === 0 && d.getTime() <= now ? 7 : daysToWed));
  for (let w = 0; w < 8; w++) {
    const fire = new Date(d.getTime() + w * 7 * 86400_000);
    if (fire.getTime() <= now) continue;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t('Как самочувствие?', 'How are you feeling?'),
          body: t('Отметь за 40 секунд — посмотрим, как тело восстанавливается.', 'Log it in 40 seconds — see how your body is recovering.'),
          data: { url: '/symptoms' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire },
      });
    } catch {}
  }
}
