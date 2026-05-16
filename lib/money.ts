import type { Profile } from './storage';

export function pricePerCig(p: Pick<Profile, 'packPrice' | 'cigsInPack'>): number {
  return p.cigsInPack > 0 ? p.packPrice / p.cigsInPack : 0;
}

// Cigarettes that would have been smoked over `secs` seconds at the user's daily rate.
export function cigsAvoided(p: Pick<Profile, 'cigsPerDay'>, secs: number): number {
  return (p.cigsPerDay * secs) / 86400;
}

export function moneySaved(p: Pick<Profile, 'cigsPerDay' | 'packPrice' | 'cigsInPack'>, secs: number): number {
  return cigsAvoided(p, secs) * pricePerCig(p);
}

// CDC: each cigarette ~ 11 minutes of life lost.
export function lifeRegainedSeconds(p: Pick<Profile, 'cigsPerDay'>, secs: number): number {
  return cigsAvoided(p, secs) * 11 * 60;
}

export function formatMoney(amount: number, currency: string = 'RUB', locale: string = 'ru-RU'): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${Math.round(amount)} ${currency}`;
  }
}

export function formatDuration(secs: number, locale: 'ru' | 'en' = 'ru'): string {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (locale === 'en') {
    if (d >= 1) return `${d}d ${h}h`;
    if (h >= 1) return `${h}h ${m}m`;
    return `${m}m`;
  }
  if (d >= 1) return `${d} д ${h} ч`;
  if (h >= 1) return `${h} ч ${m} м`;
  return `${m} мин`;
}

// Live ticker D:H:M:S — updates visibly every second.
export function formatDurationLive(secs: number, locale: 'ru' | 'en' = 'ru'): string {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (d >= 1) {
    return locale === 'ru' ? `${d}д ${pad(h)}:${pad(m)}:${pad(s)}` : `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Money with adaptive precision.
export function formatMoneyLive(amount: number, currency = 'RUB', locale = 'ru-RU'): string {
  const fractionDigits = amount < 100 ? 2 : 0;
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits }).format(amount);
  } catch {
    return `${amount.toFixed(fractionDigits)} ${currency}`;
  }
}

// Cigarettes — show decimals until 10 so you see the counter move.
export function formatCigs(n: number): string {
  if (n < 10) return n.toFixed(1);
  return String(Math.floor(n));
}
