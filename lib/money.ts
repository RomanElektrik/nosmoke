import type { Profile } from './storage';

export function pricePerCig(p: Pick<Profile, 'packPrice' | 'cigsInPack'>): number {
  return p.cigsInPack > 0 ? p.packPrice / p.cigsInPack : 0;
}

type AvoidInput = Pick<Profile, 'cigsPerDay'> & Partial<Pick<Profile, 'method' | 'quitDate' | 'taperTargetDate'>>;

// Сигареты, которые человек НЕ выкурил за `secs` секунд.
//
// Резкий отказ — всё просто: полная дневная норма за всё время.
//
// Постепенное снижение — нет. Там человек по собственному плану приложения ещё
// курит, просто всё меньше: норма линейно едет от cigsPerDay до нуля к
// taperTargetDate (та же кривая, что рисует taperPlan в lib/clinical.ts).
// Считать всю норму «не выкуренной» — завышать вдвое: на 7-й день
// четырёхнедельного плана выходило «не выкурено 140» при реальных ~35.
// Не выкуренное за момент t = cigsPerDay · t/T, интеграл = cigsPerDay · t²/(2T).
export function cigsAvoided(p: AvoidInput, secs: number): number {
  const full = (p.cigsPerDay * secs) / 86400;
  if (p.method !== 'taper' || !p.taperTargetDate || !p.quitDate) return full;
  const totalSec = (p.taperTargetDate - p.quitDate) / 1000;
  if (!(totalSec > 0)) return full;
  const perSec = p.cigsPerDay / 86400;
  if (secs <= totalSec) return (perSec * secs * secs) / (2 * totalSec);
  // После целевой даты — половина за период снижения плюс полная норма дальше.
  return (perSec * totalSec) / 2 + perSec * (secs - totalSec);
}

export function moneySaved(p: AvoidInput & Pick<Profile, 'packPrice' | 'cigsInPack'>, secs: number): number {
  return cigsAvoided(p, secs) * pricePerCig(p);
}

// What the user used to spend on cigarettes per week — the natural anchor for
// a subscription price («год Премиума ≈ N недель курения»).
export function weeklySpend(p: Pick<Profile, 'cigsPerDay' | 'packPrice' | 'cigsInPack'>): number {
  return pricePerCig(p) * p.cigsPerDay * 7;
}

// How many weeks of the user's old smoking spend a given subscription price
// equals. Returns null when we can't compute (no spend data) so callers can
// hide the anchor rather than show a nonsensical «0 недель».
export function paybackWeeks(
  p: Pick<Profile, 'cigsPerDay' | 'packPrice' | 'cigsInPack'>,
  price: number,
): number | null {
  const wk = weeklySpend(p);
  if (wk <= 0 || price <= 0) return null;
  return price / wk;
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

function plural(n: number, forms: [string, string, string]): string {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1];
  return forms[2];
}

export function formatDuration(secs: number, locale: 'ru' | 'en' = 'ru'): string {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  // Long spans get humane units — «5000 д» reads like a bug,
  // «13 лет 8 мес» reads like a milestone.
  const years = Math.floor(d / 365);
  const months = Math.floor((d % 365) / 30);
  if (locale === 'en') {
    if (d >= 365) return months > 0 ? `${years}y ${months}mo` : `${years}y`;
    if (d >= 60) return `${Math.floor(d / 30)}mo`;
    if (d >= 7) return `${d}d`;
    if (d >= 1) return `${d}d ${h}h`;
    if (h >= 1) return `${h}h ${m}m`;
    return `${m}m`;
  }
  if (d >= 365) {
    const y = `${years} ${plural(years, ['год', 'года', 'лет'])}`;
    return months > 0 ? `${y} ${months} мес` : y;
  }
  if (d >= 60) return `${Math.floor(d / 30)} мес`;
  if (d >= 7) return `${d} дн`;
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
