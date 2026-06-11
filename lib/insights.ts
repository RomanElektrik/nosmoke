// Craving analytics — turns the raw CravingLog[] the app already collects into
// human insights: when you're most at risk, what triggers you, how often you
// hold, and whether intensity is trending down. No new data needed.

import type { CravingLog, Trigger } from './storage';

export type Insights = {
  total: number;
  resisted: number;
  resistRate: number;          // 0..1
  avgIntensity: number;        // 1..10
  intensityTrend: 'down' | 'up' | 'flat';
  peakHourLabel: string | null;   // e.g. "18:00–21:00"
  peakHourStart: number | null;   // 0..23 — for scheduling nudges
  topTriggers: { trigger: Trigger; count: number }[];
  byHour: number[];            // 24 buckets, count of cravings
  worstDayLabel: string | null;
};

const TRIGGER_RU: Record<string, string> = {
  stress: 'Стресс', coffee: 'Кофе/еда', alcohol: 'Алкоголь', social: 'Компания',
  boredom: 'Скука', driving: 'За рулём', after_meal: 'После еды',
};
const TRIGGER_EN: Record<string, string> = {
  stress: 'Stress', coffee: 'Coffee/food', alcohol: 'Alcohol', social: 'Social',
  boredom: 'Boredom', driving: 'Driving', after_meal: 'After meal',
};
export function triggerName(t: Trigger, ru: boolean): string {
  return (ru ? TRIGGER_RU : TRIGGER_EN)[t] ?? t;
}

const DOW_RU = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const DOW_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function computeInsights(cravings: CravingLog[]): Insights {
  const total = cravings.length;
  const resisted = cravings.filter((c) => c.outcome === 'resisted').length;
  const resistRate = total ? resisted / total : 0;
  const avgIntensity = total ? cravings.reduce((a, c) => a + (c.intensity || 0), 0) / total : 0;

  // Intensity trend: last third vs first third.
  let intensityTrend: Insights['intensityTrend'] = 'flat';
  if (total >= 6) {
    const sorted = [...cravings].sort((a, b) => a.ts - b.ts);
    const n = Math.floor(total / 3);
    const early = sorted.slice(0, n).reduce((a, c) => a + (c.intensity || 0), 0) / n;
    const late = sorted.slice(-n).reduce((a, c) => a + (c.intensity || 0), 0) / n;
    if (late < early - 0.6) intensityTrend = 'down';
    else if (late > early + 0.6) intensityTrend = 'up';
  }

  // By-hour distribution + peak 3-hour window.
  const byHour = new Array(24).fill(0);
  for (const c of cravings) byHour[new Date(c.ts).getHours()]++;
  let peakHourStart: number | null = null;
  if (total >= 3) {
    let best = -1, bestSum = 0;
    for (let h = 0; h < 24; h++) {
      const sum = byHour[h] + byHour[(h + 1) % 24] + byHour[(h + 2) % 24];
      if (sum > bestSum) { bestSum = sum; best = h; }
    }
    if (bestSum >= 2) peakHourStart = best;
  }
  const peakHourLabel = peakHourStart == null ? null
    : `${String(peakHourStart).padStart(2, '0')}:00–${String((peakHourStart + 3) % 24).padStart(2, '0')}:00`;

  // Top triggers.
  const counts: Record<string, number> = {};
  for (const c of cravings) if (c.trigger) counts[c.trigger] = (counts[c.trigger] || 0) + 1;
  const topTriggers = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trigger, count]) => ({ trigger: trigger as Trigger, count }));

  // Worst day of week (by smoked count).
  let worstDayLabel: string | null = null;
  if (total >= 4) {
    const dow = new Array(7).fill(0);
    for (const c of cravings) if (c.outcome === 'smoked') dow[new Date(c.ts).getDay()]++;
    const max = Math.max(...dow);
    if (max >= 2) worstDayLabel = DOW_RU[dow.indexOf(max)];
  }

  return {
    total, resisted, resistRate, avgIntensity, intensityTrend,
    peakHourLabel, peakHourStart, topTriggers, byHour, worstDayLabel,
  };
}

export function worstDayLocalized(cravings: CravingLog[], ru: boolean): string | null {
  const dow = new Array(7).fill(0);
  let any = false;
  for (const c of cravings) if (c.outcome === 'smoked') { dow[new Date(c.ts).getDay()]++; any = true; }
  if (!any) return null;
  const max = Math.max(...dow);
  if (max < 2) return null;
  return (ru ? DOW_RU : DOW_EN)[dow.indexOf(max)];
}
