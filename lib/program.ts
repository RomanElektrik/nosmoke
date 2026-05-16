// Critical-window program (first 14 days) + level system.
// Evidence: 50–75% of relapses happen in week 1; withdrawal peaks at day 3.
// Levels never reset on a slip — protects self-efficacy (Marlatt RP / AVE literature).

import type { AppState } from './storage';
import { secondsClean } from './health';
import type { IconKey } from '../components/Icon';

export type Level = {
  index: number;
  threshold: number; // seconds clean
  titleRu: string;
  titleEn: string;
  color: string;
  icon: IconKey;
};

export const LEVELS: Level[] = [
  { index: 0,  threshold: 0,               titleRu: 'Старт',       titleEn: 'Start',     color: '#9AA3AF', icon: 'seedling' },
  { index: 1,  threshold: 6 * 3600,        titleRu: 'Первый день', titleEn: 'First day', color: '#5AC8FA', icon: 'wave2' },
  { index: 2,  threshold: 1 * 86400,       titleRu: '24 часа',     titleEn: '24 hours',  color: '#0A84FF', icon: 'drop2' },
  { index: 3,  threshold: 3 * 86400,       titleRu: 'Пик пройден', titleEn: 'Peak past', color: '#FF9500', icon: 'flame' },
  { index: 4,  threshold: 7 * 86400,       titleRu: 'Неделя',      titleEn: 'One week',  color: '#FF9F0A', icon: 'bolt' },
  { index: 5,  threshold: 14 * 86400,      titleRu: 'Две недели',  titleEn: 'Two weeks', color: '#30D158', icon: 'leaf' },
  { index: 6,  threshold: 30 * 86400,      titleRu: 'Месяц',       titleEn: 'One month', color: '#34C759', icon: 'tree' },
  { index: 7,  threshold: 90 * 86400,      titleRu: 'Квартал',     titleEn: 'Quarter',   color: '#BF5AF2', icon: 'gem' },
  { index: 8,  threshold: 180 * 86400,     titleRu: 'Полгода',     titleEn: 'Half-year', color: '#FF2D55', icon: 'star' },
  { index: 9,  threshold: 365 * 86400,     titleRu: 'Год',         titleEn: 'One year',  color: '#FFD60A', icon: 'crown' },
  { index: 10, threshold: 365 * 2 * 86400, titleRu: 'Свобода',     titleEn: 'Freedom',   color: '#FFD60A', icon: 'dove' },
];

export function currentLevel(secs: number): Level {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (secs >= l.threshold) cur = l;
  return cur;
}

export function nextLevel(secs: number): Level | null {
  return LEVELS.find((l) => l.threshold > secs) ?? null;
}

export function levelProgress(secs: number): number {
  const cur = currentLevel(secs);
  const next = nextLevel(secs);
  if (!next) return 1;
  const span = next.threshold - cur.threshold;
  return span > 0 ? (secs - cur.threshold) / span : 1;
}

// First-14-days program. Each "day" carries a focus + science snippet + 1 task.
export type ProgramDay = {
  day: number;          // 1..14
  focusRu: string;
  focusEn: string;
  scienceRu: string;    // why this day matters, evidence-based
  scienceEn: string;
  taskRu: string;
  taskEn: string;
  practice?: string;    // route to /practice/[id] or /journal etc
};

