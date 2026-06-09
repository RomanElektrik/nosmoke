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
    icon: 'sleepy',
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

  // ── Meditative / life-affirming sessions (TTS until recorded) ──
  {
    id: 'you_got_this',
    icon: 'muscle',
    color: '#FFD60A',
    titleRu: 'Ты справишься', titleEn: 'You\'ve got this',
    subRu: 'Минута уверенности в себе', subEn: 'A minute of self-belief',
    minutes: 3,
    audio: require('../assets/audio/breeze_you_got_this.mp3'),
    steps: [
      { kind: 'say', ru: 'Остановись на минуту. Сделай спокойный вдох. Я здесь, рядом.', en: 'Pause for a minute. Take a calm breath. I\'m here with you.', hold: 2 },
      { kind: 'say', ru: 'Ты уже сделал самое трудное — ты начал. Это сильнее, чем кажется.', en: 'You already did the hardest part — you started. That\'s stronger than it feels.', hold: 3 },
      { kind: 'say', ru: 'Каждый час без сигареты — это твой выбор. Ты доказываешь себе, кто ты.', en: 'Every hour without a cigarette is your choice. You\'re proving who you are.', hold: 3 },
      { kind: 'say', ru: 'Будет тяжело — и это нормально. Тяжесть проходит, а ты остаёшься.', en: 'It will be hard sometimes — and that\'s okay. The hard passes; you remain.', hold: 3 },
      { kind: 'say', ru: 'Повтори про себя: «Я справляюсь. У меня получается». Ещё раз, медленно.', en: 'Say silently: "I\'m doing this. I\'ve got this." Again, slowly.', hold: 4 },
      { kind: 'say', ru: 'Так и есть. Ты справляешься. Иди дальше — спокойно и уверенно.', en: 'It\'s true. You\'ve got this. Keep going — calm and steady.', hold: 2 },
    ],
  },
  {
    id: 'after_slip',
    icon: 'feather',
    color: '#5AC8FA',
    titleRu: 'Сорвался — и это ок', titleEn: 'You slipped — and it\'s okay',
    subRu: 'Без вины, мягко вернуться', subEn: 'No guilt, a gentle return',
    minutes: 3,
    audio: require('../assets/audio/breeze_after_slip.mp3'),
    steps: [
      { kind: 'say', ru: 'Ты закурил. Сделай вдох. Это не провал — это просто момент.', en: 'You smoked. Take a breath. This isn\'t failure — it\'s just a moment.', hold: 2 },
      { kind: 'say', ru: 'Одна сигарета не стирает всё, что ты прошёл. Цифры остаются твоими.', en: 'One cigarette doesn\'t erase all you\'ve done. Your numbers stay yours.', hold: 3 },
      { kind: 'say', ru: 'У восьми из десяти бросающих бывают срывы. Те, кто бросил, — тоже срывались.', en: 'Eight in ten quitters slip. The ones who quit for good slipped too.', hold: 3 },
      { kind: 'say', ru: 'Не ругай себя. Стыд тянет к следующей сигарете. Доброта — от неё.', en: 'Don\'t scold yourself. Shame pulls toward the next cigarette. Kindness pulls away.', hold: 3 },
      { kind: 'say', ru: 'Просто заметь, что подтолкнуло, — и отпусти. Ты снова в игре прямо сейчас.', en: 'Just notice what nudged you — and let it go. You\'re back in it right now.', hold: 3 },
      { kind: 'say', ru: 'Ты по-прежнему тот, кто бросает. Один вдох — и продолжаем.', en: 'You\'re still someone who\'s quitting. One breath — and we continue.', hold: 2 },
    ],
  },
  {
    id: 'morning',
    icon: 'sprout',
    color: '#FF9F0A',
    titleRu: 'Утро без сигарет', titleEn: 'A smoke-free morning',
    subRu: 'Настроить день с утра', subEn: 'Set your day from the start',
    minutes: 3,
    audio: require('../assets/audio/breeze_morning.mp3'),
    steps: [
      { kind: 'say', ru: 'Доброе утро. Новый день — и он начинается свободным.', en: 'Good morning. A new day — and it begins free.', hold: 2 },
      { kind: 'breathe', ru: 'Сделай глубокий вдох свежего воздуха… и медленный выдох.', en: 'Take a deep breath of fresh air… and a slow exhale.', hold: 3 },
      { kind: 'say', ru: 'Раньше утро начиналось с сигареты. Сегодня — с твоего собственного дыхания.', en: 'Mornings used to start with a cigarette. Today they start with your own breath.', hold: 3 },
      { kind: 'say', ru: 'Если днём станет тянуть — вспомни: волна проходит за три минуты.', en: 'If a craving comes later — remember: a wave passes in three minutes.', hold: 3 },
      { kind: 'say', ru: 'Поставь одно намерение на день: «Сегодня я остаюсь собой — свободным».', en: 'Set one intention for the day: "Today I stay myself — free."', hold: 4 },
      { kind: 'say', ru: 'Хорошего дня. Ты начинаешь его сильным.', en: 'Have a good day. You begin it strong.', hold: 2 },
    ],
  },
  {
    id: 'i_dont_smoke',
    icon: 'heartPulse',
    color: '#30D158',
    titleRu: 'Я больше не курю', titleEn: 'I don\'t smoke anymore',
    subRu: 'Закрепить новую личность', subEn: 'Anchor your new identity',
    minutes: 4,
    audio: require('../assets/audio/breeze_i_dont_smoke.mp3'),
    steps: [
      { kind: 'say', ru: 'Устройся удобно. Закрой глаза, если хочешь. Дыши спокойно.', en: 'Settle in. Close your eyes if you like. Breathe calmly.', hold: 2 },
      { kind: 'say', ru: 'Курение — это не ты. Это привычка, которую ты сейчас отпускаешь.', en: 'Smoking isn\'t you. It\'s a habit you\'re letting go of now.', hold: 3 },
      { kind: 'say', ru: 'Представь себя через год: дышишь легко, кожа живее, и сигарет в твоей жизни просто нет.', en: 'Picture yourself a year from now: breathing easy, skin alive, cigarettes simply not in your life.', hold: 4 },
      { kind: 'say', ru: 'Этот человек — уже ты. Ты просто становишься им с каждым выбором.', en: 'That person is already you. You become them with every choice.', hold: 3 },
      { kind: 'say', ru: 'Скажи про себя, спокойно и твёрдо: «Я не курю. Это больше не моё».', en: 'Say silently, calm and firm: "I don\'t smoke. It\'s not mine anymore."', hold: 4 },
      { kind: 'say', ru: 'Почувствуй, как это правда. Открой глаза, когда будешь готов.', en: 'Feel how true it is. Open your eyes when you\'re ready.', hold: 2 },
    ],
  },
  {
    id: 'let_go_anxiety',
    icon: 'meditate',
    color: '#BF5AF2',
    titleRu: 'Отпустить тревогу', titleEn: 'Let anxiety go',
    subRu: 'Снять напряжение без сигареты', subEn: 'Release tension without a cigarette',
    minutes: 4,
    audio: require('../assets/audio/breeze_let_go_anxiety.mp3'),
    steps: [
      { kind: 'say', ru: 'Тревога — частая причина потянуться за сигаретой. Давай снимем её иначе.', en: 'Anxiety is a common reason to reach for a cigarette. Let\'s ease it another way.', hold: 2 },
      { kind: 'breathe', ru: 'Глубокий вдох носом на четыре… задержи… и долгий выдох ртом.', en: 'Deep breath in for four… hold… and a long exhale through the mouth.', hold: 4 },
      { kind: 'say', ru: 'Заметь, где в теле живёт напряжение. Плечи? Челюсть? Живот?', en: 'Notice where tension lives in your body. Shoulders? Jaw? Stomach?', hold: 4 },
      { kind: 'say', ru: 'На выдохе мягко отпусти это место. Пусть оно станет тяжёлым и спокойным.', en: 'On the exhale, gently release that spot. Let it grow heavy and calm.', hold: 4 },
      { kind: 'say', ru: 'Сигарета дала бы пару минут — а вернула бы тревогу с процентами. Тебе это не нужно.', en: 'A cigarette would give a couple minutes — and return the anxiety with interest. You don\'t need that.', hold: 3 },
      { kind: 'breathe', ru: 'Ещё один спокойный вдох… и выдох. Напряжение уходит.', en: 'One more calm breath in… and out. The tension drains away.', hold: 4 },
      { kind: 'say', ru: 'Ты спокойнее, чем минуту назад. И ты сделал это сам, без сигареты.', en: 'You\'re calmer than a minute ago. And you did it yourself, without a cigarette.', hold: 2 },
    ],
  },
  {
    id: 'evening_unwind',
    icon: 'wind',
    color: '#5E5CE6',
    titleRu: 'Вечер без сигареты', titleEn: 'Evening without a cigarette',
    subRu: 'Сбросить напряжение дня', subEn: 'Let the day\'s tension go',
    minutes: 4,
    audio: require('../assets/audio/breeze_evening_unwind.mp3'),
    steps: [
      { kind: 'say', ru: 'День закончился. Раньше это был момент «заслуженной» сигареты. Давай отметим конец дня иначе.', en: 'The day is over. This used to be the moment for a "deserved" cigarette. Let\'s mark the day\'s end another way.', hold: 2 },
      { kind: 'breathe', ru: 'Глубокий вдох… и длинный выдох, отпускающий весь день.', en: 'A deep breath in… and a long exhale, letting the whole day go.', hold: 4 },
      { kind: 'say', ru: 'Перебери в голове, что было сегодня. Что-то получилось, что-то нет — и всё уже позади.', en: 'Run through your day. Some went well, some didn\'t — and it\'s all behind you now.', hold: 4 },
      { kind: 'say', ru: 'Сигарета не «снимала стресс» — она лечила свой собственный отзыв. Сейчас тебе нечего лечить.', en: 'A cigarette never "relieved stress" — it treated its own withdrawal. There\'s nothing to treat now.', hold: 3 },
      { kind: 'say', ru: 'Расслабь плечи… челюсть… отпусти живот. Вечер — это про покой, а не про дым.', en: 'Relax your shoulders… your jaw… soften your belly. Evening is about calm, not smoke.', hold: 4 },
      { kind: 'say', ru: 'Ты прошёл ещё один день свободным. Это и есть награда. Отдыхай — ты заслужил настоящий отдых.', en: 'You made it through another free day. That\'s the reward. Rest — you\'ve earned real rest.', hold: 2 },
    ],
  },
  {
    id: 'social_urge',
    icon: 'group',
    color: '#FF9F0A',
    titleRu: 'Тянет за компанию', titleEn: 'Craving in company',
    subRu: 'Когда вокруг курят', subEn: 'When others are smoking',
    minutes: 3,
    audio: require('../assets/audio/breeze_social_urge.mp3'),
    steps: [
      { kind: 'say', ru: 'Вокруг курят, и тебя тянет за компанию. Это самый сильный триггер — и сейчас мы его обойдём.', en: 'Others are smoking and you feel pulled along. This is the strongest trigger — and we\'ll get past it.', hold: 2 },
      { kind: 'say', ru: 'Сделай шаг назад — мысленно или буквально. Вдохни. Тебе не обязательно делать то, что делают все.', en: 'Take a step back — mentally or literally. Breathe. You don\'t have to do what everyone else does.', hold: 3 },
      { kind: 'say', ru: 'Через десять минут они потушат сигарету и забудут о ней. А ты будешь гордиться, что не закурил.', en: 'In ten minutes they\'ll put it out and forget it. And you\'ll be proud you didn\'t join.', hold: 3 },
      { kind: 'say', ru: 'Займи руки и рот: возьми стакан воды, жвачку, телефон. Тяга за компанию проходит, если её переждать.', en: 'Busy your hands and mouth: a glass of water, gum, your phone. A social craving passes if you wait it out.', hold: 3 },
      { kind: 'say', ru: 'Ты не «белая ворона» — ты человек, который выбрал себя. Это притягательнее, чем кажется.', en: 'You\'re not the odd one out — you\'re someone who chose themselves. That\'s more magnetic than it seems.', hold: 3 },
      { kind: 'say', ru: 'Волна спадает. Ты остался собой даже там, где это труднее всего. Молодец.', en: 'The wave is passing. You stayed yourself where it\'s hardest. Well done.', hold: 2 },
    ],
  },
  {
    id: 'proud',
    icon: 'trophy',
    color: '#FFD60A',
    titleRu: 'Я молодец', titleEn: 'I\'m doing great',
    subRu: 'Прочувствовать свой прогресс', subEn: 'Savour your progress',
    minutes: 3,
    audio: require('../assets/audio/breeze_proud.mp3'),
    steps: [
      { kind: 'say', ru: 'Эта минута — только чтобы признать, какой ты молодец. Без «но», без «надо больше».', en: 'This minute is just to recognise how well you\'re doing. No "but", no "should do more".', hold: 2 },
      { kind: 'say', ru: 'Вспомни, сколько раз ты хотел закурить — и не закурил. Каждый раз ты выбирал себя.', en: 'Remember all the times you wanted to smoke — and didn\'t. Each time you chose yourself.', hold: 3 },
      { kind: 'say', ru: 'Твоё тело уже благодарит тебя: чище кровь, ровнее сердце, легче дыхание. Это твоя работа.', en: 'Your body is already thanking you: cleaner blood, steadier heart, easier breath. That\'s your doing.', hold: 3 },
      { kind: 'say', ru: 'Деньги, которые не ушли на дым. Запах, который исчез. Контроль, который вернулся. Всё это — ты.', en: 'The money that didn\'t go to smoke. The smell that\'s gone. The control that came back. All of it is you.', hold: 3 },
      { kind: 'say', ru: 'Положи руку на грудь и скажи себе просто.. «Я горжусь тобой». Ты редко это слышишь — услышь сейчас.', en: 'Put a hand on your chest and tell yourself simply: "I\'m proud of you." You rarely hear it — hear it now.', hold: 4 },
      { kind: 'say', ru: 'Запомни это тёплое чувство. Оно — твоё топливо на следующий трудный момент.', en: 'Remember this warm feeling. It\'s your fuel for the next hard moment.', hold: 2 },
    ],
  },
];

