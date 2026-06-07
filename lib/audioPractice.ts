// Guided audio practices. Two playback modes:
//  1. Recorded mode — when `audio` is set (an mp3 require()), the player streams
//     one continuous file with a real draggable scrubber. This is the target:
//     the owner records these in ElevenLabs from assets/audio/SCRIPTS.md.
//  2. TTS fallback — until the mp3 exists, `steps` are spoken by the cached
//     Gemini voice (paced, no dead silence).
//
// To enable recorded audio for a practice: drop the mp3 into assets/audio/ and
// set `audio: require('../assets/audio/<file>.mp3')` on that practice.

import type { IconKey } from '../components/Icon';

export type AudioStep = { kind: 'say' | 'breathe'; ru: string; en: string; hold?: number };

export type AudioPractice = {
  id: string;
  icon: IconKey;
  color: string;
  titleRu: string; titleEn: string;
  subRu: string; subEn: string;
  minutes: number;
  audio?: number;          // require('...mp3') — when present, recorded mode + scrubber
  steps: AudioStep[];      // TTS fallback content
};

// ── 4-7-8 breathing cycle (TTS fallback) ──
const breath478 = (): AudioStep[] => {
  const cycle: AudioStep[] = [
    { kind: 'breathe', ru: 'Вдыхай через нос… раз… два… три… четыре.', en: 'Breathe in through your nose… one… two… three… four.' },
    { kind: 'breathe', ru: 'Задержи дыхание… мягко… и считай со мной… раз, два, три, четыре, пять, шесть, семь.', en: 'Hold… gently… one, two, three, four, five, six, seven.', hold: 2 },
    { kind: 'breathe', ru: 'А теперь медленно выдыхай через рот… до самого конца… вот так.', en: 'Now breathe out slowly through your mouth… all the way… like that.', hold: 4 },
  ];
  return [...cycle, ...cycle, ...cycle, ...cycle];
};

