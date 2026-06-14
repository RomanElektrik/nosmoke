// Вход через Apple — личность для восстановления подписки (оплата остаётся
// в ЮKassa). Приложение получает identityToken от Apple и шлёт на наш сервер,
// тот проверяет его по ключам Apple и привязывает устройство к аккаунту.

import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getDeviceId, type SubStatus } from './billing';

const API = 'https://breezapp.ru/api/briz';
const ACCT_KEY = 'briz_account_v1';

export type Account = { provider: 'apple' | 'google'; email?: string | null };
export type AuthStatus = SubStatus & { account?: string | null };

export async function isAppleAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function getStoredAccount(): Promise<Account | null> {
  try {
    const v = await SecureStore.getItemAsync(ACCT_KEY);
    return v ? (JSON.parse(v) as Account) : null;
  } catch {
    return null;
  }
}

async function setStoredAccount(a: Account | null): Promise<void> {
  try {
    if (a) await SecureStore.setItemAsync(ACCT_KEY, JSON.stringify(a));
    else await SecureStore.deleteItemAsync(ACCT_KEY);
  } catch {}
}

// Войти через Apple. Бросает с code 'ERR_REQUEST_CANCELED', если юзер отменил.
export async function signInWithApple(): Promise<AuthStatus> {
  const cred = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  const identityToken = cred.identityToken;
  if (!identityToken) throw new Error('no identity token');
  const deviceId = await getDeviceId();
  const r = await fetch(`${API}/auth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, identityToken, email: cred.email || undefined }),
  });
  const j = await r.json().catch(() => ({} as any));
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  // Apple отдаёт email только при ПЕРВОМ входе; дальше берём с сервера.
  await setStoredAccount({ provider: 'apple', email: cred.email || j.account || null });
  return j as AuthStatus;
}

// Выйти: отвязать устройство от аккаунта (подписка остаётся на аккаунте).
export async function signOutAccount(): Promise<void> {
  try {
    const deviceId = await getDeviceId();
    await fetch(`${API}/auth/signout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    });
  } catch {}
  await setStoredAccount(null);
}
