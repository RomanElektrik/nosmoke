// Identity layer — the heart of the «Бриз» positioning.
// Quitting isn't abstaining; it's becoming someone who doesn't smoke.
// These pure helpers turn `secondsClean` + archetype into identity copy,
// read by home, the slip screen, the plan result and the identity ritual.

import type { Archetype, Trigger, IfThenPlan, CravingLog } from './storage';

export type Lang = 'ru' | 'en';

// Russian plural picker (1 день / 2 дня / 5 дней). Moved here from
// app/(tabs)/index.tsx so home + identity copy share one source.
export function plural(n: number, forms: [string, string, string]): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
}

export type IdentityPhase = 'start' | 'd1_3' | 'd4_13' | 'd14_29' | 'd30_89' | 'd90';

export function identityPhase(secs: number): IdentityPhase {
  const d = Math.floor(secs / 86400);
  if (d < 1) return 'start';
  if (d <= 3) return 'd1_3';
  if (d <= 13) return 'd4_13';
  if (d <= 29) return 'd14_29';
  if (d <= 89) return 'd30_89';
  return 'd90';
}

const DAYS_RU: [string, string, string] = ['день', 'дня', 'дней'];

// The evolving hero identity statement, shown under the orb on home.
export function identityHeadline(secs: number, lang: Lang): string {
  const d = Math.floor(secs / 86400);
  const phase = identityPhase(secs);
  if (lang === 'ru') {
    const days = `${d} ${plural(d, DAYS_RU)}`;
    switch (phase) {
      case 'start':   return 'Сегодня ты выбираешь стать тем, кто не курит.';
      case 'd1_3':    return `Ты — человек, который не курит. Уже ${days}.`;
      case 'd4_13':   return `Это уже не попытка. Это ты — ${days} без сигарет.`;
      case 'd14_29':  return `Некурящий — это теперь про тебя. ${days}.`;
      case 'd30_89':  return `Ты тот, кто бросил. ${days} это доказывают.`;
      case 'd90':     return `Курение — больше не часть тебя. ${days} новой жизни.`;
    }
  }
  const days = d === 1 ? '1 day' : `${d} days`;
  switch (phase) {
    case 'start':   return "Today you choose to become someone who doesn't smoke.";
    case 'd1_3':    return `You're someone who doesn't smoke. ${days} now.`;
    case 'd4_13':   return `This isn't an attempt anymore. It's you — ${days} smoke-free.`;
    case 'd14_29':  return `Non-smoker is who you are now. ${days}.`;
    case 'd30_89':  return `You're someone who quit. ${days} prove it.`;
    case 'd90':     return `Smoking isn't part of you anymore. ${days} of a new you.`;
  }
}

// One identity sentence per archetype — additive to the existing coping tips.
const ARCHETYPE_IDENTITY: Record<Archetype, { ru: string; en: string }> = {
  anxious:  { ru: 'Ты учишься быть спокойным без сигареты.',          en: "You're learning to be calm without a cigarette." },
  social:   { ru: 'Ты — тот, кто остаётся собой в любой компании.',    en: "You're someone who stays yourself in any company." },
  habitual: { ru: 'Ты переписываешь свои автоматические привычки.',     en: "You're rewriting your automatic habits." },
  reward:   { ru: 'Ты находишь радость, которая не выгорает.',          en: "You're finding joy that doesn't burn out." },
  identity: { ru: 'Ты переопределяешь, кто ты есть.',                    en: "You're redefining who you are." },
};

export function archetypeIdentity(archetype: Archetype | undefined, lang: Lang): string {
  if (!archetype) return '';
  const a = ARCHETYPE_IDENTITY[archetype];
  return a ? (lang === 'ru' ? a.ru : a.en) : '';
}

// Shared trigger labels — used by /plans, SOS and the slip screen.
const TRIGGER_LABELS: Record<Trigger, { ru: string; en: string }> = {
  stress:     { ru: 'Стресс',       en: 'Stress' },
  coffee:     { ru: 'Кофе',         en: 'Coffee' },
  alcohol:    { ru: 'Алкоголь',     en: 'Alcohol' },
  after_meal: { ru: 'После еды',    en: 'After a meal' },
  driving:    { ru: 'За рулём',     en: 'Driving' },
  social:     { ru: 'Компания',     en: 'Social' },
  boredom:    { ru: 'Скука',        en: 'Boredom' },
};

export function triggerLabel(tg: Trigger, lang: Lang): string {
  const l = TRIGGER_LABELS[tg];
  return l ? (lang === 'ru' ? l.ru : l.en) : String(tg);
}

export const ALL_TRIGGERS: Trigger[] = [
  'stress', 'coffee', 'alcohol', 'after_meal', 'driving', 'social', 'boredom',
];

// Pick the most relevant if-then plan: the most recent plan whose category
// matches the user's most frequent recent trigger, else the latest plan.
// Shared by home and the SOS/craving screen so both surface the same plan.
export function relevantPlan(plans: IfThenPlan[], cravings: CravingLog[]): IfThenPlan | undefined {
  if (!plans.length) return undefined;
  const recent = cravings.slice(-12).map((c) => c.trigger).filter(Boolean) as Trigger[];
  const freq: Partial<Record<Trigger, number>> = {};
  for (const tg of recent) freq[tg] = (freq[tg] ?? 0) + 1;
  const top = (Object.keys(freq) as Trigger[]).sort((a, b) => (freq[b]! - freq[a]!))[0];
  const matched = top ? [...plans].reverse().find((p) => p.category === top) : undefined;
  return matched ?? plans[plans.length - 1];
}