export const PRACTICES: AudioPractice[] = [
  {
    id: 'calm_now',
    icon: 'lungs',
    color: '#5AC8FA',
    titleRu: 'Когда накрыло', titleEn: 'When it hits hard',
    subRu: 'Острая тяга — успокоиться за пару минут', subEn: 'Acute craving — calm down in minutes',
    minutes: 3,
    audio: require('../assets/audio/breeze_calm_now.mp3'),
    steps: [
      { kind: 'say', ru: 'Привет. Сильно накрыло — это нормально. Сейчас вместе это переждём, дыши со мной.', en: "Hi. It hit hard — that's normal. We'll ride it out together, breathe with me." },
      ...breath478(),
      { kind: 'say', ru: 'Чувствуешь? Волна уже спадает. Ты сильнее неё. Ты молодец.', en: 'Feel it? The wave is already passing. You are stronger than it. Well done.' },
    ],
  },
  {
    id: 'surf_urge',
    icon: 'waves',
    color: '#0A84FF',
    titleRu: 'Поймать волну', titleEn: 'Ride the wave',
    subRu: 'Прокатиться по тяге, не закурив', subEn: 'Surf the urge without smoking',
    minutes: 4,
    audio: require('../assets/audio/breeze_surf.mp3'),
    steps: [
      { kind: 'say', ru: 'Не гони тягу — давай просто за ней понаблюдаем. Где ты её чувствуешь в теле?', en: "Don't fight the urge — let's just watch it. Where do you feel it in your body?", hold: 3 },
      { kind: 'say', ru: 'Это просто ощущение. Оно нарастает, как волна… доходит до пика…', en: "It's just a sensation. It rises like a wave… reaches a peak…", hold: 3 },
      { kind: 'say', ru: 'И начинает спадать. Ты ничего не сделал, чтобы её прогнать — а она уходит сама.', en: "And starts to fall. You did nothing to chase it away — and it fades on its own.", hold: 3 },
      { kind: 'say', ru: 'Каждая такая волна делает следующую слабее. Ты учишь мозг: тягу можно пережить.', en: 'Every wave you ride makes the next one weaker. You teach the brain: a craving can be survived.' },
    ],
  },
  {
    id: 'release',
    icon: 'meditate',
    color: '#BF5AF2',
    titleRu: 'Сбросить напряжение', titleEn: 'Let go of tension',
    subRu: 'Расслабить тело от макушки до стоп', subEn: 'Relax the body head to toe',
    minutes: 5,
    audio: require('../assets/audio/breeze_release.mp3'),
    steps: [
      { kind: 'say', ru: 'Устройся удобно, если хочешь — закрой глаза. Один глубокий вдох… и длинный выдох.', en: 'Settle in, close your eyes if you like. One deep breath in… and a long breath out.', hold: 2 },
      { kind: 'say', ru: 'Перенеси внимание к стопам. Пусть станут мягкими и тяжёлыми.', en: 'Bring attention to your feet. Let them grow soft and heavy.', hold: 4 },
      { kind: 'say', ru: 'Отпусти ноги и бёдра. С каждым выдохом они опускаются.', en: 'Release your legs and hips. With each exhale they sink.', hold: 4 },
      { kind: 'say', ru: 'Расслабь живот, грудь, плечи — дай им опуститься от ушей.', en: 'Soften your belly, chest, shoulders — let them drop from your ears.', hold: 4 },
      { kind: 'say', ru: 'И лицо: челюсть, щёки, лоб. Всё тело спокойно и тяжело.', en: 'And your face: jaw, cheeks, forehead. Your whole body is calm and heavy.', hold: 4 },
      { kind: 'say', ru: 'Побудь в этом. Когда будешь готов — медленно открой глаза.', en: 'Stay here a moment. When ready, slowly open your eyes.', hold: 3 },
    ],
  },
  {
    id: 'grounding',
    icon: 'compass',
    color: '#30D158',
    titleRu: 'Вернуться в момент', titleEn: 'Back to the present',
    subRu: 'Заземление через органы чувств', subEn: 'Grounding through your senses',
    minutes: 3,
    audio: require('../assets/audio/breeze_grounding.mp3'),
    steps: [
      { kind: 'say', ru: 'Давай вернёмся в этот момент. Просто замечай то, что я называю.', en: "Let's come back to this moment. Just notice what I name." },
      { kind: 'say', ru: 'Найди глазами пять вещей, которые видишь прямо сейчас.', en: 'Find five things you can see right now.', hold: 6 },
      { kind: 'say', ru: 'Теперь четыре звука вокруг тебя.', en: 'Now four sounds around you.', hold: 6 },
      { kind: 'say', ru: 'Три ощущения телом: одежда, тепло, опора под тобой.', en: 'Three things you can feel: clothes, warmth, the support beneath you.', hold: 5 },
      { kind: 'say', ru: 'Два запаха. И один вкус во рту.', en: 'Two smells. And one taste in your mouth.', hold: 5 },
      { kind: 'say', ru: 'Ты здесь и сейчас. Тяга — просто волна, а ты крепко стоишь на земле.', en: "You're here, now. The craving is just a wave, and you stand firm." },
    ],
  },
  {
    id: 'sleep',
    icon: 'meditate',
    color: '#7E8CE0',
    titleRu: 'Уснуть без сигареты', titleEn: 'Sleep without a cigarette',
    subRu: 'Вечернее дыхание, чтобы заснуть', subEn: 'Evening breathing to fall asleep',
    minutes: 6,
    audio: require('../assets/audio/breeze_sleep.mp3'),
    steps: [
      { kind: 'say', ru: 'День закончен. Сигарета тебе сейчас не нужна — нужен покой. Я помогу уснуть.', en: "The day is done. You don't need a cigarette now — you need rest. I'll help you sleep." },
      { kind: 'say', ru: 'Дыши медленно и тихо. Вдох на четыре… и долгий, спокойный выдох на шесть.', en: 'Breathe slow and quiet. In for four… and a long, calm out for six.', hold: 3 },
      { kind: 'say', ru: 'С каждым выдохом тело становится тяжелее и опускается в кровать.', en: 'With each exhale your body grows heavier and sinks into the bed.', hold: 4 },
      { kind: 'say', ru: 'Отпусти мысли о завтра. Сейчас есть только дыхание и тишина.', en: 'Let go of tomorrow. There is only breath and quiet now.', hold: 4 },
      { kind: 'say', ru: 'Ты — тот, кто не курит. И сегодня ты засыпаешь свободным. Спокойной ночи.', en: "You're someone who doesn't smoke. Tonight you fall asleep free. Good night.", hold: 3 },
    ],
  },
];

export function getPractice(id?: string): AudioPractice | undefined {
  return PRACTICES.find((p) => p.id === id);
}
