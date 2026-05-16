import type { Archetype } from './storage';

// Lightweight smoker-archetype quiz. Each option contributes weights to archetypes.
// Based on smoking-motive literature (WISDM, Brief Smoking Consequences Questionnaire, RFS).
export type Q = {
  id: string;
  qKey: string;
  options: { key: string; w: Partial<Record<Archetype, number>> }[];
};

export const QUESTIONS: Q[] = [
  {
    id: 'q1', qKey: 'pers.q1',
    options: [
      { key: 'pers.q1.a', w: { anxious: 2 } },        // calms my nerves
      { key: 'pers.q1.b', w: { social: 2 } },         // it's a moment with people
      { key: 'pers.q1.c', w: { habitual: 2 } },       // hand reaches by itself
      { key: 'pers.q1.d', w: { reward: 2 } },         // it's a small joy
    ],
  },
  {
    id: 'q2', qKey: 'pers.q2',
    options: [
      { key: 'pers.q2.a', w: { anxious: 2, reward: 1 } },  // bad day
      { key: 'pers.q2.b', w: { social: 2 } },              // friends
      { key: 'pers.q2.c', w: { habitual: 2 } },            // morning coffee, after meal
      { key: 'pers.q2.d', w: { identity: 2 } },            // boredom — it's who I am
    ],
  },
  {
    id: 'q3', qKey: 'pers.q3',
    options: [
      { key: 'pers.q3.a', w: { anxious: 2 } },        // i'm anxious
      { key: 'pers.q3.b', w: { reward: 2 } },         // i feel deprived
      { key: 'pers.q3.c', w: { habitual: 1, identity: 1 } }, // i don't know who i am without it
      { key: 'pers.q3.d', w: { social: 2 } },         // can't be in the company
    ],
  },
  {
    id: 'q4', qKey: 'pers.q4',
    options: [
      { key: 'pers.q4.a', w: { habitual: 2 } },
      { key: 'pers.q4.b', w: { reward: 2 } },
      { key: 'pers.q4.c', w: { identity: 2 } },
      { key: 'pers.q4.d', w: { anxious: 1, social: 1 } },
    ],
  },
  {
    id: 'q5', qKey: 'pers.q5',
    options: [
      { key: 'pers.q5.a', w: { social: 2 } },
      { key: 'pers.q5.b', w: { anxious: 2 } },
      { key: 'pers.q5.c', w: { habitual: 2 } },
      { key: 'pers.q5.d', w: { reward: 1, identity: 1 } },
    ],
  },
  {
    id: 'q6', qKey: 'pers.q6',
    options: [
      { key: 'pers.q6.a', w: { identity: 2 } },
      { key: 'pers.q6.b', w: { reward: 2 } },
      { key: 'pers.q6.c', w: { anxious: 2 } },
      { key: 'pers.q6.d', w: { habitual: 1, social: 1 } },
    ],
  },
];

export function scoreArchetype(answers: number[]): { winner: Archetype; scores: Record<Archetype, number> } {
  const scores: Record<Archetype, number> = { anxious: 0, social: 0, habitual: 0, reward: 0, identity: 0 };
  QUESTIONS.forEach((q, i) => {
    const choice = q.options[answers[i] ?? 0];
    if (!choice) return;
    Object.entries(choice.w).forEach(([k, v]) => {
      scores[k as Archetype] += v ?? 0;
    });
  });
  const winner = (Object.keys(scores) as Archetype[]).reduce((a, b) => (scores[a] >= scores[b] ? a : b));
  return { winner, scores };
}

import type { IconKey } from '../components/Icon';

export const ARCHETYPE_META: Record<Archetype, { titleKey: string; tipKey: string; color: string; icon: IconKey }> = {
  anxious:  { titleKey: 'pers.arch.anxious.t',  tipKey: 'pers.arch.anxious.tip',  color: '#5AC8FA', icon: 'wave2' },
  social:   { titleKey: 'pers.arch.social.t',   tipKey: 'pers.arch.social.tip',   color: '#FF9F0A', icon: 'flame' },
  habitual: { titleKey: 'pers.arch.habitual.t', tipKey: 'pers.arch.habitual.tip', color: '#BF5AF2', icon: 'pulse' },
  reward:   { titleKey: 'pers.arch.reward.t',   tipKey: 'pers.arch.reward.tip',   color: '#30D158', icon: 'spark' },
  identity: { titleKey: 'pers.arch.identity.t', tipKey: 'pers.arch.identity.tip', color: '#FF453A', icon: 'mirror' },
};
