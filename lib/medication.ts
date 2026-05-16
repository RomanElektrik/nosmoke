// Per-dose medication schedule generator + adherence helpers.
// Sources:
// • Cytisine (Tabex) — Sopharma manufacturer instruction (Walker NEJM 2014).
// • Bupropion SR — FDA Zyban label.
// • Varenicline — FDA Chantix label.

import type { AppState } from './storage';

export type Medication = 'cytisine' | 'bupropion' | 'varenicline';

// ─── Safety information per medication ──────────────────────────────────────
// Sources: Sopharma Tabex SmPC; FDA Zyban label; FDA Chantix label;
// NICE NG209; РФ инструкции по применению.
export type MedSafety = {
  nameRu: string;
  nameEn: string;
  rxRequired: boolean;          // true = prescription needed
  rxNoteRu: string;
  rxNoteEn: string;
  contraindicationsRu: string[]; // hard stops — must NOT take
  contraindicationsEn: string[];
  sideEffectsRu: string[];
  sideEffectsEn: string[];
  warningRu: string;            // single most important warning
  warningEn: string;
};

export const MED_SAFETY: Record<Medication, MedSafety> = {
  cytisine: {
    nameRu: 'Цитизин (Табекс)', nameEn: 'Cytisine (Tabex)',
    rxRequired: false,
    rxNoteRu: 'В России продаётся без рецепта, но перед приёмом всё равно стоит проконсультироваться с врачом или фармацевтом.',
    rxNoteEn: 'OTC in Russia, but still consult a doctor or pharmacist before starting.',
    contraindicationsRu: [
      'Беременность или грудное вскармливание',
      'Перенесённый инфаркт, нестабильная стенокардия, тяжёлые аритмии',
      'Выраженный атеросклероз, недавний инсульт',
      'Возраст младше 18 лет',
      'Аллергия на цитизин',
    ],
    contraindicationsEn: [
      'Pregnancy or breastfeeding',
      'Recent heart attack, unstable angina, severe arrhythmia',
      'Severe atherosclerosis, recent stroke',
      'Age under 18',
      'Allergy to cytisine',
    ],
    sideEffectsRu: ['Сухость во рту', 'Тошнота, изменение вкуса', 'Лёгкая головная боль', 'Раздражительность', 'Повышение давления, учащённый пульс'],
    sideEffectsEn: ['Dry mouth', 'Nausea, altered taste', 'Mild headache', 'Irritability', 'Raised blood pressure, faster heart rate'],
    warningRu: 'При болезнях сердца и сосудов принимать только после консультации с врачом.',
    warningEn: 'With heart or vascular disease, take only after consulting a doctor.',
  },
  bupropion: {
    nameRu: 'Бупропион (Велбутрин/Зибан)', nameEn: 'Bupropion (Wellbutrin/Zyban)',
    rxRequired: true,
    rxNoteRu: 'Рецептурный препарат. Назначает только врач — он же подбирает дозу и проверяет совместимость.',
    rxNoteEn: 'Prescription only. A doctor must prescribe it, choose the dose and check interactions.',
    contraindicationsRu: [
      'Судороги или эпилепсия в анамнезе',
      'Расстройство пищевого поведения (анорексия, булимия)',
      'Резкий отказ от алкоголя или седативных препаратов',
      'Приём ингибиторов МАО за последние 14 дней',
      'Беременность или грудное вскармливание',
      'Биполярное расстройство, тяжёлая депрессия — только под контролем врача',
    ],
    contraindicationsEn: [
      'History of seizures or epilepsy',
      'Eating disorder (anorexia, bulimia)',
      'Abrupt withdrawal from alcohol or sedatives',
      'MAO inhibitors within the last 14 days',
      'Pregnancy or breastfeeding',
      'Bipolar disorder, severe depression — only under medical supervision',
    ],
    sideEffectsRu: ['Бессонница, сухость во рту', 'Снижает порог судорог', 'Тревога, возбуждение', 'Изменения настроения, мысли о самоповреждении', 'Головная боль, тошнота'],
    sideEffectsEn: ['Insomnia, dry mouth', 'Lowers seizure threshold', 'Anxiety, agitation', 'Mood changes, self-harm thoughts', 'Headache, nausea'],
    warningRu: 'Может вызывать перепады настроения, тревогу, в редких случаях — мысли о самоповреждении. При любых таких симптомах немедленно к врачу.',
    warningEn: 'May cause mood swings, anxiety and, rarely, self-harm thoughts. See a doctor immediately if any of these appear.',
  },
  varenicline: {
    nameRu: 'Варениклин (Чампикс)', nameEn: 'Varenicline (Chantix)',
    rxRequired: true,
    rxNoteRu: 'Рецептурный препарат. Назначает только врач — он же подбирает дозу и проверяет совместимость.',
    rxNoteEn: 'Prescription only. A doctor must prescribe it, choose the dose and check interactions.',
    contraindicationsRu: [
      'Беременность или грудное вскармливание',
      'Тяжёлая почечная недостаточность (доза снижается врачом)',
      'Психическое расстройство в анамнезе — только под контролем врача',
      'Возраст младше 18 лет',
      'Аллергия на варениклин',
    ],
    contraindicationsEn: [
      'Pregnancy or breastfeeding',
      'Severe kidney impairment (dose reduced by a doctor)',
      'History of psychiatric disorder — only under medical supervision',
      'Age under 18',
      'Allergy to varenicline',
    ],
    sideEffectsRu: ['Тошнота (частый эффект)', 'Яркие, необычные сны, бессонница', 'Головная боль', 'Изменения настроения, депрессия, тревога', 'Редко — мысли о самоповреждении'],
    sideEffectsEn: ['Nausea (common)', 'Vivid, unusual dreams, insomnia', 'Headache', 'Mood changes, depression, anxiety', 'Rarely — self-harm thoughts'],
    warningRu: 'Может влиять на настроение и поведение. При подавленности, тревоге или мыслях о самоповреждении прекрати приём и сразу обратись к врачу.',
    warningEn: 'May affect mood and behaviour. If you feel depressed, anxious or have self-harm thoughts, stop and contact a doctor immediately.',
  },
};

