// Subscription / Premium gating — local-only for now.
// A dev toggle in Profile flips `devPremium` so the developer can test
// both states without real IAP. When the real RevenueCat layer is wired,
// `usePremium()` will combine the dev flag with the real entitlement.

import { useAppState } from './storage';

// Tuned to bite during a hard craving day (a single rough evening can run
// through several messages), not only after weeks of casual use. The point of
// the free tier is to prove Breeze helps, then ask — not to be a 30-day trial.
export const FREE_AI_DAILY_LIMIT = 5;

/** First N items from a list are free; the rest are premium-gated. */
export const FREE_TECHNIQUE_IDS = new Set([
  'cyclic_sigh', 'box_breath', 'urge_surf', 'halt_check', 'if_then',
]);

export const FREE_ARTICLE_COUNT = 5;

/** First N audio practices (by PRACTICES order) are free; the rest are premium. */
export const FREE_PRACTICE_COUNT = 3;

/** Only cold-turkey is free; tapering & pharmacotherapy steps are premium. */
export function isStepPremium(stepId: string | undefined): boolean {
  if (!stepId) return false;
  return stepId !== 'L1_behavioral';
}

export function isTechniquePremium(techId: string, tags?: readonly string[]): boolean {
  return !FREE_TECHNIQUE_IDS.has(techId);
}

/** Hook: returns whether the current user has premium access. */
export function usePremium(): boolean {
  const [state] = useAppState();
  return !!state.profile?.devPremium;
}

/** AI usage helpers — count messages sent today (free tier). */
import { localDateKey } from './dates';
export function todayKey(d = new Date()): string {
  return localDateKey(d);
}

export function aiUsedToday(state: { aiUsage?: { date: string; count: number } }): number {
  const u = state.aiUsage;
  if (!u || u.date !== todayKey()) return 0;
  return u.count;
}

export function aiRemainingToday(state: { aiUsage?: { date: string; count: number } }, premium: boolean): number | null {
  if (premium) return null; // unlimited
  return Math.max(0, FREE_AI_DAILY_LIMIT - aiUsedToday(state));
}
