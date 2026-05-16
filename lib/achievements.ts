// Achievements / badges — the "short reward loop" the app was missing.
// Inspired by Kwit / Smoke Free / QuitNow: many small milestones so there is
// always something close to unlock. Categories: time, money, health, cigs,
// engagement, recovery. The "recovery" badge rewards coming back after a slip —
// the app must never punish a lapse.

import type { AppState } from './storage';
import type { IconKey } from '../components/Icon';
import { secondsClean } from './health';
import { moneySaved, cigsAvoided } from './money';
import { checkInStreak } from './program';
import { getStep } from './stepped';

export type AchCategory = 'time' | 'money' | 'health' | 'cigs' | 'engagement' | 'recovery';

export type AchContext = {
  days: number;
  secs: number;
  money: number;
  currency: string;
  cigs: number;
  checkStreak: number;
  sosResisted: number;
  cravingsLogged: number;
  checkInsDone: number;
  stepIndex: number;
  hadSlip: boolean;
  goalReached: boolean;
};

export type Achievement = {
  id: string;
  category: AchCategory;
  icon: IconKey;
  color: string;
  titleRu: string; titleEn: string;
  descRu: string; descEn: string;
  // current value and target — progress = value/target, unlocked at >= 1
  value: (c: AchContext) => number;
  target: number;
};

export const CATEGORY_LABEL: Record<AchCategory, { ru: string; en: string }> = {
  time:       { ru: 'Время без сигарет', en: 'Smoke-free time' },
  money:      { ru: 'Деньги',            en: 'Money' },
  health:     { ru: 'Здоровье',          en: 'Health' },
  cigs:       { ru: 'Не выкурено',       en: 'Cigarettes avoided' },
  engagement: { ru: 'Вовлечённость',     en: 'Engagement' },
  recovery:   { ru: 'Преодоление',       en: 'Resilience' },
};

