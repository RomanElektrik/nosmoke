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
  // Some people mix (cigarettes + vape) — full set from onboarding; `type`
  // stays the primary one and keeps all existing copy/track logic working.
  types?: ('cigarette' | 'vape' | 'iqos' | 'rolling')[];
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
  goalEmoji?: string;      // chosen avatar emoji for the jar (default 🐷)
  goalPhoto?: string;      // optional photo uri for the goal avatar
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
  // Premium / subscription — local dev flag for testing premium states.
  // Real IAP entitlement (RevenueCat) will OR with this when wired.
  devPremium?: boolean;
  // Identity ritual: a short personal statement of who you're becoming
  // (e.g. «свободным», «здоровым отцом»). Shown in the hero / ritual.
  identityStatement?: string;
  // Preferred TTS voice id (see VOICES in lib/voice.ts) for the call & audio practices.
  voiceId?: string;
  // Personal SOS toolkit: ids of quick craving-busters the user picked as
  // "what works for me" (see lib/coping.ts). Shown as chips in the SOS screen.
  copingMethods?: string[];
  // "Why I'm quitting" board — personal reasons shown in SOS and mornings.
  // Stored as rich objects; legacy string[] is migrated by normalizeReasons().
  reasons?: (Reason | string)[];
  // Gentle in-app honesty check ("holding / smoked?") — last time we asked, so
  // we ask at most once every few days instead of nagging daily.
  lastStatusCheckAt?: number;
  // Long-term coach memory: durable facts distilled from chats (lib/aiMemory).
  aiFacts?: { text: string; ts: number }[];
  // «Письмо себе» — a time capsule written on a strong day, shown back in SOS
  // when the craving hits (Marlatt: motivation recall at the moment of risk).
  futureLetter?: { text: string; createdAt: number };
};

export type Reason = { text: string; emoji?: string; color?: string; photo?: string };

// Accepts legacy string[] or new Reason[] and always returns Reason[].
export function normalizeReasons(reasons?: (Reason | string)[]): Reason[] {
  if (!reasons) return [];
  return reasons.map((r) => (typeof r === 'string' ? { text: r } : r)).filter((r) => r.text?.trim());
}

// The onboarding asks «зачем бросаешь?» (motivations) but the «Почему я бросаю»
// board started empty — the answers never made it there. Seed reasons from
// motivations once, when the board has nothing of its own.
const MOTIVATION_REASONS: Record<Motivation, { emoji: string; ru: string; en: string; color: string }> = {
  health:  { emoji: '❤️', ru: 'Здоровье', en: 'My health', color: '#FF453A' },
  money:   { emoji: '💰', ru: 'Деньги — себе, а не дыму', en: 'Money for me, not smoke', color: '#30D158' },
  family:  { emoji: '👨‍👩‍👧', ru: 'Ради близких', en: 'For my family', color: '#FF9F0A' },
  sport:   { emoji: '🏃', ru: 'Форма и дыхание', en: 'Fitness and breath', color: '#0A84FF' },
  smell:   { emoji: '🌿', ru: 'Свежий запах и вкус', en: 'Fresh smell and taste', color: '#34D399' },
  control: { emoji: '🎯', ru: 'Контроль над собой', en: 'Being in control', color: '#BF5AF2' },
  faith:   { emoji: '🕊️', ru: 'Внутренняя свобода', en: 'Inner freedom', color: '#FF9500' },
};

export function seedReasonsFromMotivations(p: Profile): Reason[] | null {
  if (normalizeReasons(p.reasons).length > 0 || !p.motivations?.length) return null;
  const en = p.language === 'en';
  const seeded = p.motivations
    .map((m) => MOTIVATION_REASONS[m])
    .filter(Boolean)
    .map((r) => ({ text: en ? r.en : r.ru, emoji: r.emoji, color: r.color }));
  return seeded.length ? seeded : null;
}

export type HealthFlag =
  | 'pregnant'        // беременность / грудное вскармливание
  | 'seizures'        // судороги / эпилепсия
  | 'eating_disorder' // расстройство пищевого поведения
  | 'heart_disease'   // болезни сердца и сосудов
  | 'psychiatric'     // психическое расстройство в анамнезе
  | 'kidney';         // тяжёлые болезни почек