export const PROGRAM: ProgramDay[] = [
  { day: 1,
    focusRu: 'Старт. Удержись 24 часа.',
    focusEn: 'Start. Hold for 24 hours.',
    scienceRu: 'Никотин с рецепторов сходит за ~10 часов. Самые сильные тяги — короткие волны 3–5 минут.',
    scienceEn: 'Nicotine clears the receptors in ~10h. Strongest cravings are 3–5 min waves.',
    taskRu: 'Урок дыхания «cyclic sighing». 5 минут.',
    taskEn: 'Cyclic sighing breath. 5 minutes.',
    practice: 'cyclic_sigh',
  },
  { day: 2,
    focusRu: 'Подготовь автопилот.',
    focusEn: 'Pre-load the autopilot.',
    scienceRu: 'Сила воли садится. If-then планы доказано работают, когда мозг устал (Armitage 2016).',
    scienceEn: 'Willpower drains. If-then plans work when the brain is tired (Armitage 2016).',
    taskRu: 'Создай 3 «Если триггер X → то действие Y».',
    taskEn: 'Write 3 "If trigger X → then action Y" plans.',
    practice: 'if_then',
  },
  { day: 3,
    focusRu: 'Пик абстиненции. Сегодня самый трудный.',
    focusEn: 'Peak withdrawal. Today is the hardest.',
    scienceRu: 'День 3 — пик симптомов. Это значит: после сегодня станет легче. Не ярлык, а биохимия.',
    scienceEn: 'Day 3 = symptom peak. After today it gets easier. Not a label — biochemistry.',
    taskRu: 'Замена ритуала: сделай прямо сейчас.',
    taskEn: 'Ritual replacement: do it right now.',
    practice: 'replace',
  },
  { day: 4,
    focusRu: 'Перепиши свои мысли.',
    focusEn: 'Rewrite your thoughts.',
    scienceRu: 'CBT-рефрейминг — золотой стандарт когнитивной части. Ловишь — оспариваешь — заменяешь.',
    scienceEn: 'CBT reframing is the cognitive gold standard. Catch — challenge — replace.',
    taskRu: 'Запиши одну мысль и переформулируй её.',
    taskEn: 'Log one thought and reframe it.',
    practice: 'reframe',
  },
  { day: 5,
    focusRu: 'Учись наблюдать тягу.',
    focusEn: 'Learn to observe the urge.',
    scienceRu: 'Urge surfing (Marlatt) — тяга это волна, не команда. Просто наблюдай.',
    scienceEn: 'Urge surfing (Marlatt) — a craving is a wave, not a command. Just observe.',
    taskRu: 'Прокати одну волну.',
    taskEn: 'Surf one wave.',
    practice: 'urge_surf',
  },
  { day: 6,
    focusRu: 'Заземление.',
    focusEn: 'Grounding.',
    scienceRu: '5-4-3-2-1 возвращает префронтальную кору в работу. Тяга питается мозгом, отключённым от тела.',
    scienceEn: '5-4-3-2-1 brings prefrontal cortex back online. Cravings feed on a body-disconnected mind.',
    taskRu: 'Пройди упражнение 5-4-3-2-1.',
    taskEn: 'Do the 5-4-3-2-1 exercise.',
    practice: 'grounding',
  },
  { day: 7,
    focusRu: 'Неделя без сигарет. Анализируй данные.',
    focusEn: 'One week clean. Read your data.',
    scienceRu: 'EMA-логи показывают паттерны лучше любой памяти. Где твои триггеры?',
    scienceEn: 'EMA logs show patterns better than memory. Where are your triggers?',
    taskRu: 'Открой дневник тяги — посмотри топ-триггеров.',
    taskEn: 'Open the craving journal — review top triggers.',
    practice: 'ema',
  },
  { day: 8,
    focusRu: 'HALT-чек как привычка.',
    focusEn: 'HALT as a daily habit.',
    scienceRu: 'Hungry / Angry / Lonely / Tired — часто настоящая нужда не в никотине.',
    scienceEn: 'Hungry / Angry / Lonely / Tired — the real need is often not nicotine.',
    taskRu: 'Пройди HALT.',
    taskEn: 'Run a HALT check.',
    practice: 'halt_check',
  },
  { day: 9,
    focusRu: 'Тренируй ум 10 минут.',
    focusEn: 'Train the mind 10 min.',
    scienceRu: 'RAIN-протокол снижает реактивность к триггерам. 10 минут раз в день.',
    scienceEn: 'RAIN protocol lowers trigger reactivity. 10 minutes once a day.',
    taskRu: 'Майндфулнес-сессия 10 минут.',
    taskEn: 'Mindfulness session 10 minutes.',
    practice: 'mindfulness',
  },
  { day: 10,
    focusRu: 'Деньги делай видимыми.',
    focusEn: 'Make the money visible.',
    scienceRu: 'Активные финансовые стимулы — Cochrane RR 1.49. Сухая «экономия» работает слабее.',
    scienceEn: 'Active incentives — Cochrane RR 1.49. Dry "savings" works weaker.',
    taskRu: 'Поставь цель в копилке.',
    taskEn: 'Set a goal in the jar.',
    practice: 'money',
  },
  { day: 11,
    focusRu: 'Социальный контракт.',
    focusEn: 'Social contract.',
    scienceRu: 'Скажи одному близкому. Социальная подотчётность утраивает шансы.',
    scienceEn: 'Tell one person close. Social accountability triples odds.',
    taskRu: 'Напиши близкому, что бросаешь.',
    taskEn: 'Text someone close that you are quitting.',
  },
  { day: 12,
    focusRu: 'Обнови if-then план.',
    focusEn: 'Refresh your if-then.',
    scienceRu: 'Триггеры смещаются. Раз в 2 недели обновляй план — иначе он устаревает.',
    scienceEn: 'Triggers shift. Refresh the plan every 2 weeks or it goes stale.',
    taskRu: 'Сделай 1 новый if-then на следующую неделю.',
    taskEn: 'Make 1 fresh if-then for next week.',
    practice: 'if_then',
  },
  { day: 13,
    focusRu: 'Лекарства — решение для трудных случаев.',
    focusEn: 'Medication — for tough cases.',
    scienceRu: 'Варениклин и цитизин — RR 2.33 и ~1.5 vs плацебо. Самый сильный медицинский рычаг.',
    scienceEn: 'Varenicline and cytisine: RR 2.33 and ~1.5 vs placebo. The strongest medical lever.',
    taskRu: 'Прочитай про препараты — обсуди с врачом, если нужно.',
    taskEn: 'Read about medications — discuss with a clinician if needed.',
    practice: 'pharma',
  },
  { day: 14,
    focusRu: '2 недели. Острая фаза позади.',
    focusEn: 'Two weeks. Acute phase done.',
    scienceRu: 'Симптомы абстиненции почти ушли. Дальше — поддержка и не дать срыву каскадом превратиться в полный возврат.',
    scienceEn: 'Withdrawal symptoms are almost gone. From here: maintenance, prevent slip-cascade.',
    taskRu: 'Запланируй 1 личный приз за достигнутое.',
    taskEn: 'Plan 1 personal reward for what you achieved.',
  },
  // -------- WEEKS 3-8 (CBT maintenance, evidence-based) --------
  { day: 15, focusRu: 'Перепрограммируй утро.', focusEn: 'Rewrite mornings.',
    scienceRu: 'Утренняя сигарета — пик связи кофе↔никотин. 5–10 мин дыхания до кофе разрывает ассоциацию.',
    scienceEn: 'Morning cigarette has the strongest cue link with coffee. 5–10 min breathing before coffee breaks it.',
    taskRu: 'Сделай дыхание ДО первой чашки кофе/чая.', taskEn: 'Do breathing BEFORE first coffee/tea.', practice: 'cyclic_sigh' },
  { day: 16, focusRu: 'Найди ловушки.', focusEn: 'Find your traps.',
    scienceRu: 'Открой дневник тяги — в каких ситуациях больше всего срывов? Это твои 80/20.',
    scienceEn: 'Open the journal — where do most slips happen? Those are your 80/20.',
    taskRu: 'Изучи топ-3 триггеров в дневнике.', taskEn: 'Review top-3 triggers in journal.', practice: 'ema' },
  { day: 17, focusRu: 'Контракт работает только публично.', focusEn: 'Contracts only work in public.',
    scienceRu: 'Tell-someone: социальное обязательство утраивает шансы (Cochrane Notley 2025, RR 1.49).',
    scienceEn: 'Telling someone triples your odds (Cochrane Notley 2025, RR 1.49).',
    taskRu: 'Напиши близкому: «Я бросаю. Я держусь N дней.»', taskEn: 'Text someone: "I quit. N days clean."', practice: 'money' },
  { day: 18, focusRu: 'Кофе без сигарет.', focusEn: 'Coffee without cigarettes.',
    scienceRu: 'Кофеин ↑ метаболизм никотина — но и тяга ↑. Половина чашки в первую неделю.',
    scienceEn: 'Caffeine speeds nicotine metabolism — but also boosts craving. Halve coffee for week 1.',
    taskRu: 'Один день без кофе — посмотри на тягу.', taskEn: 'One day no coffee — observe craving.' },
  { day: 19, focusRu: 'Тело хочет движения.', focusEn: 'Body craves movement.',
    scienceRu: '10 минут быстрой ходьбы снижают тягу как никотиновая жвачка (Taylor 2007).',
    scienceEn: '10 min brisk walk lowers craving as much as nicotine gum (Taylor 2007).',
    taskRu: '10 минут быстрой ходьбы при следующей тяге.', taskEn: '10-min brisk walk on the next craving.' },
  { day: 20, focusRu: 'Перепиши одну мысль.', focusEn: 'Rewrite one thought.',
    scienceRu: 'CBT-рефрейм за 5 минут в день — золотой стандарт когнитивной терапии.',
    scienceEn: 'CBT reframe 5 min/day is the cognitive gold standard.',
    taskRu: 'Сделай одну запись «мысль → факты → замена».', taskEn: 'Do one "thought → facts → swap".', practice: 'reframe' },
  { day: 21, focusRu: 'Три недели. Дофамин восстанавливается.', focusEn: '3 weeks. Dopamine resetting.',
    scienceRu: 'Рецепторы возвращают чувствительность. Простые удовольствия (вкус, музыка) — ярче.',
    scienceEn: 'Receptors regain sensitivity. Simple pleasures (taste, music) feel brighter.',
    taskRu: 'Назови 3 вещи, которые стали ярче.', taskEn: 'Name 3 things that feel sharper now.' },
  { day: 23, focusRu: 'Алкоголь — главная ловушка.', focusEn: 'Alcohol is the main trap.',
    scienceRu: 'Алкоголь снимает контроль префронтальной коры. Срыв в баре — самый частый. Готовься.',
    scienceEn: 'Alcohol disables prefrontal control. Bar slips are the #1 cause. Pre-plan.',
    taskRu: 'Сделай if-then «Если бар → то ___».', taskEn: 'Make an if-then "If bar → then ___".', practice: 'if_then' },
  { day: 25, focusRu: 'Стресс ≠ сигарета.', focusEn: 'Stress ≠ cigarette.',
    scienceRu: 'Никотин не снимает стресс — он лечит свой собственный отзыв. Через месяц без него стресса меньше (West 2017).',
    scienceEn: 'Nicotine does not relieve stress — it relieves its own withdrawal. After 1 month, baseline stress is lower (West 2017).',
    taskRu: 'Записывай уровень стресса 3 дня подряд.', taskEn: 'Log stress 3 days in a row.', practice: 'ema' },
  { day: 28, focusRu: 'Месяц без сигарет.', focusEn: 'One month clean.',
    scienceRu: 'Лёгкие очищаются, кашель уходит, выносливость +30%. Это медицинский факт, не комплимент.',
    scienceEn: 'Lungs clear, cough goes, endurance +30%. Medical fact, not a compliment.',
    taskRu: 'Купи себе небольшой подарок из копилки.', taskEn: 'Buy yourself a small gift from the jar.', practice: 'money' },
  { day: 31, focusRu: 'Обнови if-then.', focusEn: 'Refresh if-then.',
    scienceRu: 'Триггеры меняются: новые ситуации без сигареты. Старые планы могут устареть.',
    scienceEn: 'Triggers shift: new contexts without cigs. Old plans get stale.',
    taskRu: '2 новых сценария на следующие 2 недели.', taskEn: '2 new scripts for the next 2 weeks.', practice: 'if_then' },
  { day: 35, focusRu: '5 недель. Тренируй внимание.', focusEn: '5 weeks. Train attention.',
    scienceRu: '10 минут осознанности утром снижает реактивность к триггерам (Brewer 2018).',
    scienceEn: '10 min mindfulness lowers trigger reactivity (Brewer 2018).',
    taskRu: 'Майндфулнес 10 минут.', taskEn: 'Mindfulness 10 min.', practice: 'mindfulness' },
  { day: 40, focusRu: 'Проверь свои данные.', focusEn: 'Check your numbers.',
    scienceRu: 'Эпизоды тяги в журнале должны быть короче и реже. Если нет — пора поговорить с врачом про препараты.',
    scienceEn: 'Journal episodes should be shorter and rarer. If not — discuss meds with a clinician.',
    taskRu: 'Открой дневник, посмотри тренд.', taskEn: 'Open journal, check trend.', practice: 'ema' },
  { day: 45, focusRu: 'Не один — социальный круг.', focusEn: 'Not alone — social circle.',
    scienceRu: 'Курящее окружение — главный предиктор возврата. С кем ты проводишь больше времени — курят?',
    scienceEn: 'Smoking circle is the strongest relapse predictor. Who do you spend most time with?',
    taskRu: 'Один разговор с близким про границы.', taskEn: 'One conversation about boundaries.' },
  { day: 50, focusRu: 'Идентичность сменилась.', focusEn: 'Identity has shifted.',
    scienceRu: 'Через ~7 недель «я не курильщик» становится естественным самоопределением, а не борьбой.',
    scienceEn: 'After ~7 weeks "I’m a non-smoker" becomes natural, not a fight.',
    taskRu: 'Скажи это вслух себе в зеркало.', taskEn: 'Say it aloud to your mirror.' },
  { day: 56, focusRu: '8 недель. Курс пройден.', focusEn: '8 weeks. Course complete.',
    scienceRu: 'Это длина клинических курсов варениклина и НЗТ. Дальше — поддержка и редкие чек-ины.',
    scienceEn: 'This matches clinical varenicline & NRT courses. Maintenance from here.',
    taskRu: 'Закрой курс. Поставь новую цель в копилке.', taskEn: 'Close the course. Set a new jar goal.', practice: 'money' },
];

