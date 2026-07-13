// Минимальная анонимная продукт-аналитика. Без сторонних SDK.
// Что собираем: СОБЫТИЯ ИСПОЛЬЗОВАНИЯ (открыл SOS, дочитал главу, взял триал…)
// по анонимному deviceId. Что НЕ собираем: имена, контакты, содержимое чатов,
// тексты дневника, здоровье — ничего личного. Это счётчики, не слежка.
//
// Схема: события копятся в локальной очереди (AsyncStorage, офлайн-first) и
// батчем уходят на наш сервер (/api/briz/events) при старте/фокусе/накоплении.
// Любая ошибка сети — молча, события ждут следующего флаша. Приложение НИКОГДА
// не тормозит и не падает из-за аналитики.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { getDeviceId } from './billing';

const API = 'https://breezapp.ru/api/briz/events';
const QUEUE_KEY = 'qs:analytics-queue:v1';
const MAX_QUEUE = 300;   // защита от бесконечного роста в вечном офлайне
const FLUSH_AT = 20;     // копим до N событий, потом шлём
const FLUSH_MS = 30_000; // …или не чаще раза в полминуты по таймеру

export type EventName =
  | 'app_open'
  | 'sos_open' | 'sos_win'
  | 'slip_logged' | 'status_holding'
  | 'chapter_read' | 'book_open'
  | 'chat_message' | 'call_start'
  | 'practice_open' | 'technique_open' | 'audio_play'
  | 'paywall_view' | 'trial_start' | 'purchase_success' | 'restore_success'
  | 'method_change' | 'restart_after_slip'
  | 'onboarding_done';

type Ev = { n: EventName; ts: number; p?: Record<string, string | number | boolean> };

let queue: Ev[] | null = null;
let flushing = false;
let lastFlush = 0;
let loaded: Promise<void> | null = null;

async function ensureLoaded() {
  if (queue) return;
  if (!loaded) {
    loaded = AsyncStorage.getItem(QUEUE_KEY).then((raw) => {
      if (!queue) queue = raw ? (JSON.parse(raw) as Ev[]) : [];
    }).catch(() => { queue = queue ?? []; });
  }
  await loaded;
}

async function persist() {
  try { await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue ?? [])); } catch {}
}

async function flush(force = false) {
  if (flushing) return;
  await ensureLoaded();
  const q = queue!;
  if (q.length === 0) return;
  if (!force && q.length < FLUSH_AT && Date.now() - lastFlush < FLUSH_MS) return;
  flushing = true;
  const batch = q.slice(0, 100);
  try {
    const deviceId = await getDeviceId();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, platform: Platform.OS, events: batch }),
        signal: ctrl.signal,
      });
      if (r.ok) {
        queue = q.slice(batch.length);
        lastFlush = Date.now();
        await persist();
      }
    } finally { clearTimeout(timer); }
  } catch {} finally { flushing = false; }
}

// Публичный API: одно синхронное на вид «выстрелил и забыл».
export function track(n: EventName, p?: Ev['p']) {
  void (async () => {
    try {
      await ensureLoaded();
      queue!.push({ n, ts: Date.now(), ...(p ? { p } : {}) });
      if (queue!.length > MAX_QUEUE) queue = queue!.slice(-MAX_QUEUE);
      await persist();
      await flush();
    } catch {}
  })();
}

// Дожимаем очередь при возвращении в приложение (и один раз на старте).
let wired = false;
export function initAnalytics() {
  if (wired) return;
  wired = true;
  track('app_open');
  AppState.addEventListener('change', (s) => { if (s === 'active') void flush(true); });
}
