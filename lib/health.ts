// Recovery timeline. Sources: CDC, NHS, AHA, Surgeon General report.
import type { IconKey } from '../components/Icon';

export type Milestone = {
  id: string;
  at: number; // seconds
  titleKey: string;
  bodyKey: string;
  source: string;
  icon: IconKey;
  color: string;
};

const MIN = 60;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export const MILESTONES: Milestone[] = [
  { id: 'm20', at: 20 * MIN,   icon: 'heart',  color: '#FF453A', titleKey: 'health.m20.t', bodyKey: 'health.m20.b', source: 'CDC' },
  { id: 'h8',  at: 8 * HOUR,   icon: 'lung',   color: '#5AC8FA', titleKey: 'health.h8.t',  bodyKey: 'health.h8.b',  source: 'NHS' },
  { id: 'd1',  at: 1 * DAY,    icon: 'pulse',  color: '#FF453A', titleKey: 'health.d1.t',  bodyKey: 'health.d1.b',  source: 'AHA' },
  { id: 'd2',  at: 2 * DAY,    icon: 'sparkle',color: '#FF9F0A', titleKey: 'health.d2.t',  bodyKey: 'health.d2.b',  source: 'NHS' },
  { id: 'd3',  at: 3 * DAY,    icon: 'wind',   color: '#5AC8FA', titleKey: 'health.d3.t',  bodyKey: 'health.d3.b',  source: 'NHS' },
  { id: 'w2',  at: 2 * WEEK,   icon: 'drop',   color: '#FF9F0A', titleKey: 'health.w2.t',  bodyKey: 'health.w2.b',  source: 'CDC' },
  { id: 'm1',  at: 1 * MONTH,  icon: 'bed',    color: '#9AA3AF', titleKey: 'health.m1.t',  bodyKey: 'health.m1.b',  source: 'NHS' },
  { id: 'm9',  at: 9 * MONTH,  icon: 'lung',   color: '#5AC8FA', titleKey: 'health.m9.t',  bodyKey: 'health.m9.b',  source: 'NHS' },
  { id: 'y1',  at: 1 * YEAR,   icon: 'heart',  color: '#FF453A', titleKey: 'health.y1.t',  bodyKey: 'health.y1.b',  source: 'AHA' },
  { id: 'y5',  at: 5 * YEAR,   icon: 'brain',  color: '#BF5AF2', titleKey: 'health.y5.t',  bodyKey: 'health.y5.b',  source: 'CDC' },
  { id: 'y10', at: 10 * YEAR,  icon: 'ribbon', color: '#FF9F0A', titleKey: 'health.y10.t', bodyKey: 'health.y10.b', source: 'CDC' },
  { id: 'y15', at: 15 * YEAR,  icon: 'shield', color: '#30D158', titleKey: 'health.y15.t', bodyKey: 'health.y15.b', source: 'AHA' },
];

export function secondsClean(quitDateMs: number, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - quitDateMs) / 1000));
}
export function progressFor(milestone: Milestone, secs: number): number {
  return Math.max(0, Math.min(1, secs / milestone.at));
}
export function nextMilestone(secs: number): Milestone | null {
  return MILESTONES.find((m) => m.at > secs) ?? null;
}
export function reachedMilestones(secs: number): Milestone[] {
  return MILESTONES.filter((m) => m.at <= secs);
}