export const PROGRAM_TOTAL_DAYS = 56;

// Resolves today's day relative to the user's CURRENT method track.
export function programToday(state: AppState): {
  day: number;
  total: number;
  data: { focusRu: string; focusEn: string; scienceRu: string; scienceEn: string; taskRu: string; taskEn: string; practice?: string; medRu?: string; medEn?: string } | null;
} {
  if (!state.profile) return { day: 0, total: PROGRAM_TOTAL_DAYS, data: null };
  const stepId = state.profile.currentStep;
  // Lazy import to avoid circular
  const { getTrack, trackDay } = require('./tracks');
  const tr = getTrack(stepId);
  const secs = secondsClean(state.profile.quitDate);
  const day = Math.min(tr.totalDays, Math.floor(secs / 86400) + 1);
  return { day, total: tr.totalDays, data: trackDay(stepId, day) };
}

export function inCriticalWindow(state: AppState): boolean {
  if (!state.profile) return false;
  const secs = secondsClean(state.profile.quitDate);
  return secs < 56 * 86400;
}

// Cravings the user successfully resisted — used to reinforce self-efficacy after a slip.
export function cravingsSurvived(state: AppState): number {
  return state.cravings.filter((c) => c.outcome === 'resisted').length;
}

// Consecutive "no-smoke" daily check-ins ending today (or yesterday if today not yet logged).
export function checkInStreak(state: AppState): number {
  const checkIns = [...state.checkIns].sort((a, b) => a.date.localeCompare(b.date));
  if (checkIns.length === 0) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = checkIns.find((c) => c.date === key);
    if (!entry) {
      // missing day — only allowed for today (haven't checked in yet)
      if (i === 0) continue;
      break;
    }
    if (entry.smoked) break;
    streak++;
  }
  return streak;
}

