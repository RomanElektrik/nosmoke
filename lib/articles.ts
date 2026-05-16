// Knowledge base — short, evidence-based coping articles.
// Sources: Marlatt RP, CDC, Cochrane reviews, USPSTF, Surgeon General 2020,
// Brewer "Craving to Quit", Taylor 2007 (exercise & craving), West 2017 (stress).

import type { IconKey } from '../components/Icon';

export type ArticleCategory = 'craving' | 'slip' | 'triggers' | 'body' | 'meds' | 'motivation';

export type Article = {
  id: string;
  category: ArticleCategory;
  icon: IconKey;
  color: string;
  readMin: number;
  titleRu: string; titleEn: string;
  leadRu: string;  leadEn: string;
  bodyRu: string[]; bodyEn: string[];
  takeawayRu: string; takeawayEn: string;
};

export const ARTICLE_CATEGORY: Record<ArticleCategory, { ru: string; en: string; icon: IconKey; color: string }> = {
  craving:    { ru: 'Тяга',        en: 'Cravings',   icon: 'flame',   color: '#FF9500' },
  slip:       { ru: 'Срыв',        en: 'Slips',      icon: 'feather', color: '#5AC8FA' },
  triggers:   { ru: 'Триггеры',    en: 'Triggers',   icon: 'bolt',    color: '#BF5AF2' },
  body:       { ru: 'Тело',        en: 'Your body',  icon: 'heart',   color: '#FF453A' },
  meds:       { ru: 'Лекарства',   en: 'Medication', icon: 'shield',  color: '#30D158' },
  motivation: { ru: 'Мотивация',   en: 'Motivation', icon: 'sparkle', color: '#34C759' },
};