export type ScheduledDose = {
  doseNumber: number;        // 1..N for the day
  totalDoses: number;        // N
  hour: number;              // 0–23
  minute: number;            // 0–59
  noteRu?: string;
  noteEn?: string;
};

// Returns dose plan for a given day (1-based) of the medication course.
// Anchor — usually 08:00 morning.
export function dosesForDay(med: Medication, dayNumber: number, startHour = 8): ScheduledDose[] {
  if (med === 'cytisine') {
    // Sopharma Tabex manufacturer schedule (1.5 mg tablets):
    // d1-3: 1 tab × 6/day (every 2h)
    // d4-12: 1 tab × 5/day (every 2.5h)
    // d13-16: 1 tab × 4/day (every 3h)
    // d17-20: 1 tab × 3/day (every 5h)
    // d21-25: 1-2 tab/day
    let count = 6, interval = 2;
    if (dayNumber >= 21) { count = 2; interval = 6; }
    else if (dayNumber >= 17) { count = 3; interval = 5; }
    else if (dayNumber >= 13) { count = 4; interval = 3; }
    else if (dayNumber >= 4) { count = 5; interval = 2.5; }
    return Array.from({ length: count }).map((_, i) => {
      const totalMinutes = startHour * 60 + Math.round(i * interval * 60);
      return {
        doseNumber: i + 1, totalDoses: count,
        hour: Math.floor(totalMinutes / 60) % 24,
        minute: totalMinutes % 60,
        noteRu: '1 таблетка с водой',
        noteEn: '1 tablet with water',
      };
    });
  }

  if (med === 'bupropion') {
    // FDA Zyban label:
    // d1-3: 150 mg ×1 morning
    // d4+: 150 mg ×2/day, ≥8h apart, second dose by 17:00
    if (dayNumber <= 3) {
      return [{
        doseNumber: 1, totalDoses: 1, hour: startHour, minute: 0,
        noteRu: '150 мг утром после еды',
        noteEn: '150 mg morning after food',
      }];
    }
    return [
      { doseNumber: 1, totalDoses: 2, hour: startHour, minute: 0,
        noteRu: '150 мг утром после еды', noteEn: '150 mg morning after food' },
      { doseNumber: 2, totalDoses: 2, hour: 16, minute: 0,
        noteRu: '150 мг — не позже 17:00 (бессонница)', noteEn: '150 mg — no later than 5pm (insomnia)' },
    ];
  }

  if (med === 'varenicline') {
    // FDA Chantix label:
    // d1-3: 0.5 mg ×1
    // d4-7: 0.5 mg ×2/day
    // d8+: 1 mg ×2/day, after food, with water
    if (dayNumber <= 3) {
      return [{
        doseNumber: 1, totalDoses: 1, hour: startHour, minute: 0,
        noteRu: '0.5 мг после плотной еды + стакан воды',
        noteEn: '0.5 mg after a full meal + glass of water',
      }];
    }
    if (dayNumber <= 7) {
      return [
        { doseNumber: 1, totalDoses: 2, hour: startHour, minute: 0,
          noteRu: '0.5 мг утром после еды', noteEn: '0.5 mg morning after food' },
        { doseNumber: 2, totalDoses: 2, hour: 20, minute: 0,
          noteRu: '0.5 мг вечером после еды', noteEn: '0.5 mg evening after food' },
      ];
    }
    return [
      { doseNumber: 1, totalDoses: 2, hour: startHour, minute: 0,
        noteRu: '1 мг утром после плотной еды', noteEn: '1 mg morning after a full meal' },
      { doseNumber: 2, totalDoses: 2, hour: 20, minute: 0,
        noteRu: '1 мг вечером после плотной еды', noteEn: '1 mg evening after a full meal' },
    ];
  }

  return [];
}

