// Clinical helpers: Fagerström FTND, NRT dosing, taper plan.
// Sources: Heatherton et al. 1991 (FTND), USPSTF / NICE NRT guidelines.

export type FagOption = { label: string; score: number };
export type FagQ = { id: string; q: string; options: FagOption[] };

export const FAGERSTROM_RU: FagQ[] = [
  { id: 'q1', q: 'Когда после пробуждения ты выкуриваешь первую сигарету?',
    options: [
      { label: 'В первые 5 минут', score: 3 },
      { label: '6–30 минут', score: 2 },
      { label: '31–60 минут', score: 1 },
      { label: 'Позже часа', score: 0 },
    ] },
  { id: 'q2', q: 'Тебе сложно не курить там, где это запрещено (кино, церковь)?',
    options: [{ label: 'Да', score: 1 }, { label: 'Нет', score: 0 }] },
  { id: 'q3', q: 'От какой сигареты тебе труднее всего отказаться?',
    options: [{ label: 'От первой утренней', score: 1 }, { label: 'От любой другой', score: 0 }] },
  { id: 'q4', q: 'Сколько сигарет в день ты выкуриваешь?',
    options: [
      { label: '10 или меньше', score: 0 },
      { label: '11–20', score: 1 },
      { label: '21–30', score: 2 },
      { label: '31 и больше', score: 3 },
    ] },
  { id: 'q5', q: 'Чаще ли ты куришь утром, чем в течение остального дня?',
    options: [{ label: 'Да', score: 1 }, { label: 'Нет', score: 0 }] },
  { id: 'q6', q: 'Куришь ли ты, когда болеешь и лежишь в постели?',
    options: [{ label: 'Да', score: 1 }, { label: 'Нет', score: 0 }] },
];

export const FAGERSTROM_EN: FagQ[] = [
  { id: 'q1', q: 'How soon after waking do you smoke your first cigarette?',
    options: [
      { label: 'Within 5 minutes', score: 3 },
      { label: '6–30 minutes', score: 2 },
      { label: '31–60 minutes', score: 1 },
      { label: 'After 60 minutes', score: 0 },
    ] },
  { id: 'q2', q: 'Hard not to smoke where forbidden (cinema, church)?',
    options: [{ label: 'Yes', score: 1 }, { label: 'No', score: 0 }] },
  { id: 'q3', q: 'Which cigarette would you most hate to give up?',
    options: [{ label: 'First in the morning', score: 1 }, { label: 'Any other', score: 0 }] },
  { id: 'q4', q: 'Cigarettes per day?',
    options: [
      { label: '10 or fewer', score: 0 }, { label: '11–20', score: 1 },
      { label: '21–30', score: 2 }, { label: '31+', score: 3 },
    ] },
  { id: 'q5', q: 'Do you smoke more often in the first hours after waking than during the rest of the day?',
    options: [{ label: 'Yes', score: 1 }, { label: 'No', score: 0 }] },
  { id: 'q6', q: 'Do you smoke when ill enough to be in bed most of the day?',
    options: [{ label: 'Yes', score: 1 }, { label: 'No', score: 0 }] },
];

export function fagerstromBand(score: number): { level: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high'; ru: string; en: string; tipRu: string; tipEn: string } {
  if (score <= 2) return { level: 'very_low', ru: 'Очень низкая зависимость', en: 'Very low dependence',
    tipRu: 'Скорее всего НЗТ не нужна. Делай ставку на CBT и if-then планы.',
    tipEn: 'Probably no NRT needed. Lean on CBT and if-then plans.' };
  if (score <= 4) return { level: 'low', ru: 'Низкая зависимость', en: 'Low dependence',
    tipRu: 'НЗТ опционально (жвачка/леденцы 2 мг при тяге). Главное — техники.',
    tipEn: 'NRT optional (2 mg gum/lozenge as-needed). Main: techniques.' };
  if (score <= 6) return { level: 'moderate', ru: 'Умеренная зависимость', en: 'Moderate dependence',
    tipRu: 'Рекомендуется НЗТ: пластырь 14 мг + жвачка 2 мг при тяге. Обсуди с врачом.',
    tipEn: 'NRT recommended: 14 mg patch + 2 mg gum as-needed. Discuss with a clinician.' };
  if (score <= 7) return { level: 'high', ru: 'Высокая зависимость', en: 'High dependence',
    tipRu: 'НЗТ: пластырь 21 мг + жвачка/леденец 4 мг. Возможны варениклин/бупропион — к врачу.',
    tipEn: 'NRT: 21 mg patch + 4 mg gum/lozenge. Varenicline / bupropion possible — see a clinician.' };
  return { level: 'very_high', ru: 'Очень высокая зависимость', en: 'Very high dependence',
    tipRu: 'НЗТ комбинированная: пластырь 21 мг + быстрая форма 4 мг при тяге. Сильно поможет варениклин — к врачу.',
    tipEn: 'Combined NRT: 21 mg patch + fast 4 mg form on demand. Varenicline strongly helps — see a clinician.' };
}

export function nrtRecommendation(cigsPerDay: number, fagerstrom: number): { patch: string; rapid: string; notes: string[] } {
  // Patch dose by cigs/day (NICE/USPSTF)
  let patch = '14 мг (если просыпаешься спокойно) или 21 мг если фагерстрём ≥ 6';
  if (cigsPerDay <= 10) patch = '14 мг 24‑час пластырь, 6 нед; затем 7 мг 2 нед';
  else if (cigsPerDay <= 20) patch = '21 мг 24‑час пластырь, 6 нед; затем 14 мг 2 нед; затем 7 мг 2 нед';
  else patch = '21 мг + дополнительная быстрая форма 4 мг при тяге, 6 нед, затем step‑down';
  const rapid = fagerstrom >= 6 ? 'Жвачка/леденец 4 мг до 12 шт/день при тяге' : 'Жвачка/леденец 2 мг до 8 шт/день при тяге';
  return {
    patch, rapid,
    notes: [
      'Не кури с пластырем в первые 24 часа — побочки.',
      'Жуй жвачку медленно, держи 30 сек у щеки между жевками.',
      'Никогда не превышай суточную дозу.',
      'Это справочная информация — финальную схему согласуй с врачом.',
    ],
  };
}

export function taperPlan(startCigsPerDay: number, weeks: number): number[] {
  // Linear ramp from start → 0 over `weeks` weeks. Returns target/week (rounded).
  const out: number[] = [];
  for (let w = 1; w <= weeks; w++) {
    const target = Math.max(0, Math.round(startCigsPerDay * (1 - w / weeks)));
    out.push(target);
  }
  return out;
}

export const REPLACE_ACTIONS_RU = [
  'Стакан холодной воды залпом',
  'Холодная вода на запястья 30 секунд',
  '20 приседаний прямо сейчас',
  'Орех или семечки',
  'Кубик льда в рот',
  '4 минуты прогулки на улице',
  'Мятная жвачка',
  '10 медленных выдохов в 2 раза длиннее вдоха',
  'Эспандер 50 сжатий',
  'Душ контрастный 1 минута',
  'Позвонить близкому, сказать «я держусь»',
  'Чай с лимоном',
];

export const REPLACE_ACTIONS_EN = [
  'A glass of cold water in one go',
  'Cold water on your wrists for 30 seconds',
  '20 squats right now',
  'A nut or seeds',
  'An ice cube in the mouth',
  '4 minutes of outside walking',
  'A mint gum',
  '10 slow exhales twice longer than inhales',
  'Hand gripper × 50',
  'Cold-warm shower for 1 minute',
  'Call someone close, say "I\'m holding"',
  'Tea with lemon',
];
