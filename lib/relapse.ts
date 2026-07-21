// Distinguish a LAPSE (an isolated slip — never resets the streak) from a
// RELAPSE (sustained daily smoking). When someone is smoking most days, the
// "30 days clean" counter is dishonest and erodes trust — so we detect it from
// the data we already collect (daily check-ins + slips + smoked cravings) and
// gently offer an honest fresh start. We NEVER reset automatically.

import type { AppState } from './storage';
import { localDateKey } from './dates';
import { preQuitGraceEnd } from './stepped';

const DAY = 86400_000;

export type RelapseStatus = {
  smokeDays7: number;       // distinct days with any smoking in the last 7
  activelySmoking: boolean; // ≥3 of last 7 days → treat as a relapse, not a slip
  lastSmokeTs: number | null;
  daysSinceQuit: number;
};

export function relapseStatus(state: AppState): RelapseStatus {
  const now = Date.now();
  const quit = state.profile?.quitDate ?? now;
  const daysSinceQuit = Math.floor((now - quit) / DAY);

  // Pre-quit protocol window (Tabex days 1–4, bupropion/varenicline titration):
  // smoking there is per-protocol, not a relapse — ignore those events entirely.
  // То же и для постепенного снижения: до целевой даты сигареты — это ВЫПОЛНЕНИЕ
  // плана приложения, а не срыв. Иначе человек, честно куривший по расписанию
  // снижения 3 дня за неделю, получал карточку «Похоже, ты снова куришь» и
  // предложение перейти на цитизин — приложение обвиняло его за собственный план.
  const prof = state.profile;
  const taperEnd = prof?.method === 'taper' && prof.taperTargetDate ? prof.taperTargetDate : 0;
  const graceEnd = Math.max(preQuitGraceEnd(prof), taperEnd);

  const days = new Set<string>();
  let lastSmokeTs: number | null = null;
  const note = (ts: number) => { if (lastSmokeTs == null || ts > lastSmokeTs) lastSmokeTs = ts; };
  const counts = (ts: number) => now - ts < 7 * DAY && ts >= graceEnd;

  for (const c of state.checkIns ?? []) {
    if (!c.smoked) continue;
    // c.date is a localDateKey; keep it if within the last 7 days.
    const d = new Date(c.date + 'T00:00:00');
    if (!isNaN(d.getTime()) && counts(d.getTime())) { days.add(c.date); note(d.getTime()); }
  }
  for (const ts of state.slips ?? []) {
    if (counts(ts)) { days.add(localDateKey(new Date(ts))); note(ts); }
  }
  for (const cr of state.cravings ?? []) {
    if (cr.outcome === 'smoked' && counts(cr.ts)) { days.add(localDateKey(new Date(cr.ts))); note(cr.ts); }
  }

  const smokeDays7 = days.size;
  // ≥3 distinct smoking days in the past week = a pattern, not a one-off.
  // Require the attempt to be at least a few days old so a brand-new quit that
  // hasn't really started isn't flagged immediately.
  const activelySmoking = smokeDays7 >= 3 && daysSinceQuit >= 2;

  return { smokeDays7, activelySmoking, lastSmokeTs, daysSinceQuit };
}
