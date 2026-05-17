import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';

export type Trigger =
  | 'stress' | 'coffee' | 'alcohol' | 'after_meal' | 'driving' | 'social' | 'boredom';

export type Motivation =
  | 'health' | 'money' | 'family' | 'sport' | 'smell' | 'control' | 'faith';

export type QuitMethod = 'cold_turkey' | 'taper';

export type Archetype = 'anxious' | 'social' | 'habitual' | 'reward' | 'identity';

export type CravingLog = {
  ts: number;
  intensity: number; // 1..10
  trigger?: Trigger;
  outcome: 'resisted' | 'smoked';
  note?: string;
};

export type Profile = {
  yearsSmoked: number;
  cigsPerDay: number;
  cigsInPack: number;
  packPrice: number;       // in user currency, default RUB
  currency: string;        // 'RUB' | 'USD' | 'EUR' | ...
  type: 'cigarette' | 'vape' | 'iqos' | 'rolling';
  fagerstromScore?: number;
  triggers: Trigger[];
  motivations: Motivation[];
  method: QuitMethod;
  archetype?: Archetype;
  archetypeScores?: Record<Archetype, number>;
  quitDate: number;        // ms epoch — start of clean period
  faithEnabled: boolean;
  goalAmount?: number;     // savings goal
  goalLabel?: string;
  language?: 'ru' | 'en';
  onboardingComplete: boolean;
  openrouterKey?: string;
  openrouterModel?: string;
  wakeHour?: number;            // 0-23, used for morning hot-zone push
  themeId?: string;   // ThemeId from lib/theme — design style
  medication?: 'varenicline' | 'cytisine' | 'bupropion' | null;
  medicationStartedAt?: number;
  // Stepped-care
  currentStep?: StepLevel;
  stepEnteredAt?: number;
  commitmentMode?: CommitmentMode;
  checkInHour?: number;            // 0–23, daily evening check-in
  // Transition state (between attempts)
  pendingMethod?: StepLevel;       // chosen but not yet activated
  pendingQuitDate?: number;        // future date when new attempt starts
  pendingPrep?: { id: string; done: boolean }[];
  wantsToQuit?: 'yes' | 'unsure' | 'paused';
  methodHistory?: { stepId: StepLevel; startedAt: number; endedAt: number; slips: number; reason?: string }[];
  // Profiling deepened in onboarding
  whyQuit?: string;
  pastAttempts?: PastAttempt[];
  topExcuses?: Excuse[];
  importance?: number;             // 0–10
  confidence?: number;             // 0–10
  selfEfficacy?: number;           // 0–10
  committedAmount?: number;     // active deposit contract: money the user committed
  contractPartner?: string;
  // Health screening (P0 safety) — gates pharmacotherapy recommendations
  age?: number;
  healthFlags?: HealthFlag[];
  // Taper method: gradual reduction over N weeks to a full-quit target date
  taperWeeks?: number;
  taperTargetDate?: number; // ms epoch — planned full-quit day
};

export type HealthFlag =
  | 'pregnant'        // беременность / грудное вскармливание
  | 'seizures'        // судороги / эпилепсия
  | 'eating_disorder' // расстройство пищевого поведения
  | 'heart_disease'   // болезни сердца и сосудов
  | 'psychiatric'     // психическое расстройство в анамнезе
  | 'kidney';         // тяжёлые болезни почек

export type IfThenPlan = { id: string; ts: number; trigger: string; action: string };
export type ReframeEntry = { id: string; ts: number; thought: string; counter: string; replacement: string };

export type StepLevel = 'L1_behavioral' | 'L2_nrt_light' | 'L3_nrt_combo' | 'L4_pharma' | 'L5_intensive';
export type CommitmentMode = 'soft' | 'hardcore';
export type AttemptMethod = 'cold_turkey' | 'nrt' | 'varenicline' | 'cytisine' | 'bupropion' | 'ecig' | 'app' | 'other';
export type Excuse =
  | 'one_wont_hurt'    // одна не помешает
  | 'after_stress'     // после такого можно
  | 'monday'           // начну в понедельник
  | 'social'           // все вокруг курят
  | 'bored'            // от скуки
  | 'reward'           // я заслужил
  | 'event'            // праздник / поездка
  | 'too_hard'         // слишком тяжело
  | 'try_later'        // лучше позже
  | 'cant_alone';      // один не справлюсь

export type PastAttempt = {
  method: AttemptMethod;
  longestDays: number;
  trigger?: string;     // что вернуло
};

export type DailyCheckIn = {
  date: string;        // YYYY-MM-DD
  smoked: boolean;
  count?: number;
  trigger?: Trigger;
  note?: string;
  medTaken?: boolean;  // medication adherence (when on L2-L5)
};

export type AppState = {
  profile: Profile | null;
  cravings: CravingLog[];
  slips: number[];          // timestamps
  livesUsed: number;        // 3 lives per month
  lastLifeReset: number;
  ifThens: IfThenPlan[];
  reframes: ReframeEntry[];
  checkIns: DailyCheckIn[];
  chatHistory?: { role: 'user' | 'assistant'; content: string; ts: number }[]; // legacy
  chatHistories?: Partial<Record<'support' | 'analyze_slip' | 'daily_task', { role: 'user' | 'assistant'; content: string; ts: number }[]>>;
  doseLogs?: { date: string; doseNumber: number; takenAt: number }[];
  achievements?: Record<string, number>;       // achievement id → unlocked-at ms
};

const KEY = 'qs:state:v1';

const initial: AppState = {
  profile: null,
  cravings: [],
  slips: [],
  livesUsed: 0,
  lastLifeReset: Date.now(),
  ifThens: [],
  reframes: [],
  checkIns: [],
};

let cache: AppState | null = null;
const listeners = new Set<(s: AppState) => void>();

export async function loadState(): Promise<AppState> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? { ...initial, ...JSON.parse(raw) } : initial;
  } catch {
    cache = initial;
  }
  return cache!;
}

export async function saveState(next: AppState) {
  cache = next;
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l(next));
}

export async function update(mut: (s: AppState) => AppState) {
  const cur = await loadState();
  await saveState(mut(cur));
}

export function useAppState() {
  const [state, setState] = useState<AppState>(cache ?? initial);
  useEffect(() => {
    let mounted = true;
    loadState().then((s) => mounted && setState(s));
    const l = (s: AppState) => mounted && setState(s);
    listeners.add(l);
    return () => { mounted = false; listeners.delete(l); };
  }, []);
  const set = useCallback((mut: (s: AppState) => AppState) => update(mut), []);
  return [state, set] as const;
}

export async function reset() {
  cache = initial;
  await AsyncStorage.removeItem(KEY);
  listeners.forEach((l) => l(initial));
}
