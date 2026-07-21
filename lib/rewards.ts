// "What your savings buy" — turns an abstract money number into tangible
// rewards. Shows the next thing the saved money unlocks + a daily run-rate
// estimate of when. Currency-agnostic amounts (tuned for RUB by default).

export type Reward = { ru: string; en: string; amount: number; emoji: string };

// Ascending tiers. Суммы заданы в рублях — для других валют делим на курс
// (см. currencyScale): «кофе за 300» у англоязычного юзера превращалось в
// «you've saved enough for a good coffee» на 300 долларах, то есть порог
// достигался в сто раз позже и вся копилка выглядела сломанной.
export const REWARDS: Reward[] = [
  { ru: 'чашку хорошего кофе', en: 'a good coffee',        amount: 300,   emoji: '☕️' },
  { ru: 'поход в кино',        en: 'a movie night',         amount: 800,   emoji: '🎬' },
  { ru: 'новую книгу',         en: 'a new book',            amount: 1200,  emoji: '📚' },
  { ru: 'вкусный ужин',        en: 'a nice dinner',         amount: 2500,  emoji: '🍽️' },
  { ru: 'месяц подписок',      en: 'a month of subscriptions', amount: 4000, emoji: '🎧' },
  { ru: 'новые кроссовки',     en: 'new sneakers',          amount: 8000,  emoji: '👟' },
  { ru: 'выходные-вылазку',    en: 'a weekend getaway',     amount: 15000, emoji: '🏖️' },
  { ru: 'новый гаджет',        en: 'a new gadget',          amount: 30000, emoji: '📱' },
  { ru: 'отпуск',              en: 'a vacation',            amount: 80000, emoji: '✈️' },
];

// Грубый коэффициент к рублёвым порогам. Точность здесь не нужна: подписи вида
// «хватит на чашку кофе» — ориентир, а не прайс-лист.
const CURRENCY_SCALE: Record<string, number> = { RUB: 1, KZT: 0.2, BYN: 30, UAH: 2.4, USD: 90, EUR: 100 };
export function currencyScale(currency?: string): number {
  return CURRENCY_SCALE[(currency || 'RUB').toUpperCase()] ?? 1;
}

export type RewardProgress = {
  current: Reward | null;     // highest tier already covered
  next: Reward | null;        // next tier to reach
  remaining: number;          // money still needed for `next`
  daysToNext: number | null;  // estimate based on daily savings rate
  pct: number;                // progress toward next (0..1)
};

export function rewardProgress(saved: number, perDay: number, currency?: string): RewardProgress {
  const k = currencyScale(currency);
  const amt = (r: Reward) => r.amount / k;
  let current: Reward | null = null;
  let next: Reward | null = null;
  for (const r of REWARDS) {
    if (saved >= amt(r)) current = r;
    else { next = r; break; }
  }
  const base = current ? amt(current) : 0;
  const remaining = next ? Math.max(0, amt(next) - saved) : 0;
  const span = next ? amt(next) - base : 1;
  const pct = next ? Math.min(1, Math.max(0, (saved - base) / span)) : 1;
  const daysToNext = next && perDay > 0 ? Math.ceil(remaining / perDay) : null;
  return { current, next, remaining, daysToNext, pct };
}