export type IfThenPlan = { id: string; ts: number; trigger: string; action: string; category?: Trigger };
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
  chatHistories?: Partial<Record<'support' | 'analyze_slip' | 'daily_task', { role: 'user' | 'assistant'; content: string; ts: number }[]>>; // legacy → migrated into `chats`
  chats?: ChatThread[];      // messenger-style threads, see migrateChats()
  doseLogs?: { date: string; doseNumber: number; takenAt: number }[];
  achievements?: Record<string, number>;       // achievement id → unlocked-at ms
  aiUsage?: { date: string; count: number };   // free-tier AI counter — resets daily
  symptoms?: SymptomLog[];                     // weekly body-recovery survey
  identityLog?: string[];                      // localDateKey[] of identity affirmations — never punishes
  tourV1Done?: boolean;                        // first-run in-app guided tour seen
};

// Messenger-style chat threads. Each thread has a persona (coach character)
// and keeps its own history; `mode` survives for legacy deep-links.
export type PersonaId = 'breeze' | 'pragmatic' | 'cbt' | 'drill';
export type ChatThread = {
  id: string;
  persona: PersonaId;
  mode: 'support' | 'analyze_slip' | 'daily_task';
  title?: string;            // auto: first ~40 chars of the first user message
  createdAt: number;
  updatedAt: number;
  messages: { role: 'user' | 'assistant'; content: string; ts: number }[];
  // Rolling summary of messages older than the live tail — lets a long
  // relationship stay in context without sending the whole history every turn
  // (lib/aiMemory summarizeOlderMessages). We send the last KEEP_TAIL messages
  // and rely on this summary for everything before; no absolute index is kept
  // (it would desync once messages are truncated to MAX_THREAD_MESSAGES).
  summary?: string;
};

export const MAX_CHAT_THREADS = 20;
export const MAX_THREAD_MESSAGES = 60;

export function newThreadId(): string {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// One-time: old per-mode chatHistories become legacy threads. The old field is
// kept (not written to anymore) so a rollback build still finds its data.
function migrateChats(s: AppState): AppState {
  if (s.chats || !s.chatHistories) return s.chats ? s : { ...s, chats: [] };
  const chats: ChatThread[] = [];
  for (const mode of ['support', 'analyze_slip', 'daily_task'] as const) {
    const msgs = s.chatHistories[mode];
    if (!msgs?.length) continue;
    const last = msgs[msgs.length - 1].ts || Date.now();
    chats.push({
      id: `legacy_${mode}`,
      persona: 'breeze',
      mode,
      title: msgs.find((m) => m.role === 'user')?.content.slice(0, 40),
      createdAt: msgs[0].ts || last,
      updatedAt: last,
      messages: msgs,
    });
  }
  return { ...s, chats };
}

// Weekly body recovery survey — visible proof that quitting works.
// New entries use a 0–10 scale (scale: 10); legacy entries were 1–5 and are
// доubled at display time. mood/craving axes added later — optional.
export type SymptomLog = {
  date: string;        // YYYY-MM-DD (local)
  ts: number;          // ms when submitted
  cough: number;       // higher = better
  breath: number;      // дыхание
  taste: number;       // вкус
  smell: number;       // запах
  sleep: number;       // сон
  energy: number;      // энергия
  mood?: number;       // настроение
  craving?: number;    // свобода от тяги (выше = тяга слабее)
  scale?: 10;          // present on new 0–10 entries; absent = legacy 1–5
};

// Normalize any stored symptom value to the 0–10 display scale.
export function symptomTo10(log: SymptomLog, v: number | undefined): number {
  if (v == null) return 0;
  return log.scale === 10 ? v : v * 2;
}

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
let loading: Promise<AppState> | null = null;
const listeners = new Set<(s: AppState) => void>();

export async function loadState(): Promise<AppState> {
  if (cache) return cache;
  // Memoize the in-flight read: _layout and every mounted screen's useAppState
  // race here on cold start — they must all share one AsyncStorage read.
  if (!loading) {
    loading = AsyncStorage.getItem(KEY)
      .then((raw) => (cache = migrateChats(raw ? { ...initial, ...JSON.parse(raw) } : initial)))
      .catch(() => (cache = initial));
  }
  return loading;
}

export async function saveState(next: AppState) {
  cache = next;
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l(next));
}

// Mutations are serialized through a promise queue: a bare read-modify-write
// loses concurrent updates (two callers read the same state, the second write
// erases the first — e.g. a logged slip silently disappearing).
let writeQueue: Promise<unknown> = Promise.resolve();

export function update(mut: (s: AppState) => AppState): Promise<void> {
  const job = writeQueue.then(async () => {
    const cur = await loadState();
    await saveState(mut(cur));
  });
  writeQueue = job.catch(() => {});
  return job;
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
  loading = null;
  await AsyncStorage.removeItem(KEY);
  listeners.forEach((l) => l(initial));
}
