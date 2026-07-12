// Подписка Бриз через ЮKassa — клиентская часть.
// Аккаунтов нет → анонимный deviceId. Платёж открывается ссылкой во внешнем
// браузере (без нативного SDK, работает через OTA), статус подтверждаем
// запросом к нашему серверу после возвращения в приложение.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API = 'https://breezapp.ru/api/briz';
const DEVICE_KEY = 'briz_device_id_v1';

export type PlanId = 'monthly' | 'yearly' | 'lifetime';
export type BoundCard = { last4: string; type: string };
export type SubStatus = { premium: boolean; until: number; plan: PlanId | 'trial' | null; card?: BoundCard | null; autopay?: boolean; trialUsed?: boolean; trialActive?: boolean; renewPlan?: PlanId | null; account?: string | null };

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// deviceId живёт в Keychain (SecureStore) — в отличие от AsyncStorage он
// ПЕРЕЖИВАЕТ удаление приложения. Это закрывает сразу две дыры:
// 1) оплативший юзер после переустановки сохраняет тот же deviceId → сервер
//    сразу отдаёт его lifetime (иначе покупка терялась навсегда);
// 2) нельзя фармить бесконечные 7-дневные триалы через переустановку.
// Старый id из AsyncStorage мигрируется, чтобы не разлогинить текущих юзеров.
let cachedId: string | null = null;
export async function getDeviceId(): Promise<string> {
  if (cachedId) return cachedId;
  const secure = Platform.OS !== 'web';
  let id: string | null = null;
  if (secure) {
    try { id = await SecureStore.getItemAsync(DEVICE_KEY); } catch {}
  }
  if (!id) {
    id = await AsyncStorage.getItem(DEVICE_KEY); // миграция со старого хранилища
    if (!id) id = uuidv4();
    if (secure) {
      try { await SecureStore.setItemAsync(DEVICE_KEY, id); } catch {}
    }
  }
  // Дублируем в AsyncStorage как fallback (и единственное хранилище на web).
  try { await AsyncStorage.setItem(DEVICE_KEY, id); } catch {}
  cachedId = id;
  return id;
}

// Любой запрос — с таймаутом. Голый fetch без таймаута при зависшем соединении
// (сеть тупит / сервер холодный) НИКОГДА не резолвится: на старте это подвешивало
// весь рендер приложения — «вечное колёсико, вообще не грузит».
// Таймер живёт до конца чтения ТЕЛА (json), не только заголовков: сервер, отдавший
// заголовки и зависший на теле, иначе подвешивал бы клиент несмотря на abort.
async function fetchJsonTimeout(url: string, opts: RequestInit = {}, ms = 8000): Promise<{ ok: boolean; status: number; json: any }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, json: j };
  } finally {
    clearTimeout(timer);
  }
}

async function postJson(path: string, body: Record<string, unknown>): Promise<any> {
  const { ok, status, json } = await fetchJsonTimeout(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, 15000);
  if (!ok) throw new Error(json?.error || `HTTP ${status}`);
  return json;
}

// Начать пробный период С ПРИВЯЗКОЙ КАРТЫ (основной путь): сервер создаёт
// привязочный платёж на 1 ₽ (сразу возвращается), карта сохраняется для
// списания после 7 дней. Возвращает ссылку оплаты — дальше как обычная покупка:
// открываем браузер, после 3DS подтверждаем через confirmPayment(). plan — что
// спишется ПОСЛЕ триала (monthly/yearly).
export async function startTrialWithCard(plan: 'monthly' | 'yearly', email?: string): Promise<{ id?: string; confirmation_url?: string } & SubStatus> {
  const deviceId = await getDeviceId();
  // Может вернуть ссылку (нужно открыть браузер) ИЛИ статус без ссылки, если
  // сервер отказал по идемпотентности (уже премиум / триал использован).
  return postJson('/trial/bind', { deviceId, plan, email });
}

// Legacy: пробный без карты (старый путь, новый клиент использует
// startTrialWithCard). Оставлен на один релиз для совместимости.
export async function startTrial(): Promise<SubStatus> {
  const deviceId = await getDeviceId();
  return postJson('/trial/start', { deviceId });
}

// Создать платёж → вернуть ссылку оплаты ЮKassa и id платежа.
export async function createPayment(plan: PlanId, email?: string): Promise<{ id: string; confirmation_url: string }> {
  const deviceId = await getDeviceId();
  const j = await postJson('/pay/create', { deviceId, plan, email });
  if (!j.confirmation_url) throw new Error('no confirmation url');
  return { id: j.id, confirmation_url: j.confirmation_url };
}

// Подтвердить оплату (после возвращения из браузера).
export async function confirmPayment(paymentId: string): Promise<SubStatus> {
  const deviceId = await getDeviceId();
  return postJson('/confirm', { deviceId, paymentId });
}

// Проверить статус подписки (при запуске). Возвращает null на любой ошибке/
// неавторитетном ответе — чтобы НЕ стереть валидный локальный премиум.
export async function fetchSub(): Promise<SubStatus | null> {
  try {
    const deviceId = await getDeviceId();
    const { ok, json: j } = await fetchJsonTimeout(`${API}/sub/${deviceId}`, {}, 8000);
    if (!ok || !j || typeof j.premium !== 'boolean' || typeof j.until !== 'number') return null;
    return j;
  } catch {
    return null;
  }
}

// Восстановить покупку по email (другое устройство / переустановка).
export async function restorePurchase(email: string): Promise<SubStatus> {
  const deviceId = await getDeviceId();
  return postJson('/restore', { deviceId, email });
}

// Отвязать карту автопродления (требование ЮKassa — юзер может сам).
export async function unbindCard(): Promise<SubStatus> {
  const deviceId = await getDeviceId();
  return postJson('/unbind', { deviceId });
}

// Отвязать карту / остановить автопродление на этом устройстве (для рекуррента).
// Возврат денег — НЕ здесь: только по запросу на поддержку (вручную). Если возврат
// одобрят через ЮKassa — премиум снимется сам при следующей проверке статуса.
export async function cancelSubscription(): Promise<SubStatus> {
  const deviceId = await getDeviceId();
  return postJson('/forget', { deviceId });
}