export const ACHIEVEMENTS: Achievement[] = [
  // ─── Time ───
  { id: 'd1',   category: 'time', icon: 'seedling', color: '#5AC8FA',
    titleRu: 'Первый шаг', titleEn: 'First step',
    descRu: '1 день без сигарет', descEn: '1 smoke-free day',
    value: (c) => c.days, target: 1 },
  { id: 'd7',   category: 'time', icon: 'leaf', color: '#30D158',
    titleRu: 'Несгораемая неделя', titleEn: 'Solid week',
    descRu: '7 дней без сигарет', descEn: '7 smoke-free days',
    value: (c) => c.days, target: 7 },
  { id: 'd14',  category: 'time', icon: 'leaf', color: '#34C759',
    titleRu: 'Две недели силы', titleEn: 'Two strong weeks',
    descRu: '14 дней без сигарет', descEn: '14 smoke-free days',
    value: (c) => c.days, target: 14 },
  { id: 'd30',  category: 'time', icon: 'tree', color: '#34C759',
    titleRu: 'Месяц новой жизни', titleEn: 'A new month',
    descRu: '30 дней без сигарет', descEn: '30 smoke-free days',
    value: (c) => c.days, target: 30 },
  { id: 'd100', category: 'time', icon: 'star', color: '#FF9F0A',
    titleRu: 'Сто дней', titleEn: 'One hundred days',
    descRu: '100 дней без сигарет', descEn: '100 smoke-free days',
    value: (c) => c.days, target: 100 },
  { id: 'd180', category: 'time', icon: 'gem', color: '#BF5AF2',
    titleRu: 'Полгода свободы', titleEn: 'Half a year free',
    descRu: '180 дней без сигарет', descEn: '180 smoke-free days',
    value: (c) => c.days, target: 180 },
  { id: 'd365', category: 'time', icon: 'crown', color: '#FFD60A',
    titleRu: 'Год без дыма', titleEn: 'A smoke-free year',
    descRu: '365 дней без сигарет', descEn: '365 smoke-free days',
    value: (c) => c.days, target: 365 },

  // ─── Money ───
  { id: 'm1000',  category: 'money', icon: 'sparkle', color: '#30D158',
    titleRu: 'Первая тысяча', titleEn: 'First thousand',
    descRu: 'Сэкономлено 1000', descEn: 'Saved 1000',
    value: (c) => c.money, target: 1000 },
  { id: 'm5000',  category: 'money', icon: 'sparkle', color: '#30D158',
    titleRu: 'На что-то приятное', titleEn: 'Something nice',
    descRu: 'Сэкономлено 5000', descEn: 'Saved 5000',
    value: (c) => c.money, target: 5000 },
  { id: 'm20000', category: 'money', icon: 'gem', color: '#FF9F0A',
    titleRu: 'Серьёзная сумма', titleEn: 'A serious sum',
    descRu: 'Сэкономлено 20 000', descEn: 'Saved 20,000',
    value: (c) => c.money, target: 20000 },
  { id: 'mgoal',  category: 'money', icon: 'ribbon', color: '#FFD60A',
    titleRu: 'Цель достигнута', titleEn: 'Goal reached',
    descRu: 'Закрыта цель в копилке', descEn: 'A jar goal completed',
    value: (c) => (c.goalReached ? 1 : 0), target: 1 },

  // ─── Health (timeline milestones, in seconds) ───
  { id: 'h20m', category: 'health', icon: 'heart', color: '#FF453A',
    titleRu: 'Пульс в норме', titleEn: 'Pulse normal',
    descRu: '20 минут без сигарет', descEn: '20 minutes smoke-free',
    value: (c) => c.secs, target: 20 * 60 },
  { id: 'h8h',  category: 'health', icon: 'lung', color: '#5AC8FA',
    titleRu: 'Кислород вернулся', titleEn: 'Oxygen back',
    descRu: '8 часов без сигарет', descEn: '8 hours smoke-free',
    value: (c) => c.secs, target: 8 * 3600 },
  { id: 'h48h', category: 'health', icon: 'spark', color: '#FF9F0A',
    titleRu: 'Чувствую вкус', titleEn: 'Taste returns',
    descRu: '48 часов без сигарет', descEn: '48 hours smoke-free',
    value: (c) => c.secs, target: 48 * 3600 },
  { id: 'h2w',  category: 'health', icon: 'wind', color: '#5AC8FA',
    titleRu: 'Дышу легче', titleEn: 'Breathing easier',
    descRu: '2 недели без сигарет', descEn: '2 weeks smoke-free',
    value: (c) => c.secs, target: 14 * 86400 },
  { id: 'h1mo', category: 'health', icon: 'lung', color: '#30D158',
    titleRu: 'Лёгкие очищаются', titleEn: 'Lungs clearing',
    descRu: '1 месяц без сигарет', descEn: '1 month smoke-free',
    value: (c) => c.secs, target: 30 * 86400 },
  { id: 'h1y',  category: 'health', icon: 'heart', color: '#FF453A',
    titleRu: 'Сердце благодарит', titleEn: 'Heart thanks you',
    descRu: '1 год без сигарет', descEn: '1 year smoke-free',
    value: (c) => c.secs, target: 365 * 86400 },

  // ─── Cigarettes avoided ───
  { id: 'c100',  category: 'cigs', icon: 'flame', color: '#FF9500',
    titleRu: '−100 сигарет', titleEn: '−100 cigarettes',
    descRu: 'Не выкурено 100 сигарет', descEn: '100 cigarettes not smoked',
    value: (c) => c.cigs, target: 100 },
  { id: 'c500',  category: 'cigs', icon: 'flame', color: '#FF9500',
    titleRu: '−500 сигарет', titleEn: '−500 cigarettes',
    descRu: 'Не выкурено 500 сигарет', descEn: '500 cigarettes not smoked',
    value: (c) => c.cigs, target: 500 },
  { id: 'c1000', category: 'cigs', icon: 'shield', color: '#FF453A',
    titleRu: '−1000 сигарет', titleEn: '−1000 cigarettes',
    descRu: 'Не выкурено 1000 сигарет', descEn: '1000 cigarettes not smoked',
    value: (c) => c.cigs, target: 1000 },

  // ─── Engagement ───
  { id: 'streak7',  category: 'engagement', icon: 'bolt', color: '#FF9F0A',
    titleRu: 'На связи', titleEn: 'Staying in touch',
    descRu: '7 чек-инов подряд', descEn: '7 check-ins in a row',
    value: (c) => c.checkStreak, target: 7 },
  { id: 'streak30', category: 'engagement', icon: 'bolt', color: '#FF453A',
    titleRu: 'Железная дисциплина', titleEn: 'Iron discipline',
    descRu: '30 чек-инов подряд', descEn: '30 check-ins in a row',
    value: (c) => c.checkStreak, target: 30 },
  { id: 'sos10',    category: 'engagement', icon: 'feather', color: '#0A84FF',
    titleRu: 'Устоял', titleEn: 'Held the line',
    descRu: '10 раз справился с тягой через SOS', descEn: 'Resisted 10 cravings via SOS',
    value: (c) => c.sosResisted, target: 10 },
  { id: 'logs25',   category: 'engagement', icon: 'book', color: '#BF5AF2',
    titleRu: 'Знаю свои триггеры', titleEn: 'I know my triggers',
    descRu: '25 записей о тяге в дневнике', descEn: '25 craving entries logged',
    value: (c) => c.cravingsLogged, target: 25 },
  { id: 'step2',    category: 'engagement', icon: 'shieldStar', color: '#30D158',
    titleRu: 'Подбираю метод', titleEn: 'Tuning the method',
    descRu: 'Перешёл на более сильный метод', descEn: 'Moved to a stronger method',
    value: (c) => (c.stepIndex >= 2 ? 1 : 0), target: 1 },

  // ─── Recovery ───
  { id: 'comeback', category: 'recovery', icon: 'dove', color: '#5AC8FA',
    titleRu: 'Возвращение', titleEn: 'Comeback',
    descRu: 'Сорвался — и продолжил путь', descEn: 'Slipped — and kept going',
    value: (c) => (c.hadSlip ? 1 : 0), target: 1 },
];