// Day number on the medication course (1-based) for today.
export function medCourseDay(state: AppState): number {
  const startedAt = state.profile?.medicationStartedAt;
  if (!startedAt) return 1;
  return Math.floor((Date.now() - startedAt) / 86400_000) + 1;
}

// Adherence helpers
export function doseKey(date: string, doseNumber: number): string {
  return `${date}#${doseNumber}`;
}

export function isDoseTaken(state: AppState, date: string, doseNumber: number): boolean {
  return !!state.doseLogs?.find((d) => d.date === date && d.doseNumber === doseNumber);
}

export function todayDoses(state: AppState, lang: 'ru' | 'en' = 'ru'): { schedule: ScheduledDose[]; takenCount: number } {
  const med = state.profile?.medication;
  if (!med) return { schedule: [], takenCount: 0 };
  const day = medCourseDay(state);
  const schedule = dosesForDay(med, day);
  const today = new Date().toISOString().slice(0, 10);
  const takenCount = schedule.filter((d) => isDoseTaken(state, today, d.doseNumber)).length;
  return { schedule, takenCount };
}

// Adherence over last N days (for diary view).
export function adherenceLast7(state: AppState): { date: string; total: number; taken: number }[] {
  const out: { date: string; total: number; taken: number }[] = [];
  const med = state.profile?.medication;
  if (!med || !state.profile?.medicationStartedAt) return out;
  const startMs = state.profile.medicationStartedAt;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const courseDay = Math.floor((d.getTime() - new Date(startMs).setHours(0, 0, 0, 0)) / 86400_000) + 1;
    if (courseDay < 1) { out.push({ date: key, total: 0, taken: 0 }); continue; }
    const sched = dosesForDay(med, courseDay);
    const taken = sched.filter((s) => isDoseTaken(state, key, s.doseNumber)).length;
    out.push({ date: key, total: sched.length, taken });
  }
  return out;
}
