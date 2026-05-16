// Stepped-care engine.
// Source: NICE NG209 (2023), WHO Tobacco Cessation Guidelines 2024,
// Cochrane Living Reviews 2023–2024, Wisconsin algorithm (Baker NTR 2011),
// Marlatt RP / Witkiewitz 2004 for relapse handling.

import type { AppState, StepLevel, Profile } from './storage';

export type StepSpec = {
  id: StepLevel;
  index: number;
  titleRu: string;
  titleEn: string;
  shortRu: string;
  shortEn: string;
  whyRu: string;
  whyEn: string;
  durationDays: number;
  evidenceRu: string;
  color: string;
};

export const STEPS: StepSpec[] = [
  {
    id: 'L1_behavioral', index: 1,
    titleRu: 'Поведенческие техники',
    titleEn: 'Behavioural only',
    shortRu: 'Дыхание, дневник, if-then',
    shortEn: 'Breathing, journal, if-then',
    whyRu: 'Низкая зависимость (Фагерстрём 0–2). Стартуем с самого мягкого: дыхание, скольжение по тяге, дневник. Без лекарств.',
    whyEn: 'Low dependence (Fagerström 0–2). Start gentle: breathing, urge surfing, journal. No meds.',
    durationDays: 28,
    evidenceRu: 'Cochrane Whittaker 2024 (mHealth RR 1.54)',
    color: '#5AC8FA',
  },
  {
    id: 'L2_nrt_light', index: 2,
    titleRu: 'Цитизин (Табекс)',
    titleEn: 'Cytisine (Tabex)',
    shortRu: 'Растительный препарат, без рецепта',
    shortEn: 'Plant alkaloid, OTC in many countries',
    whyRu: 'Умеренная зависимость (Фагерстрём 3–4) или первая неудача. Цитизин (Табекс) — растительный препарат, в России без рецепта. Курс 25 дней. По эффекту почти равен варениклину, в разы дешевле.',
    whyEn: 'Moderate dependence (Fagerström 3–4) or first failure. Cytisine (Tabex) — plant-derived, OTC in Russia. 25-day course. Nearly equal to varenicline, much cheaper.',
    durationDays: 25,
    evidenceRu: 'Walker NEJM 2014/2021 RAUORA — RR 2.21 vs плацебо',
    color: '#30D158',
  },
  {
    id: 'L3_nrt_combo', index: 3,
    titleRu: 'Бупропион (Велбутрин)',
    titleEn: 'Bupropion (Wellbutrin)',
    shortRu: 'Антидепрессант со снижением тяги',
    shortEn: 'Antidepressant lowering craving',
    whyRu: 'Сильная зависимость (Фагерстрём 5–6) или 2+ неудач. Бупропион SR — антидепрессант, снижающий тягу. По рецепту. 8 недель. Особенно хорош при сопутствующей депрессии.',
    whyEn: 'Heavy dependence (Fagerström 5–6) or 2+ failures. Bupropion SR — antidepressant lowering craving. Prescription. 8 weeks. Best when depression coexists.',
    durationDays: 56,
    evidenceRu: 'Cochrane Howes 2020 — RR 1.64 vs плацебо',
    color: '#FF9500',
  },
  {
    id: 'L4_pharma', index: 4,
    titleRu: 'Варениклин (Чампикс)',
    titleEn: 'Varenicline (Chantix)',
    shortRu: 'Самая эффективная монотерапия',
    shortEn: 'Most effective monotherapy',
    whyRu: 'Очень сильная зависимость (Фагерстрём 7+) или неудача на цитизине/бупропионе. Варениклин — самый эффективный препарат. По рецепту. 12 недель. Возможны яркие сны и тошнота — обычно проходят.',
    whyEn: 'Very heavy dependence (Fagerström 7+) or failed cytisine/bupropion. Varenicline — most effective drug. Prescription. 12 weeks. Vivid dreams and nausea possible — usually subside.',
    durationDays: 84,
    evidenceRu: 'EAGLES NEJM 2016; Cochrane 2023 — RR 2.32 vs плацебо',
    color: '#FF453A',
  },
  {
    id: 'L5_intensive', index: 5,
    titleRu: 'Варениклин 24 нед + терапия',
    titleEn: 'Varenicline 24 wk + therapy',
    shortRu: 'Расширенный курс + специалист',
    shortEn: 'Extended course + specialist',
    whyRu: 'Если ничего не помогло. Расширенный варениклин (24 недели вместо 12) + работа с психотерапевтом. Только через врача.',
    whyEn: 'If nothing else worked. Extended varenicline (24 weeks) + therapist work. Through a clinician only.',
    durationDays: 168,
    evidenceRu: 'Tonstad JAMA 2006 — extended varenicline снижает релапс ~25%',
    color: '#BF5AF2',
  },
];

export function getStep(id?: StepLevel): StepSpec {
  return STEPS.find((s) => s.id === id) ?? STEPS[0];
}

// Is pharmacotherapy off-limits for this user? (pregnancy = behavioural-only, first-line.)
export function pharmaBlocked(p?: Profile | null): boolean {
  return !!p?.healthFlags?.includes('pregnant');
}

