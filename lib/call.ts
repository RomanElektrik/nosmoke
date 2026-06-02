// «Бриз звонит тебе» — the signature viral mechanic.
// A personalized spoken call in the craving moment. Pure script generation
// (no network): personalized from the user's real data so it works offline
// and instantly. The call screen voices these lines via expo-speech.

import type { AppState, Motivation } from './storage';
import { secondsClean } from './health';
import { moneySaved, formatMoney } from './money';
import { plural } from './identity';

export type Lang = 'ru' | 'en';
export type CallChoice = 'hard' | 'easing' | 'why';

const MOTIVATION_RU: Record<Motivation, string> = {
  health: 'здоровья', money: 'денег', family: 'семьи', sport: 'сил и спорта',
  smell: 'свежести', control: 'контроля над собой', faith: 'веры',
};
const MOTIVATION_EN: Record<Motivation, string> = {
  health: 'your health', money: 'the money', family: 'your family', sport: 'strength and fitness',
  smell: 'feeling fresh', control: 'being in control', faith: 'your faith',
};

function days(state: AppState): number {
  const p = state.profile;
  return p ? Math.floor(secondsClean(p.quitDate) / 86400) : 0;
}

function moneyStr(state: AppState, lang: Lang): string {
  const p = state.profile;
  if (!p) return '';
  return formatMoney(moneySaved(p, secondsClean(p.quitDate)), p.currency, lang === 'ru' ? 'ru-RU' : 'en-US');
}

// Opening monologue when the user picks up.
export function callOpening(state: AppState, lang: Lang): string[] {
  const d = days(state);
  const p = state.profile;
  const stmt = p?.identityStatement?.trim();
  const ru = lang === 'ru';

  const lines: string[] = [];
  // Short and warm — a snappy opening, not a monologue.
  lines.push(ru ? 'Привет, это Бриз. Я рядом.' : "Hey, it's Breeze. I'm right here.");

  if (d >= 1) {
    lines.push(ru
      ? `Ты держишься уже ${d} ${plural(d, ['день', 'дня', 'дней'])} — и это ты, не случайность.`
      : `You've held on ${d} ${d === 1 ? 'day' : 'days'} — and that's you, not luck.`);
  } else {
    lines.push(ru
      ? 'Ты только что решил начать — и это уже сила.'
      : "You just chose to begin — and that's already strength.");
  }

  lines.push(ru ? 'Скажи, как ты сейчас?' : 'Tell me — how are you right now?');
  return lines;
}

export function callChoices(lang: Lang): { key: CallChoice; label: string }[] {
  const ru = lang === 'ru';
  return [
    { key: 'hard',   label: ru ? 'Очень тяжело' : "It's really hard" },
    { key: 'easing', label: ru ? 'Уже отпускает' : "It's easing" },
    { key: 'why',    label: ru ? 'Напомни, зачем я бросаю' : 'Remind me why' },
  ];
}

export function callReply(choice: CallChoice, state: AppState, lang: Lang): string[] {
  const ru = lang === 'ru';
  const p = state.profile;
  if (choice === 'hard') {
    return ru
      ? [
          'Знаю. И всё равно ты держишь трубку, а не сигарету. Это уже выбор.',
          'Дыши со мной. Медленный вдох на четыре… и долгий выдох на шесть. Ещё раз.',
          'Тяга — это волна. Ты на её гребне, а дальше только вниз. Я никуда не уйду.',
        ]
      : [
          "I know. And still you're holding the phone, not a cigarette. That's already a choice.",
          'Breathe with me. Slow in for four… and a long out for six. Again.',
          "A craving is a wave. You're on the crest — from here it only falls. I'm not going anywhere.",
        ];
  }
  if (choice === 'easing') {
    return ru
      ? [
          'Вот видишь. Ты сильнее, чем тяга.',
          'Запомни это чувство. Ты только что выиграл момент, который раньше выигрывал у тебя.',
          'Так и становятся теми, кто не курит — по одному такому моменту.',
        ]
      : [
          "See? You're stronger than the craving.",
          'Remember this feeling. You just won a moment that used to win against you.',
          "That's how you become someone who doesn't smoke — one moment at a time.",
        ];
  }
  // why
  const mots = p?.motivations ?? [];
  const motWords = mots.slice(0, 2).map((m) => (ru ? MOTIVATION_RU[m] : MOTIVATION_EN[m])).filter(Boolean);
  const reason = motWords.length
    ? motWords.join(ru ? ' и ' : ' and ')
    : (ru ? 'себя' : 'yourself');
  const money = moneyStr(state, lang);
  return ru
    ? [
        `Ты бросаешь ради ${reason}.`,
        money ? `${money} уже остались у тебя, а не сгорели.` : 'Каждая невыкуренная сигарета остаётся твоей победой.',
        'Каждый раз, когда ты не закуриваешь, ты становишься этим человеком чуть больше.',
      ].filter(Boolean)
    : [
        `You're quitting for ${reason}.`,
        money ? `${money} stayed with you instead of burning away.` : 'Every cigarette skipped is your win.',
        "Every time you don't smoke, you become that person a little more.",
      ].filter(Boolean);
}

export function callClosing(state: AppState, lang: Lang): string[] {
  const ru = lang === 'ru';
  return ru
    ? [
        'Ты справился с этим звонком — значит справишься и с тягой.',
        'Ты — тот, кто не курит. Положи трубку и иди дальше.',
      ]
    : [
        "You made it through this call — you'll make it through the craving.",
        "You're someone who doesn't smoke. Hang up and keep going.",
      ];
}
