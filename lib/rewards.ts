// "What your savings buy" — turns an abstract money number into tangible
// rewards. Shows the next thing the saved money unlocks + a daily run-rate
// estimate of when. Currency-agnostic amounts (tuned for RUB by default).

export type Reward = { ru: string; en: string; amount: number; emoji: string };

// Ascending tiers. Amounts are rough RUB; the label still reads fine in other
// currencies since it's "you've saved enough for X".
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

export type RewardProgress = {
  current: Reward | null;     // highest tier already covered
  next: Reward | null;        // next tier to reach
  remaining: number;          // money still needed for `next`
  daysToNext: number | null;  // estimate based on daily savings rate
  pct: number;                // progress toward next (0..1)
};

export function rewardProgress(saved: number, perDay: number): RewardProgress {
  let current: Reward | null = null;
  let next: Reward | null = null;
  for (const r of REWARDS) {
    if (saved >= r.amount) current = r;
    else { next = r; break; }
  }
  const base = current?.amount ?? 0;
  const remaining = next ? Math.max(0, next.amount - saved) : 0;
  const span = next ? next.amount - base : 1;
  const pct = next ? Math.min(1, Math.max(0, (saved - base) / span)) : 1;
  const daysToNext = next && perDay > 0 ? Math.ceil(remaining / perDay) : null;
  return { current, next, remaining, daysToNext, pct };
}