export const ARTICLES: Article[] = [
  {
    id: 'craving-wave', category: 'craving', icon: 'wave2', color: '#FF9500', readMin: 2,
    titleRu: 'Тяга — это волна', titleEn: 'A craving is a wave',
    leadRu: 'Почему тяга всегда проходит сама, если её не кормить.',
    leadEn: 'Why a craving always passes on its own if you do not feed it.',
    bodyRu: [
      'Тяга ощущается так, будто она будет нарастать бесконечно, пока ты не закуришь. Это иллюзия. Тяга устроена как волна: она поднимается, достигает пика и спадает. Обычно весь цикл — 3–5 минут.',
      'Сигарета кажется единственным способом «выключить» тягу. На самом деле она просто совпадает по времени со спадом волны — и мозг делает ложный вывод: «помогло». Если не закурить, волна спадёт точно так же, только без новой дозы никотина.',
      'Каждая прожитая волна ослабляет следующую. Ты буквально переучиваешь мозг: «тягу можно пережить». Через 2–4 недели волны становятся короче, реже и слабее.',
      'Что делать в момент волны: не бороться и не уговаривать себя, а наблюдать. Где ощущение в теле? Какое оно — жжёт, давит, крутит? Назови его про себя. Сделай несколько длинных выдохов. Это техника «скольжение по тяге» (urge surfing).',
    ],
    bodyEn: [
      'A craving feels like it will grow forever until you smoke. That is an illusion. A craving works like a wave: it rises, peaks and falls. The whole cycle is usually 3–5 minutes.',
      'A cigarette seems like the only way to switch the craving off. In reality it just coincides with the wave falling — and the brain draws a false conclusion: "it helped". If you do not smoke, the wave falls just the same, only without a new dose of nicotine.',
      'Every wave you ride weakens the next one. You are literally retraining the brain: "a craving can be survived". Within 2–4 weeks waves get shorter, rarer and weaker.',
      'What to do during a wave: do not fight or argue with yourself — observe. Where is the sensation in the body? What is it like? Name it silently. Take a few long exhales. This is urge surfing.',
    ],
    takeawayRu: 'Тяга длится 3–5 минут и проходит сама. Твоя задача — не закурить, а переждать волну.',
    takeawayEn: 'A craving lasts 3–5 minutes and passes by itself. Your job is not to smoke — just to ride the wave.',
  },
  {
    id: 'craving-now', category: 'craving', icon: 'bolt', color: '#FF9500', readMin: 2,
    titleRu: 'Тянет прямо сейчас — что сделать', titleEn: 'Craving right now — what to do',
    leadRu: 'Короткий план на ближайшие 5 минут.',
    leadEn: 'A short plan for the next 5 minutes.',
    bodyRu: [
      '1. Засеки время. Скажи себе: «я не курю ближайшие 5 минут». Не «никогда» — только 5 минут. Это посильно.',
      '2. Дыши. Длинный выдох вдвое длиннее вдоха успокаивает нервную систему за минуту. Открой в приложении дыхательную практику или просто сделай 10 медленных выдохов.',
      '3. Смени обстановку. Встань, выйди из комнаты, умой лицо холодной водой, выпей стакан воды залпом. Тяга привязана к месту и позе — измени их.',
      '4. Займи руки и рот. Орех, мятная жвачка, кубик льда, эспандер. Это не «детский сад» — это разрыв ритуала.',
      '5. Если очень тяжело — открой SOS в приложении или отвлекись на игру. Через 5 минут проверь: волна почти всегда уже спала.',
    ],
    bodyEn: [
      '1. Start a timer. Tell yourself: "I will not smoke for the next 5 minutes." Not "never" — just 5 minutes. That is doable.',
      '2. Breathe. A long exhale, twice as long as the inhale, calms the nervous system within a minute. Do 10 slow exhales.',
      '3. Change your setting. Stand up, leave the room, splash cold water on your face, drink a glass of water. A craving is tied to place and posture — change them.',
      '4. Occupy hands and mouth. A nut, mint gum, an ice cube, a hand gripper. This is not childish — it breaks the ritual.',
      '5. If it is very hard — open SOS in the app or distract yourself with the game. After 5 minutes, check: the wave has almost always passed.',
    ],
    takeawayRu: 'Не «бросить навсегда», а «не курить 5 минут». Дыши, двигайся, займи руки — волна спадёт.',
    takeawayEn: 'Not "quit forever" — just "do not smoke for 5 minutes". Breathe, move, occupy your hands.',
  },
  {
    id: 'craving-day3', category: 'craving', icon: 'flame', color: '#FF9500', readMin: 2,
    titleRu: 'Почему 3-й день самый трудный', titleEn: 'Why day 3 is the hardest',
    leadRu: 'И почему это хорошая новость.',
    leadEn: 'And why that is good news.',
    bodyRu: [
      'Никотин уходит с рецепторов мозга примерно за 72 часа. Именно на 2–4 день симптомы отмены достигают пика: раздражительность, тревога, плохой сон, сильная тяга.',
      'Это пугает: кажется, что дальше будет только хуже. Но всё наоборот. Пик — это поворотная точка. После 3-го дня физическая зависимость резко слабеет, потому что никотина в теле уже почти нет.',
      'Если ты дошёл до 3-го дня — самое тяжёлое уже происходит прямо сейчас, а не впереди. Это не повод сдаться, это повод продержаться ещё чуть-чуть.',
      'В эти дни помоги себе: больше сна, меньше кофе и алкоголя, лёгкая физическая нагрузка, простая еда. Симптомы отмены — временные. Через неделю их почти не будет.',
    ],
    bodyEn: [
      'Nicotine clears the brain receptors in about 72 hours. It is on days 2–4 that withdrawal symptoms peak: irritability, anxiety, poor sleep, strong cravings.',
      'It is scary — it feels like it will only get worse. The opposite is true. The peak is a turning point. After day 3 the physical dependence drops sharply, because there is almost no nicotine left in the body.',
      'If you have reached day 3 — the hardest part is happening right now, not ahead of you. That is not a reason to give up, it is a reason to hold on a little longer.',
      'During these days: more sleep, less coffee and alcohol, light exercise, simple food. Withdrawal symptoms are temporary. In a week they will be almost gone.',
    ],
    takeawayRu: 'Пик отмены — 2–4 день. Это значит: дальше будет легче, а не тяжелее.',
    takeawayEn: 'Withdrawal peaks on days 2–4. It means it gets easier from here, not harder.',
  },
  {
    id: 'craving-halt', category: 'craving', icon: 'pulse', color: '#FF9500', readMin: 2,
    titleRu: 'HALT: проверь 4 нужды', titleEn: 'HALT: check 4 needs',
    leadRu: 'Часто тебе нужен не никотин, а что-то другое.',
    leadEn: 'Often you need something other than nicotine.',
    bodyRu: [
      'HALT — это четыре состояния, в которых тяга резко усиливается: Hungry (голоден), Angry (зол), Lonely (одинок), Tired (устал).',
      'Когда хочется закурить — остановись и спроси себя по очереди: я голоден? я злюсь? мне одиноко? я устал? Часто настоящая нужда — одна из этих, а сигарета просто маскирует её.',
      'Если голоден — поешь. Зол — выпусти эмоцию: подвигайся, напиши, проговори. Одинок — напиши близкому. Устал — отдохни или поспи. Это и есть решение, а не сигарета.',
      'Сигарета не кормит, не успокаивает и не даёт отдых — она лишь ненадолго заглушает сигнал тела. Удовлетвори настоящую потребность — и тяга часто исчезает сама.',
    ],
    bodyEn: [
      'HALT is four states in which cravings spike: Hungry, Angry, Lonely, Tired.',
      'When you want to smoke — pause and ask yourself in turn: am I hungry? angry? lonely? tired? Often the real need is one of these, and the cigarette just masks it.',
      'Hungry — eat. Angry — release it: move, write, talk it out. Lonely — text someone close. Tired — rest or sleep. That is the solution, not a cigarette.',
      'A cigarette does not feed, calm or rest you — it only briefly mutes the body signal. Meet the real need and the craving often disappears on its own.',
    ],
    takeawayRu: 'Голоден, зол, одинок, устал? Закрой настоящую нужду — и тяга часто уходит сама.',
    takeawayEn: 'Hungry, angry, lonely, tired? Meet the real need and the craving often fades on its own.',
  },
  {
    id: 'slip-not-fail', category: 'slip', icon: 'feather', color: '#5AC8FA', readMin: 2,
    titleRu: 'Срыв — это не провал', titleEn: 'A slip is not a failure',
    leadRu: 'Почти все, кто бросил насовсем, срывались по пути.',
    leadEn: 'Almost everyone who quit for good slipped along the way.',
    bodyRu: [
      'Срыв — это не «всё пропало». Это часть процесса. По исследованиям, большинству людей нужно несколько попыток, прежде чем получится окончательно. Это не слабость — это статистика.',
      'Разница между теми, кто бросил, и теми, кто вернулся к курению, не в том, что первые не срывались. Разница в реакции на срыв. Одни сказали «я провалился, смысла нет» и закурили снова. Другие сказали «это данные» — и продолжили.',
      'Одна сигарета не отменяет 14 дней без курения. Твоё тело всё равно очищалось эти 14 дней. Счётчик в приложении не обнуляется намеренно — потому что прогресс реально есть.',
      'После срыва важно одно: не вторая сигарета. Сразу разбери — что было триггером? что попробуешь иначе? — и вернись на путь. Чем быстрее вернёшься, тем меньше срыв значит.',
    ],
    bodyEn: [
      'A slip is not "everything is lost". It is part of the process. Research shows most people need several attempts before it sticks. That is not weakness — it is statistics.',
      'The difference between those who quit and those who went back is not that the first group never slipped. The difference is the reaction to the slip. Some said "I failed, no point" and smoked again. Others said "this is data" and kept going.',
      'One cigarette does not cancel 14 smoke-free days. Your body still healed during those 14 days. The counter in the app deliberately does not reset — because the progress is real.',
      'After a slip one thing matters: not the second cigarette. Immediately review — what was the trigger? what will you try differently? — and return to the path.',
    ],
    takeawayRu: 'Срыв ≠ провал. Опасна не первая сигарета, а вторая. Разбери триггер и вернись.',
    takeawayEn: 'A slip is not a failure. The danger is not the first cigarette but the second. Review and return.',
  },
  {
    id: 'slip-ave', category: 'slip', icon: 'brain', color: '#5AC8FA', readMin: 2,
    titleRu: 'Эффект «раз сорвался — гори всё»', titleEn: 'The "I blew it" effect',
    leadRu: 'Самая опасная мысль после срыва — и как её обезвредить.',
    leadEn: 'The most dangerous thought after a slip — and how to defuse it.',
    bodyRu: [
      'У этого есть название — эффект нарушения воздержания (AVE). После одной сигареты включается мысль: «всё, я сорвался, я слабак, день потерян — можно курить дальше».',
      'Именно эта мысль, а не сама сигарета, превращает разовый срыв в полный возврат к курению. Одна сигарета — это одна сигарета. Пачка за вечер — это уже работа AVE.',
      'Обезвредить эффект помогает переатрибуция. Срыв — это не «я слабак» (внутренняя, постоянная причина), а «я попал в сильный триггер и не был к нему готов» (внешняя, конкретная, исправимая причина).',
      'Из второй формулировки есть выход: подготовить план на этот триггер. Из первой выхода нет — она просто рушит самооценку. Выбирай формулировку, из которой есть действие.',
    ],
    bodyEn: [
      'This has a name — the Abstinence Violation Effect (AVE). After one cigarette a thought kicks in: "that is it, I slipped, I am weak, the day is lost — I might as well keep smoking".',
      'It is this thought, not the cigarette itself, that turns a one-off slip into a full relapse. One cigarette is one cigarette. A pack in an evening is AVE at work.',
      'Reattribution defuses the effect. A slip is not "I am weak" (an internal, permanent cause) but "I hit a strong trigger and was not ready" (an external, specific, fixable cause).',
      'The second framing has a way out: prepare a plan for that trigger. The first has none — it just wrecks your self-esteem. Choose the framing that leads to an action.',
    ],
    takeawayRu: 'Срыв в рецидив превращает мысль «гори всё», а не сигарета. Причина — триггер, а не «я слабак».',
    takeawayEn: 'It is the "I blew it" thought, not the cigarette, that causes relapse. The cause is a trigger, not weakness.',
  },
  {
    id: 'trig-coffee', category: 'triggers', icon: 'drop', color: '#BF5AF2', readMin: 2,
    titleRu: 'Кофе и сигарета: разорвать связку', titleEn: 'Coffee and cigarette: break the link',
    leadRu: 'Почему утренний кофе так тянет закурить.',
    leadEn: 'Why morning coffee makes you want to smoke.',
    bodyRu: [
      'Если ты годами курил с кофе, мозг прочно связал их в одну пару. Чашка кофе сама по себе становится сигналом «пора курить» — даже без всякой тяги к никотину.',
      'Это не зависимость от кофе, это условный рефлекс. Хорошая новость: рефлекс можно разорвать так же, как он образовался — повторением нового сценария.',
      'Что делать: первую неделю-две меняй ритуал кофе. Пей его в другом месте (не там, где курил), другой рукой, быстрее обычного. Сделай 5 минут дыхания ДО первой чашки — это разрывает ассоциацию.',
      'Кофеин ускоряет вывод никотина и может усиливать тягу в первые дни — есть смысл временно уменьшить количество кофе. Через 2–3 недели кофе перестанет тянуть за собой сигарету.',
    ],
    bodyEn: [
      'If you smoked with coffee for years, the brain firmly linked them as a pair. A cup of coffee itself becomes a "time to smoke" signal — even without any nicotine craving.',
      'This is not coffee addiction, it is a conditioned reflex. Good news: a reflex can be broken the same way it formed — by repeating a new script.',
      'What to do: for the first week or two, change the coffee ritual. Drink it in a different place, with the other hand, faster than usual. Do 5 minutes of breathing BEFORE the first cup.',
      'Caffeine speeds nicotine clearance and can boost cravings in the first days — it makes sense to cut coffee temporarily. After 2–3 weeks coffee will stop pulling a cigarette with it.',
    ],
    takeawayRu: 'Кофе тянет курить из-за рефлекса. Меняй ритуал кофе 2 недели — связка распадётся.',
    takeawayEn: 'Coffee triggers smoking via a reflex. Change the coffee ritual for 2 weeks and the link breaks.',
  },
  {
    id: 'trig-alcohol', category: 'triggers', icon: 'drop2', color: '#BF5AF2', readMin: 2,
    titleRu: 'Алкоголь — главная ловушка', titleEn: 'Alcohol is the main trap',
    leadRu: 'Самая частая причина срыва — вечер с выпивкой.',
    leadEn: 'The most common cause of a slip — an evening with drinks.',
    bodyRu: [
      'Алкоголь — триггер номер один для срывов. Причин три, и все работают вместе.',
      'Первое: алкоголь снижает самоконтроль. Префронтальная кора — та часть мозга, что говорит «не надо» — отключается первой. Решение «всего одну» принимается легко именно потому, что ты выпил.',
      'Второе: связка. Если ты годами курил в барах и за выпивкой, обстановка сама по себе — сильный сигнал. Третье: вокруг часто курят, и предложат.',
      'Что делать первые недели: по возможности избегай ситуаций с алкоголем или резко ограничь дозу. Если идёшь — реши заранее, конкретно: «если предложат — отвечу так-то», «выйду на улицу с теми, кто курит, или нет». План, придуманный трезвым, спасает.',
    ],
    bodyEn: [
      'Alcohol is the number one trigger for slips. There are three reasons, and they all work together.',
      'First: alcohol lowers self-control. The prefrontal cortex — the part that says "do not" — is the first to switch off. The decision "just one" is easy precisely because you have been drinking.',
      'Second: the link. If you smoked in bars and over drinks for years, the setting itself is a strong cue. Third: people around often smoke and will offer.',
      'What to do in the first weeks: avoid alcohol situations where possible, or sharply limit the dose. If you go — decide in advance, concretely: what you will say if offered, whether you step outside with smokers. A plan made sober saves you.',
    ],
    takeawayRu: 'Алкоголь снимает самоконтроль — отсюда срывы. Первые недели ограничь его и иди с планом.',
    takeawayEn: 'Alcohol removes self-control — hence slips. Limit it in the first weeks and go in with a plan.',
  },
  {
    id: 'trig-stress', category: 'triggers', icon: 'brain', color: '#BF5AF2', readMin: 2,
    titleRu: 'Никотин не снимает стресс', titleEn: 'Nicotine does not relieve stress',
    leadRu: 'Главный миф, который держит людей на сигарете.',
    leadEn: 'The main myth that keeps people smoking.',
    bodyRu: [
      'Кажется, что сигарета успокаивает. На самом деле всё наоборот: курильщик живёт с более высоким базовым уровнем стресса, чем некурящий.',
      'Вот как это устроено. Через час-два после сигареты начинается лёгкая отмена никотина — нарастает раздражение и напряжение. Следующая сигарета снимает именно эту отмену, и мозг читает это как «расслабление».',
      'То есть сигарета не убирает стресс жизни — она лечит свой собственный синдром отмены, который сама же и создала. Это замкнутый круг, который ты принимаешь за «помощь».',
      'Исследования показывают: через несколько недель после отказа базовый уровень тревоги у бросивших СНИЖАЕТСЯ. Не курить — спокойнее, чем курить. Просто это становится видно не сразу.',
    ],
    bodyEn: [
      'It feels like a cigarette calms you. In fact the opposite is true: a smoker lives with a higher baseline stress level than a non-smoker.',
      'Here is how it works. An hour or two after a cigarette mild nicotine withdrawal begins — irritation and tension rise. The next cigarette relieves exactly that withdrawal, and the brain reads it as "relaxation".',
      'So a cigarette does not remove life stress — it treats its own withdrawal syndrome, which it created itself. A closed loop you mistake for "help".',
      'Studies show: a few weeks after quitting, baseline anxiety in quitters goes DOWN. Not smoking is calmer than smoking — it just is not visible right away.',
    ],
    takeawayRu: 'Сигарета снимает не стресс, а свою же отмену. Через недели без неё тревоги становится меньше.',
    takeawayEn: 'A cigarette relieves its own withdrawal, not stress. Weeks later, baseline anxiety is lower.',
  },
  {
    id: 'body-timeline', category: 'body', icon: 'heart', color: '#FF453A', readMin: 2,
    titleRu: 'Что происходит с телом по дням', titleEn: 'What happens to your body, day by day',
    leadRu: 'Восстановление начинается через 20 минут.',
    leadEn: 'Recovery starts within 20 minutes.',
    bodyRu: [
      'Тело начинает чиниться почти сразу после последней сигареты — и не останавливается.',
      '20 минут: пульс и давление приходят в норму. 8–12 часов: уровень угарного газа в крови падает вдвое, к тканям возвращается кислород.',
      '2 суток: никотин полностью выведен, возвращаются вкус и обоняние. 3 суток: бронхи расслабляются, дышать легче. 2–12 недель: улучшается кровообращение, функция лёгких растёт.',
      '1–9 месяцев: уходит кашель курильщика, реснитчатый эпителий лёгких восстанавливается и очищает их. Через годы без курения риск инфаркта, инсульта и рака лёгких снижается в разы.',
      'Каждый прожитый без сигарет день — это не просто «не навредил». Это активное восстановление, которое уже идёт в твоём теле прямо сейчас.',
    ],
    bodyEn: [
      'The body starts repairing itself almost immediately after the last cigarette — and does not stop.',
      '20 minutes: heart rate and blood pressure normalize. 8–12 hours: carbon monoxide in the blood halves, oxygen returns to tissues.',
      '2 days: nicotine is fully cleared, taste and smell return. 3 days: bronchi relax, breathing is easier. 2–12 weeks: circulation improves, lung function grows.',
      '1–9 months: the smoker\'s cough fades, the lung cilia regenerate and clear the lungs. Over years smoke-free, the risk of heart attack, stroke and lung cancer drops several-fold.',
      'Every smoke-free day is not just "no harm done". It is active recovery already happening in your body right now.',
    ],
    takeawayRu: 'Восстановление идёт уже с 20-й минуты. Каждый день без сигарет тело реально чинит себя.',
    takeawayEn: 'Recovery begins at minute 20. Every smoke-free day, your body is actively repairing itself.',
  },
  {
    id: 'body-weight', category: 'body', icon: 'leaf', color: '#FF453A', readMin: 2,
    titleRu: 'Прибавка в весе — правда?', titleEn: 'Weight gain — is it true?',
    leadRu: 'Что реально происходит и что с этим делать.',
    leadEn: 'What really happens and what to do about it.',
    bodyRu: [
      'Да, часть людей после отказа немного набирает вес — в среднем 2–4 кг за первые месяцы. Но это не неизбежно и точно не повод продолжать курить.',
      'Причин две. Первая: никотин слегка ускорял обмен веществ и подавлял аппетит — без него тело возвращается к норме. Вторая: еда становится заменой ритуалу «рука-рот» и способом снять тягу.',
      'Что помогает: пей воду, держи под рукой не сладкое, а орехи/овощи/жвачку. Добавь 10–15 минут ходьбы — это снижает и тягу, и аппетит. Не садись на жёсткую диету одновременно с отказом — слишком много нагрузки сразу.',
      'И главное в цифрах: вред от 2–4 кг несопоставимо меньше вреда от курения. Чтобы сравняться с риском курильщика по сердцу, пришлось бы набрать порядка 35–40 кг. Сначала бросаем — вес возвращаем потом.',
    ],
    bodyEn: [
      'Yes, some people gain a little weight after quitting — on average 2–4 kg in the first months. But it is not inevitable and certainly not a reason to keep smoking.',
      'Two reasons. First: nicotine slightly sped up metabolism and suppressed appetite — without it the body returns to normal. Second: food becomes a replacement for the hand-to-mouth ritual.',
      'What helps: drink water, keep nuts/vegetables/gum at hand instead of sweets. Add 10–15 minutes of walking — it lowers both cravings and appetite. Do not start a strict diet at the same time as quitting.',
      'And the key numbers: the harm from 2–4 kg is incomparably smaller than the harm from smoking. Quit first — deal with weight later.',
    ],
    takeawayRu: 'Возможны 2–4 кг — это поправимо и в разы безопаснее курения. Сначала бросаем.',
    takeawayEn: '2–4 kg is possible — fixable and far safer than smoking. Quit first, address weight later.',
  },
  {
    id: 'body-vape', category: 'body', icon: 'wind', color: '#FF453A', readMin: 2,
    titleRu: 'Вейп бросить не легче', titleEn: 'Vaping is not easier to quit',
    leadRu: 'Почему «перешёл на вейп» — часто не выход.',
    leadEn: 'Why "switched to vaping" is often not a solution.',
    bodyRu: [
      'Вейп ощущается мягче сигарет, но зависимость он создаёт ту же — никотиновую, а иногда и сильнее.',
      'Причина — в дозе и доступе. У сигарет есть естественные паузы: пачка кончается, на улице холодно, докурил — выбросил. У вейпа пауз нет: затяжка занимает секунду, устройство всегда в кармане, крепость жидкости часто выше, чем кажется.',
      'Из-за этого вейпер нередко получает больше никотина за день, чем курильщик, и парит «на автомате», даже не замечая.',
      'Подход к отказу — тот же, что и для сигарет: те же триггеры, те же техники, те же волны тяги. Если снижаешь постепенно — снижай крепость жидкости (мг никотина), а не только число затяжек. И убирай устройство из зоны лёгкого доступа.',
    ],
    bodyEn: [
      'Vaping feels milder than cigarettes, but it creates the same dependence — nicotine — and sometimes a stronger one.',
      'The reason is dose and access. Cigarettes have natural pauses: the pack runs out, it is cold outside, you finish and discard. Vaping has no pauses: a puff takes a second, the device is always in your pocket, the liquid strength is often higher than it seems.',
      'Because of this a vaper often gets more nicotine per day than a smoker, and vapes on autopilot without noticing.',
      'The approach to quitting is the same as for cigarettes: same triggers, same techniques, same craving waves. If tapering — lower the liquid strength (nicotine mg), not just puff count. And move the device out of easy reach.',
    ],
    takeawayRu: 'Вейп — та же никотиновая зависимость, часто крепче. Бросают так же: триггеры, техники, волны.',
    takeawayEn: 'Vaping is the same nicotine dependence, often stronger. Quit it the same way.',
  },
  {
    id: 'meds-overview', category: 'meds', icon: 'shield', color: '#30D158', readMin: 3,
    titleRu: 'Лекарства: цитизин, бупропион, варениклин', titleEn: 'Medication: cytisine, bupropion, varenicline',
    leadRu: 'Когда таблетки помогают и как они работают.',
    leadEn: 'When pills help and how they work.',
    bodyRu: [
      'Поведенческие техники работают для многих, но при сильной зависимости одних техник бывает мало. Тогда помогает медикаментозная поддержка — она снижает тягу и облегчает отмену.',
      'Цитизин (Табекс) — растительный препарат, в России продаётся без рецепта. Мягко занимает никотиновые рецепторы, из-за чего сигарета даёт меньше «эффекта». Курс около 25 дней, недорогой.',
      'Бупропион — рецептурный антидепрессант, который снижает тягу; особенно уместен, если есть сопутствующая подавленность. Варениклин — самый эффективный по доказательной базе препарат, тоже рецептурный.',
      'Важно: приложение не назначает лекарства. Бупропион и варениклин подбирает только врач — у них есть противопоказания и побочные эффекты, которые нужно проверить. Даже безрецептурный цитизин стоит обсудить с врачом или фармацевтом.',
      'Если врач подобрал препарат — приложение поможет вести расписание приёма и не пропускать дозы. Регулярность приёма напрямую влияет на результат.',
    ],
    bodyEn: [
      'Behavioural techniques work for many, but with strong dependence techniques alone may not be enough. Then medication support helps — it lowers cravings and eases withdrawal.',
      'Cytisine (Tabex) is a plant-derived drug, sold over the counter in Russia. It gently occupies nicotine receptors, so a cigarette gives less of an "effect". The course is about 25 days and inexpensive.',
      'Bupropion is a prescription antidepressant that lowers cravings; especially relevant if low mood coexists. Varenicline is the most effective drug by the evidence base, also prescription.',
      'Important: the app does not prescribe medication. Bupropion and varenicline are chosen only by a doctor — they have contraindications and side effects to check. Even over-the-counter cytisine is worth discussing with a doctor or pharmacist.',
      'If a doctor has chosen a drug — the app helps you keep the dosing schedule and not miss doses. Regular dosing directly affects the result.',
    ],
    takeawayRu: 'При сильной зависимости лекарства помогают. Бупропион и варениклин — только через врача.',
    takeawayEn: 'With strong dependence, medication helps. Bupropion and varenicline — only via a doctor.',
  },
  {
    id: 'mot-money', category: 'motivation', icon: 'sparkle', color: '#34C759', readMin: 2,
    titleRu: 'Куда уходят деньги', titleEn: 'Where the money goes',
    leadRu: 'Маленькая ежедневная сумма складывается в крупную.',
    leadEn: 'A small daily sum adds up to a large one.',
    bodyRu: [
      'Пачка в день кажется небольшим расходом. Но это ежедневный платёж, который не прекращается, и в сумме за год выходит сумма, на которую можно купить что-то заметное.',
      'Приложение считает это за тебя — в реальном времени, с первой минуты. Это не абстракция: ты видишь конкретные деньги, которые остаются у тебя, а не уходят в дым.',
      'Чтобы мотивация работала, сделай экономию видимой и конкретной. Поставь цель в копилке — не «накопить вообще», а на конкретную вещь: наушники, поездку, подарок близкому.',
      'Когда сэкономленное превращается во что-то реальное, что ты держишь в руках, — это якорь. В трудный день он напоминает: отказ уже принёс тебе что-то хорошее, а не только отнял сигарету.',
    ],
    bodyEn: [
      'A pack a day seems like a small expense. But it is a daily payment that never stops, and over a year it adds up to a sum that buys something noticeable.',
      'The app counts this for you — in real time, from the first minute. It is not an abstraction: you see concrete money that stays with you instead of going up in smoke.',
      'For motivation to work, make the savings visible and concrete. Set a goal in the jar — not "save in general", but for a specific thing: headphones, a trip, a gift.',
      'When the saved money turns into something real you can hold, it becomes an anchor. On a hard day it reminds you: quitting has already given you something good.',
    ],
    takeawayRu: 'Поставь конкретную цель в копилке. Когда экономия станет вещью — это якорь в трудный день.',
    takeawayEn: 'Set a concrete jar goal. When savings become a real thing, they anchor you on hard days.',
  },
];

export function getArticle(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}
