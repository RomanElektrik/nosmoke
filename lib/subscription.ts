// Subscription / entitlement layer — freemium with subscriptions.
// Uses RevenueCat (react-native-purchases). The SDK is loaded dynamically so
// the app keeps running in Expo Go or before the package is installed —
// in that case Premium simply stays off and the (free) core works fully.
//
// Setup needed before real purchases work:
//  1. npm install (pulls react-native-purchases — already in package.json)
//  2. RevenueCat dashboard: project + entitlement "premium" + 3 products
//     (monthly / annual / lifetime), grouped into an offering.
//  3. EXPO_PUBLIC_REVENUECAT_IOS_KEY / _ANDROID_KEY in env / eas.json.
//  4. A dev build (RevenueCat needs native code; not available in Expo Go).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const ENTITLEMENT = 'premium';
const CACHE_KEY = 'qs:premium:v1';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

export type PlanId = 'monthly' | 'annual' | 'lifetime';

export type PlanInfo = {
  id: PlanId;
  titleRu: string; titleEn: string;
  priceFallback: string;          // shown if the store is unavailable
  subRu: string; subEn: string;
  best?: boolean;
};

// Display catalogue. Real prices come from the store when available.
export const PLANS: PlanInfo[] = [
  { id: 'monthly',  titleRu: 'Месяц',    titleEn: 'Monthly',  priceFallback: '299 ₽',
    subRu: 'в месяц',          subEn: 'per month' },
  { id: 'annual',   titleRu: 'Год',      titleEn: 'Annual',   priceFallback: '1490 ₽',
    subRu: '≈124 ₽/мес · выгода 58%', subEn: '≈$1.7/mo · save 58%', best: true },
  { id: 'lifetime', titleRu: 'Навсегда', titleEn: 'Lifetime', priceFallback: '2490 ₽',
    subRu: 'разовая покупка',  subEn: 'one-time purchase' },
];

export const PREMIUM_FEATURES_RU = [
  'Безлимитный ИИ-помощник',
  'Полная библиотека техник и практик',
  'Аналитика и персональные инсайты',
  'Дневник приёма лекарств',
  'Программы и треки по методам',
  'Отдельный трек для вейпинга / IQOS',
  'Темы оформления',
];
export const PREMIUM_FEATURES_EN = [
  'Unlimited AI assistant',
  'Full library of techniques and practices',
  'Analytics and personal insights',
  'Medication diary',
  'Method programs and tracks',
  'Dedicated vaping / IQOS track',
  'Appearance themes',
];

// Free-tier daily limit for AI assistant messages.
export const FREE_AI_DAILY_LIMIT = 5;

let Purchases: any = null;
let premium = false;
let configured = false;
const listeners = new Set<(v: boolean) => void>();

function emit() { listeners.forEach((l) => l(premium)); }

function setPremium(v: boolean) {
  if (premium === v) return;
  premium = v;
  AsyncStorage.setItem(CACHE_KEY, v ? '1' : '0').catch(() => {});
  emit();
}

function applyCustomerInfo(info: any) {
  setPremium(!!info?.entitlements?.active?.[ENTITLEMENT]);
}

// Call once at app start.
export async function initPurchases() {
  // Optimistic: restore last known entitlement from cache so gated UI is correct
  // immediately, before the network round-trip.
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached === '1') { premium = true; emit(); }
  } catch {}

  try {
    // Indirect specifier so TS does not require the module at compile time
    // (it may not be installed yet / unavailable in Expo Go).
    const moduleName = 'react-native-purchases';
    const mod: any = await import(moduleName);
    Purchases = mod.default ?? mod;
    const key = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
    if (!key) return; // keys not configured yet — stay in free mode
    Purchases.configure({ apiKey: key });
    configured = true;
    Purchases.addCustomerInfoUpdateListener((info: any) => applyCustomerInfo(info));
    const info = await Purchases.getCustomerInfo();
    applyCustomerInfo(info);
  } catch {
    // SDK unavailable (Expo Go / not installed) — free mode, no crash.
  }
}

export function isPremium() { return premium; }
export function isStoreReady() { return configured; }

export function usePremium(): boolean {
  const [v, setV] = useState(premium);
  useEffect(() => {
    const l = (x: boolean) => setV(x);
    listeners.add(l);
    setV(premium);
    return () => { listeners.delete(l); };
  }, []);
  return v;
}

// Returns store packages keyed by our PlanId, or null if the store is unavailable.
export async function getPackages(): Promise<Record<PlanId, any> | null> {
  if (!configured || !Purchases) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const cur = offerings?.current;
    if (!cur) return null;
    const out: Partial<Record<PlanId, any>> = {};
    for (const pkg of cur.availablePackages ?? []) {
      const pid: string = pkg.identifier ?? '';
      const t: string = pkg.packageType ?? '';
      if (t === 'MONTHLY' || /month/i.test(pid)) out.monthly = pkg;
      else if (t === 'ANNUAL' || /annual|year/i.test(pid)) out.annual = pkg;
      else if (t === 'LIFETIME' || /life/i.test(pid)) out.lifetime = pkg;
    }
    return out as Record<PlanId, any>;
  } catch {
    return null;
  }
}

// Returns 'ok' | 'cancelled' | 'error'.
export async function purchasePackage(pkg: any): Promise<'ok' | 'cancelled' | 'error'> {
  if (!configured || !Purchases || !pkg) return 'error';
  try {
    const res = await Purchases.purchasePackage(pkg);
    applyCustomerInfo(res?.customerInfo);
    return 'ok';
  } catch (e: any) {
    if (e?.userCancelled) return 'cancelled';
    return 'error';
  }
}

export async function restorePurchases(): Promise<'ok' | 'error'> {
  if (!configured || !Purchases) return 'error';
  try {
    const info = await Purchases.restorePurchases();
    applyCustomerInfo(info);
    return 'ok';
  } catch {
    return 'error';
  }
}

// Dev-only: unlock Premium for testing without the store (guarded by __DEV__ at call site).
export async function devTogglePremium() {
  setPremium(!premium);
}
