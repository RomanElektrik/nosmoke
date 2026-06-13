// Подписка Бриз через ЮKassa — клиентская часть.
// Аккаунтов нет → анонимный deviceId. Платёж открывается ссылкой во внешнем
// браузере (без нативного SDK, работает через OTA), статус подтверждаем
// запросом к нашему серверу после возвращения в приложение.

import AsyncStorage from '@react-native-async-storage/async-storage';

const API = 'https://breezapp.ru/api/briz';
const DEVICE_KEY = 'briz_device_id_v1';

export type PlanId = 'monthly' | 'yearly' | 'lifetime';
export type BoundCard = { last4: string; type: string };
export type SubStatus = { premium: boolean; until: number; plan: PlanId | null; card?: BoundCard | null; autopay?: boolean };

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedId: string | null = null;
export async function getDeviceId(): Promise<string> {
  if (cachedId) return cachedId;
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id) { id = uuidv4(); await AsyncStorage.setItem(DEVICE_KEY, id); }
  cachedId = id;
  return id;
}

async function postJson(path: string, body: Record<string, unknown>): Promise<any> {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
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
    const r = await fetch(`${API}/sub/${deviceId}`);
    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    if (!j || typeof j.premium !== 'boolean' || typeof j.until !== 'number') return null;
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