export type ProgramPhase = 'critical' | 'maintenance' | 'graduated';

export function programPhase(state: AppState): ProgramPhase {
  if (!state.profile) return 'critical';
  const secs = secondsClean(state.profile.quitDate);
  const days = Math.floor(secs / 86400);
  const slips14 = state.slips.filter((t) => t > Date.now() - 14 * 86400_000).length;
  if (days >= 56 && slips14 === 0) return 'graduated';
  if (days >= 14) return 'maintenance';
  return 'critical';
}

// Generates a fallback program day for sparse 15-56 region.
export function getOrSynthDay(day: number, lang: 'ru' | 'en' = 'ru'): ProgramDay {
  const exact = PROGRAM.find((d) => d.day === day);
  if (exact) return exact;
  // Use the closest preceding day's content if present, else synthesize.
  const prev = [...PROGRAM].reverse().find((d) => d.day < day);
  if (prev) return prev;
  return {
    day,
    focusRu: 'Удерживай курс.',
    focusEn: 'Hold the course.',
    scienceRu: 'Каждый день без сигарет — это новое нейронное поведение, которое закрепляется.',
    scienceEn: 'Every smoke-free day is a new behavioural pattern getting wired in.',
    taskRu: 'Сделай чек-ин дня.',
    taskEn: 'Do today’s check-in.',
  };
}