// Wisconsin-style initial recommendation (Baker NTR 2011, simplified).
export function recommendStep(p: Profile): StepLevel {
  // Safety: during pregnancy / breastfeeding behavioural support is first-line.
  if (pharmaBlocked(p)) return 'L1_behavioral';

  const fager = p.fagerstromScore ?? 0;
  const failedColdTurkey = (p.pastAttempts ?? []).filter(a => a.method === 'cold_turkey').length;
  const failedNrt = (p.pastAttempts ?? []).filter(a => a.method === 'nrt').length;

  // Escalate by past failures.
  let base: number = fager <= 2 ? 1 : fager <= 4 ? 2 : fager <= 6 ? 3 : 4;
  if (failedColdTurkey >= 1 && base === 1) base = 2;
  if (failedNrt >= 2 && base < 4) base = 4;

  return STEPS[Math.max(0, Math.min(STEPS.length - 1, base - 1))].id;
}

export function nextStep(current: StepLevel): StepLevel | null {
  const s = STEPS.find((x) => x.id === current);
  if (!s) return null;
  const next = STEPS[s.index]; // STEPS[index] is the NEXT (since index is 1-based)
  return next ? next.id : null;
}

export function prevStep(current: StepLevel): StepLevel | null {
  const s = STEPS.find((x) => x.id === current);
  if (!s) return null;
  const prev = STEPS[s.index - 2];
  return prev ? prev.id : null;
}

// Should we suggest escalation? Tiered intensity: soft hint after 1 slip,
// strong prompt after 2, auto after 3. Marlatt RP + Wisconsin SCQuit.
export type Escalation = {
  yes: boolean;
  intensity: 'none' | 'soft' | 'medium' | 'auto';
  toStep?: StepLevel;
  reasonRu?: string;
  reasonEn?: string;
};

export function escalationSuggestion(state: AppState): Escalation {
  const cur = state.profile?.currentStep;
  if (!cur) return { yes: false, intensity: 'none' };
  let target = nextStep(cur);
  if (!target) return { yes: false, intensity: 'none' };
  // Pregnancy: never escalate into pharmacotherapy — keep behavioural.
  if (pharmaBlocked(state.profile) && target !== 'L1_behavioral') {
    return { yes: false, intensity: 'none' };
  }

  const now = Date.now();
  const since = state.profile?.stepEnteredAt ?? state.profile?.quitDate ?? now;
  const daysOnStep = Math.floor((now - since) / 86400_000);

  const slips7 = state.slips.filter((t) => t > now - 7 * 86400_000).length;
  const checkSmoked7 = state.checkIns.filter((c) => c.smoked && new Date(c.date).getTime() > now - 7 * 86400_000).length;
  const total = slips7 + checkSmoked7;

  if (total >= 3 || (daysOnStep >= 14 && total >= 2)) {
    return {
      yes: true, intensity: 'auto', toStep: target,
      reasonRu: '3+ срыва за неделю — текущий метод не держит. Поднимаем сильнее.',
      reasonEn: '3+ slips this week — current method isn’t enough. Stepping up.',
    };
  }
  if (total >= 2) {
    return {
      yes: true, intensity: 'medium', toStep: target,
      reasonRu: '2 срыва за неделю. Возможно, метод слабоват для тебя — попробуем сильнее?',
      reasonEn: '2 slips this week. Method may be too light — try a stronger one?',
    };
  }
  if (total >= 1) {
    return {
      yes: true, intensity: 'soft', toStep: target,
      reasonRu: 'Срыв был. Поговорим: остаться на этом методе или попробовать сильнее?',
      reasonEn: 'There was a slip. Stay on this method or try a stronger one?',
    };
  }
  return { yes: false, intensity: 'none' };
}

// Should we suggest deescalation? After full abstinence on current step's duration.
export function deescalationSuggestion(state: AppState): { yes: boolean; toStep?: StepLevel } {
  const cur = state.profile?.currentStep;
  if (!cur) return { yes: false };
  const target = prevStep(cur);
  if (!target) return { yes: false };

  const since = state.profile?.stepEnteredAt ?? Date.now();
  const daysOnStep = Math.floor((Date.now() - since) / 86400_000);
  const recentSlips = state.slips.filter((t) => t > since).length;

  const spec = getStep(cur);
  if (daysOnStep >= spec.durationDays && recentSlips === 0) {
    return { yes: true, toStep: target };
  }
  return { yes: false };
}

// Hardcore-mode check: should a slip reset the quit date?
export function shouldHardReset(state: AppState): boolean {
  return state.profile?.commitmentMode === 'hardcore';
}

// Preparation checklist per method.
export type PrepItem = { id: string; ru: string; en: string };