export function getPractice(id?: string): AudioPractice | undefined {
  return PRACTICES.find((p) => p.id === id);
}

// Exact spoken text of each recorded session (RU) — used for the read-along
// (📖) so the words on screen match the voice precisely, not the short steps.
export const PRACTICE_SCRIPTS: Record<string, string[]> = {
  calm_now: [
    'Привет. Накрыло сильно — и это нормально. Никуда не уходи, сейчас мы вместе это переждём. Просто дыши со мной, я рядом.',
    'Медленно вдыхай через нос. Раз… два… три… четыре.',
    'Теперь мягко задержи дыхание. Раз, два, три, четыре, пять, шесть, семь.',
    'И долго выдыхай через рот, до самого конца… вот так.',
    'Ещё раз. Вдох носом… раз… два… три… четыре. Задержи… два, три, четыре, пять, шесть, семь. И выдох, медленно, до конца.',
    'Третий раз. Вдох… два… три… четыре. Задержи… и выдыхай длинно.',
    'И последний. Вдох… задержка… и спокойный, долгий выдох.',
    'Чувствуешь? Волна уже спадает. Ты оказался сильнее неё. Ты молодец.',
  ],
  surf: [
    'Не гони тягу. Давай просто понаблюдаем за ней вместе, со стороны. Где ты её чувствуешь в теле? В груди, в горле, в руках? Просто найди это место.',
    'Это всего лишь ощущение. Не приказ — ощущение. Понаблюдай, как оно ведёт себя. Сейчас оно нарастает, как волна в море… поднимается… доходит до самого гребня.',
    'А теперь начинает спадать. Само. Ты ничего не сделал, чтобы его прогнать — а оно уходит.',
    'Дыши спокойно и просто будь рядом с этой волной, пока она катится вниз.',
    'Вот так. Каждая волна, которую ты переждал, делает следующую слабее. Ты прямо сейчас учишь свой мозг: тягу можно пережить, и ничего страшного не случится.',
  ],
  release: [
    'Устройся поудобнее. Если хочешь — закрой глаза. Сделай один глубокий вдох… и длинный, медленный выдох. Отпусти этот день.',
    'Перенеси внимание к стопам. Почувствуй их вес. Пусть станут мягкими и тяжёлыми.',
    'Поднимись выше — голени, колени, бёдра. С каждым выдохом они расслабляются и опускаются.',
    'Отпусти живот. Отпусти грудь. Дыхание свободное, ему некуда спешить.',
    'Расслабь плечи — дай им опуститься подальше от ушей. Отпусти руки, до самых кончиков пальцев.',
    'И лицо. Разожми челюсть. Разгладь лоб, место между бровями.',
    'Всё тело спокойно и тяжело. Побудь в этом покое. Когда будешь готов — не торопясь, медленно открой глаза.',
  ],
  grounding: [
    'Давай вернёмся в этот момент. Никакой спешки — просто замечай то, что я называю.',
    'Сначала найди глазами пять вещей, которые ты видишь прямо сейчас. Назови их про себя.',
    'Теперь прислушайся и найди четыре разных звука вокруг тебя.',
    'Хорошо. Теперь три ощущения телом: одежда на коже, тепло, опора под тобой.',
    'Два запаха — или просто две вещи рядом, которые могли бы пахнуть.',
    'И один вкус у тебя во рту. Сделай один спокойный вдох.',
    'Ты здесь и сейчас. Тяга — это просто волна, а ты крепко стоишь на земле.',
  ],
  sleep: [
    'День закончен. Сигарета тебе сейчас не нужна — тебе нужен покой. Я помогу тебе уснуть. Ляг удобно, расслабь плечи. Дыши тихо и медленно.',
    'Вдох на четыре… и долгий, спокойный выдох на шесть.',
    'Ещё раз. Тихий вдох… и длинный выдох, отпускающий всё лишнее.',
    'С каждым выдохом тело становится чуть тяжелее и мягко опускается в кровать.',
    'Отпусти мысли о завтрашнем дне. Сейчас есть только твоё дыхание и тишина.',
    'Ты — тот, кто не курит. И сегодня ты засыпаешь свободным.',
    'Спокойной ночи.',
  ],
  you_got_this: [
    'Остановись на минуту. Что бы сейчас ни происходило — оно может подождать. Сделай спокойный вдох носом… и медленный выдох… Я здесь, рядом, и никуда не уйду.',
    'Послушай. Ты уже сделал самое трудное — ты начал. Решиться бросить — это не слабость и не случайность, это смелость. И ты её уже проявил.',
    'Подумай, сколько раз за сегодня ты мог закурить и не закурил. Каждый такой момент — маленькая победа. Они не видны со стороны, но они складываются в того, кем ты становишься.',
    'Будет тяжело, иногда очень. И это нормально — так у всех. Тяга — это не приказ, это волна. Она поднимается, доходит до пика и всегда спадает. Ты сильнее любой отдельной волны.',
    'Тело привыкло к никотину годами — дай ему время. С каждым днём становится легче, даже если сегодня в это трудно поверить. Твой мозг прямо сейчас лечит сам себя.',
    'Положи руку на грудь, почувствуй, как ты дышишь. Это твоё дыхание — чистое, без дыма. Оно всегда с тобой, бесплатно, в любой момент.',
    'А теперь повтори про себя, медленно: «Я справляюсь»… «У меня получается»… Ещё раз, и почувствуй это по-настоящему: «Я справляюсь».',
    'Так и есть. Ты справляешься прямо сейчас, в эту самую минуту. Иди дальше — спокойно, уверенно. Я горжусь тобой.',
  ],
  after_slip: [
    'Ты закурил. Сделай вдох и просто будь здесь со мной минуту. Не убегай в чувство вины — давай посмотрим на это спокойно.',
    'Это не провал. Слышишь? Это не провал — это просто момент, который уже прошёл. Одна сигарета — это запятая, а не точка.',
    'Та злость на себя, что поднимается сейчас, — я её знаю. «Всё насмарку, я слабак, какой смысл»… Это называется эффект нарушенного воздержания. Это ловушка мысли, а не правда.',
    'Правда вот в чём: одна сигарета не стирает дни, которые ты прошёл. Деньги, что ты сэкономил, — остались. Часы без дыма — остались. Твоё тело, которое восстанавливалось, не откатилось к началу.',
    'У восьми из десяти бросающих бывают срывы. Восьми из десяти. Те, кто в итоге бросил навсегда, тоже срывались — и просто шли дальше. Разница не в том, чтобы не падать, а в том, чтобы встать.',
    'Не наказывай себя. Стыд не помогает — он тянет руку к следующей сигарете, чтобы заглушить неприятное чувство. А доброта к себе, наоборот, отводит от неё.',
    'Давай мягко: что подтолкнуло тебя сейчас? Стресс? Компания? Привычный момент? Просто заметь это, без осуждения, как будто смотришь со стороны. Это не вина — это подсказка на следующий раз.',
    'А теперь отпусти. Сделай выдох и оставь этот срыв позади. Ты по-прежнему тот, кто бросает. Ничего не сломано. Один спокойный вдох — и мы продолжаем. Вместе.',
  ],
  morning: [
    'Доброе утро. Не спеши вставать в суету. Дай себе эту минуту — она задаст тон всему дню.',
    'Новый день только начался — и он начинается свободным. Чистый лист. Что бы ни было вчера, сегодня всё заново.',
    'Сделай глубокий вдох свежего утреннего воздуха… наполни лёгкие до конца… и медленный, длинный выдох… Ещё раз: вдох… и выдох.',
    'Раньше твоё утро начиналось с сигареты. Первая затяжка, кашель, привычка. А сегодня оно начинается с твоего собственного дыхания — ровного и чистого. Почувствуй разницу.',
    'Твоё тело всю ночь восстанавливалось, пока ты спал. Кислород уже лучше расходится по крови, сердцу легче. Ты просыпаешься чуть здоровее, чем вчера.',
    'Подумай о дне впереди. Будут моменты, где захочется закурить — после кофе, в дороге, в перерыве. Это нормально, ты к ним готов. Если накроет — вспомни: волна проходит за три минуты, и тебе не нужно ничего делать, только переждать.',
    'А теперь поставь одно намерение на сегодня. Скажи про себя: «Сегодня я остаюсь собой — свободным человеком, который не курит». Почувствуй, как это твёрдо звучит.',
    'Хорошего тебе дня. Ты начинаешь его сильным — и я рядом, если понадоблюсь.',
  ],
  i_dont_smoke: [
    'Устройся поудобнее, опусти плечи, закрой глаза, если хочешь. Сделай несколько спокойных вдохов и просто будь здесь.',
    'Сегодня мы не боремся с тягой и не считаем дни. Сегодня мы про другое — про то, кто ты есть.',
    'Долгое время ты называл себя курильщиком. Но подумай: курение — это не ты. Это привычка. Химия. Ритуал, который ты повторял тысячи раз. А ты — это не привычка. Ты гораздо больше.',
    'И эту привычку ты сейчас отпускаешь — спокойно, без драмы. Как откладывают старую, чужую вещь, которая больше не нужна.',
    'Представь себя через год. Ты дышишь полной грудью, поднимаясь по лестнице, — и не задыхаешься. Кожа живее, лицо свежее. По утрам нет кашля. И сигарет в твоей жизни просто нет. Ты о них даже не думаешь.',
    'Побудь в этом образе немного. Этот спокойный, свободный человек — это не фантазия. Это уже ты. Ты просто становишься им с каждым выбором, который делаешь сегодня.',
    'А теперь скажи про себя — спокойно и твёрдо, как факт: «Я не курю»… Ещё раз: «Я не курю, это больше не моё».',
    'Почувствуй, как это правда. Не «я бросаю», не «я пытаюсь», а «я не курю». Это про тебя настоящего. Запомни это чувство — оно с тобой всегда. Открой глаза, когда будешь готов.',
  ],
  let_go_anxiety: [
    'Тревога — одна из самых частых причин потянуться за сигаретой. Внутри всё сжимается, и кажется, что дым поможет. Давай снимем это напряжение иначе, по-настоящему.',
    'Сначала — дыхание. Глубокий вдох носом на четыре… один, два, три, четыре… Задержи на секунду… и долгий, медленный выдох ртом, до самого конца.',
    'Ещё раз. Вдох… и длинный выдох. Выдох всегда длиннее вдоха — именно он успокаивает нервную систему.',
    'Теперь пройдись вниманием по телу. Где живёт напряжение прямо сейчас? Может, плечи подняты к ушам, может, сжата челюсть, или что-то стянуто в животе. Просто найди это место.',
    'Нашёл? На следующем выдохе мягко отпусти его. Опусти плечи, расслабь челюсть, отпусти живот. Пусть это место станет тяжёлым, тёплым и спокойным.',
    'Вот что важно понять. Сигарета дала бы тебе пару минут передышки, но вернула бы тревогу обратно — и с процентами. Никотин не лечит тревогу, он её подкармливает. Тебе это не нужно.',
    'Ты можешь успокоиться сам, прямо сейчас, без неё. Ты это уже делаешь.',
    'Ещё один спокойный вдох… и долгий выдох… С ним отпусти то, что тебя держит. Напряжение уходит, капля за каплей.',
    'Замечаешь? Ты спокойнее, чем минуту назад. Дыхание ровнее, тело мягче. И ты сделал это сам, без сигареты. Запомни — ты так умеешь.',
  ],
  evening_unwind: [
    'День закончился. Раньше это был тот самый момент — «заслуженная» сигарета после всего. Давай отметим конец дня иначе, по-настоящему.',
    'Опусти плечи. Сделай глубокий вдох… и длинный, медленный выдох, отпускающий весь этот день… Ещё раз: вдох… и выдох.',
    'Перебери мысленно, что было сегодня. Что-то получилось, что-то нет. Были разговоры, дела, усталость. И всё это уже позади — ты можешь отложить день, как тяжёлую сумку.',
    'Вот что важно понять. Сигарета никогда не «снимала стресс». Она снимала отзыв от предыдущей сигареты, лечила свою же ломку. Это был замкнутый круг, а не отдых. Сейчас тебе нечего лечить — и это огромное облегчение.',
    'Пройдись вниманием по телу. Расслабь лоб, отпусти челюсть, опусти плечи подальше от ушей, отпусти живот. Вечер — это про покой, тепло и тишину. Не про дым.',
    'Налей себе воды или чая. Почувствуй, как тело начинает отдыхать само, без всякого никотина.',
    'Ты прошёл ещё один день свободным. Вот это — настоящая награда. Не дым, а спокойный вечер и чистое дыхание. Отдыхай — ты заслужил настоящий отдых.',
  ],
  social_urge: [
    'Вокруг курят, и тебя тянет за компанию. Знакомо. Это самый сильный триггер из всех — компания и привычный ритуал. И прямо сейчас мы его обойдём.',
    'Сделай шаг назад — мысленно, а если можешь, то и буквально. Отойди чуть в сторону, вдохни. У тебя есть эта пауза, и в ней — твой выбор.',
    'Запомни простую вещь: тебе не обязательно делать то, что делают все. Ты не обязан никому ничего доказывать и ни за кем повторять.',
    'Посмотри на это со стороны. Через десять минут они потушат сигареты и забудут о них напрочь. А ты будешь тихо гордиться, что не закурил. Эта гордость останется с тобой, а их затяжка — нет.',
    'Займи руки и рот, пока идёт волна. Возьми стакан воды, сделай несколько глотков. Жвачка, телефон, что угодно. Тяга за компанию короткая — её достаточно просто переждать пару минут.',
    'И вот что ещё. Ты не «белая ворона» и не лишний. Ты человек, который выбрал себя посреди соблазна. Со стороны это сильнее и притягательнее, чем кажется — люди уважают тех, кто держит своё решение.',
    'Чувствуешь? Волна уже спадает. Ты остался собой даже там, где это труднее всего, — в компании. Это дорогого стоит. Молодец.',
  ],
  proud: [
    'Остановись на минуту. Эта минута — только для одного: признать, какой ты молодец. Без «но», без «надо было больше», без «ещё далеко». Просто признать.',
    'Закрой глаза, если хочешь, и вспомни. Сколько раз за это время тебе хотелось закурить — и ты не закурил? Десятки раз. Сотни. И каждый раз ты выбирал себя. Это не случайность — это сила.',
    'Твоё тело уже благодарит тебя, прямо сейчас, пока ты слушаешь. Кровь становится чище, сердцу легче биться, дыхание свободнее. Лёгкие потихоньку очищаются. Всё это происходит благодаря тебе.',
    'Подумай о том, что вернулось. Деньги, которые не ушли в дым. Запах, который исчез — с одежды, с рук, изо рта. Вкус еды, который стал ярче. И главное — контроль. Ты снова управляешь собой, а не пачка тобой. Всё это — твоя работа.',
    'А теперь сделай то, что мы редко себе позволяем. Положи руку на грудь, почувствуй своё дыхание под ладонью, и скажи себе тихо и искренне: «Я горжусь тобой»… Ещё раз, медленно: «Я горжусь тобой».',
    'Ты редко слышишь эти слова — от себя особенно. Услышь их сейчас. Дай им осесть.',
    'Запомни это тёплое чувство в груди. Оно никуда не денется. И когда придёт следующий трудный момент — вернись сюда, к этой гордости. Она — твоё топливо. Ты молодец.',
  ],
};

export function practiceScript(id?: string): string[] | undefined {
  return id ? PRACTICE_SCRIPTS[id] : undefined;
}