// Method-specific daily focus override.
// Returns extra context that complements the generic ProgramDay based on what
// the user is actually doing (taking a patch, taking varenicline, etc.).
import type { StepLevel } from './storage';
export function methodFocus(stepId: StepLevel | undefined, day: number, lang: 'ru' | 'en'): { titleRu: string; titleEn: string; lineRu: string; lineEn: string } | null {
  if (!stepId) return null;
  if (stepId === 'L1_behavioral') {
    return {
      titleRu: 'Только поведение',
      titleEn: 'Behavioural only',
      lineRu: 'Сегодня — техника. Дыхание утром, if-then на главный триггер, чек-ин вечером.',
      lineEn: 'Today — technique. Morning breathing, if-then on top trigger, evening check-in.',
    };
  }
  if (stepId === 'L2_nrt_light') {
    return {
      titleRu: 'НЗТ + поведение',
      titleEn: 'NRT + behaviour',
      lineRu: day <= 7
        ? 'Первая неделя пластыря/жвачки. Не пропускай — иначе теряешь смысл.'
        : 'Поддерживай дозу. Жвачка/леденец — только при настоящей тяге, не для удовольствия.',
      lineEn: day <= 7
        ? 'First week of patch/gum. Don’t skip — otherwise pointless.'
        : 'Hold the dose. Gum/lozenge — only on real craving, not for pleasure.',
    };
  }
  if (stepId === 'L3_nrt_combo') {
    return {
      titleRu: 'Комбинированная НЗТ',
      titleEn: 'Combined NRT',
      lineRu: day <= 14
        ? `Пластырь 21 мг каждое утро + быстрая форма по требованию. День ${day} из 42.`
        : day <= 28
          ? 'Снижение: 14 мг. Быстрая форма всё ещё под рукой.'
          : 'Завершение: 7 мг или ничего. Психологическое отвыкание.',
      lineEn: day <= 14
        ? `21 mg patch every morning + fast form on demand. Day ${day} of 42.`
        : day <= 28
          ? 'Step-down: 14 mg. Fast form still on hand.'
          : 'Finish: 7 mg or none. Psychological wean.',
    };
  }
  if (stepId === 'L4_pharma') {
    return {
      titleRu: 'Цитизин или бупропион',
      titleEn: 'Cytisine or bupropion',
      lineRu: day <= 25
        ? `Цитизин курс — день ${day} из 25. Принимай строго по схеме.`
        : 'Курс цитизина окончен — продолжай поведенческий блок и if-then.',
      lineEn: day <= 25
        ? `Cytisine course — day ${day} of 25. Take strictly per schedule.`
        : 'Cytisine course done — keep behavioural block and if-then.',
    };
  }
  if (stepId === 'L5_intensive') {
    return {
      titleRu: 'Варениклин + интенсив',
      titleEn: 'Varenicline + intensive',
      lineRu: day <= 7
        ? `Титрация: 0.5 мг. День ${day}. Принимать с едой.`
        : day <= 84
          ? `Поддерживающая доза 1 мг 2 р/день. День ${day} из 84. Странные сны — норма.`
          : 'Курс 12 нед окончен. Поддерживающая фаза.',
      lineEn: day <= 7
        ? `Titration: 0.5 mg. Day ${day}. Take with food.`
        : day <= 84
          ? `Maintenance 1 mg BID. Day ${day} of 84. Vivid dreams are normal.`
          : '12-week course done. Maintenance phase.',
    };
  }
  return null;
}