export function buildContext(state: AppState, now: number = Date.now()): AchContext {
  const p = state.profile;
  const secs = p ? secondsClean(p.quitDate, now) : 0;
  const money = p ? moneySaved(p, secs) : 0;
  return {
    days: Math.floor(secs / 86400),
    secs,
    money,
    currency: p?.currency ?? 'RUB',
    cigs: p ? cigsAvoided(p, secs) : 0,
    checkStreak: checkInStreak(state),
    sosResisted: state.cravings.filter((c) => c.outcome === 'resisted').length,
    cravingsLogged: state.cravings.length,
    checkInsDone: state.checkIns.length,
    stepIndex: p?.currentStep ? getStep(p.currentStep).index : 1,
    hadSlip: state.slips.length > 0,
    goalReached: !!(p?.goalAmount && p.goalAmount > 0 && money >= p.goalAmount),
  };
}

export function achProgress(a: Achievement, c: AchContext): number {
  return Math.max(0, Math.min(1, a.value(c) / a.target));
}

export function isAchUnlocked(a: Achievement, c: AchContext): boolean {
  return a.value(c) >= a.target;
}

// Compares current state to stored achievements, returns ids unlocked since.
export function newlyUnlocked(state: AppState): string[] {
  const c = buildContext(state);
  const stored = state.achievements ?? {};
  return ACHIEVEMENTS.filter((a) => !stored[a.id] && isAchUnlocked(a, c)).map((a) => a.id);
}

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