export function prepChecklist(stepId: StepLevel, faithEnabled = false): PrepItem[] {
  const common: PrepItem[] = [
    { id: 'remove_cigs',  ru: 'Убрать сигареты, зажигалки и пепельницы из дома и машины', en: 'Remove cigarettes, lighters and ashtrays from home and car' },
    { id: 'tell_someone', ru: 'Сказать одному близкому, что ты бросаешь', en: 'Tell one close person you are quitting' },
    { id: 'set_goal',     ru: 'Поставить цель в копилке', en: 'Set a goal in the jar' },
  ];
  if (stepId === 'L1_behavioral') {
    return [
      { id: 'ifthen_3',    ru: 'Сделать 3 if-then плана для топ-триггеров', en: 'Make 3 if-then plans for top triggers' },
      { id: 'breathing_practice', ru: 'Один раз пройти cyclic sighing — чтобы знать, как', en: 'Do cyclic sighing once — so you know how' },
      ...common,
    ];
  }
  if (stepId === 'L2_nrt_light') {
    return [
      { id: 'buy_tabex',     ru: 'Купить Табекс (цитизин) — без рецепта в аптеке', en: 'Buy Tabex (cytisine) — OTC at pharmacy' },
      { id: 'read_schema',   ru: 'Прочитать схему: дни 1–3 каждые 2 ч, дни 4–12 каждые 2.5 ч и т.д.', en: 'Read schedule: days 1–3 every 2h, days 4–12 every 2.5h, etc.' },
      { id: 'set_reminders', ru: 'Поставить напоминания на каждые 2 часа в первые 3 дня', en: 'Set reminders every 2h for the first 3 days' },
      { id: 'plan_quitday',  ru: 'Quit date — день 5. Подготовить себя именно к этой дате', en: 'Quit day = day 5. Prepare for this exact date' },
      ...common,
    ];
  }
  if (stepId === 'L3_nrt_combo') {
    return [
      { id: 'see_doctor',    ru: 'Записаться к врачу — нужен рецепт на бупропион (Велбутрин)', en: 'See a doctor — bupropion (Wellbutrin) is prescription' },
      { id: 'screen_seizure',ru: 'Сообщить врачу: судороги, расстройства пищевого поведения — противопоказания', en: 'Tell doctor: seizures, eating disorders are contraindications' },
      { id: 'get_rx_bup',    ru: 'Получить рецепт и купить препарат', en: 'Get prescription and buy the medication' },
      { id: 'read_bup',      ru: '150 мг утром 3 дня, потом 150 мг 2 раза в день. Quit date — день 8', en: '150 mg morning for 3 days, then 150 mg twice daily. Quit date day 8' },
      { id: 'no_late_dose',  ru: 'Вторую дозу не позже 17:00 — иначе бессонница', en: 'No second dose after 5pm — insomnia' },
      ...common,
    ];
  }
  if (stepId === 'L4_pharma') {
    return [
      { id: 'see_doctor_v',  ru: 'Записаться к врачу — нужен рецепт на варениклин (Чампикс)', en: 'See a doctor — varenicline (Chantix) is prescription' },
      { id: 'screen_psy',    ru: 'Скрининг депрессии/тревоги (если есть — обсудить с врачом)', en: 'Depression/anxiety screen (if present — discuss)' },
      { id: 'get_rx_v',      ru: 'Получить рецепт и купить варениклин', en: 'Get prescription and buy varenicline' },
      { id: 'titration_v',   ru: 'Титрование: 0.5 мг → 1 мг 2р/день. Quit date — день 8', en: 'Titration: 0.5 mg → 1 mg BID. Quit date day 8' },
      { id: 'eat_first',     ru: 'Принимать всегда после плотной еды + стакан воды', en: 'Always take after a full meal + a glass of water' },
      ...common,
    ];
  }
  if (stepId === 'L5_intensive') {
    return [
      { id: 'see_doctor_ext',ru: 'Записаться к врачу — обсудить расширенный курс варениклина 24 нед', en: 'See a doctor — discuss extended 24-week varenicline' },
      { id: 'find_therapist',ru: 'Найти психотерапевта (CBT-направление, 1 раз/нед)', en: 'Find a therapist (CBT-oriented, weekly)' },
      { id: 'get_rx_ext',    ru: 'Получить рецепт на полный 24-недельный курс', en: 'Get prescription for the full 24-week course' },
      { id: 'plan_24w',      ru: 'Запланировать 6 месяцев приёма + терапии', en: 'Plan 6 months of medication + therapy' },
      ...common,
    ];
  }
  return common;
}

// Suggest 3 alternative methods for the transition wizard, given the failed current step + Fagerström.
export function alternativesFor(currentStep: StepLevel | undefined, fager: number): StepLevel[] {
  const order: StepLevel[] = ['L1_behavioral', 'L2_nrt_light', 'L3_nrt_combo', 'L4_pharma', 'L5_intensive'];
  const curIdx = currentStep ? order.indexOf(currentStep) : -1;
  // Always include the immediate next step, then nearby strong options.
  const set = new Set<StepLevel>();
  if (curIdx + 1 < order.length) set.add(order[curIdx + 1]);
  if (fager >= 5) set.add('L3_nrt_combo');
  if (fager >= 7) set.add('L4_pharma');
  if (fager >= 8) set.add('L5_intensive');
  // Always offer combined NRT + behavioural as a baseline alternative.
  set.add('L2_nrt_light');
  // Drop current.
  if (currentStep) set.delete(currentStep);
  return Array.from(set).slice(0, 3);
}
