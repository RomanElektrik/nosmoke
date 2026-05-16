// Method-transition wizard. Used when current method failed and we need to
// move the user — but with respect, not by slapping a new label.
// Steps: reality check → reflect → choose method → quit date → preparation
//        → bridge plan → commit.
//
// Sources:
// • USPSTF 5A's (Ask/Advise/Assess/Assist/Arrange) — structured transition.
// • MI (Miller & Rollnick) — "do you still want to quit" elicits change-talk.
// • Hughes 2004 Nicotine Tob Res — multiple attempts are the norm; reflection
//   between attempts strongly predicts next-attempt success.
// • Marlatt RP — analyse what failed before changing intervention.

import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { useTranslation, currentLang } from '../lib/i18n';
import { useAppState, update } from '../lib/storage';
import type { StepLevel } from '../lib/storage';
import { STEPS, getStep, alternativesFor, prepChecklist, recommendStep, pharmaBlocked } from '../lib/stepped';
import { scheduleQuitProgram } from '../lib/notifications';
import { Icon } from '../components/Icon';

type Phase = 'reality' | 'paused' | 'reflect' | 'choose' | 'date' | 'prep' | 'bridge' | 'commit' | 'done';

const tt = (ru: string, en: string) => (currentLang() === 'ru' ? ru : en);

export default function Transition() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const [state] = useAppState();
  const p = state.profile;

  const [phase, setPhase] = useState<Phase>('reality');
  const [reflect, setReflect] = useState<string[]>([]);
  const [pickedMethod, setPickedMethod] = useState<StepLevel | null>(null);
  const [daysOffset, setDaysOffset] = useState<number>(0); // days from now until new quit date
  const [bridgeMode, setBridgeMode] = useState<'none' | 'last_pack' | 'taper'>('none');
  const [bridgePerDay, setBridgePerDay] = useState<string>('');
  const [prep, setPrep] = useState<{ id: string; done: boolean }[]>([]);

  // Hooks must run unconditionally — never place an early return before them.
  const fager = p?.fagerstromScore ?? 0;
  const alts: StepLevel[] = useMemo(
    () => alternativesFor(p?.currentStep, fager, pharmaBlocked(p)),
    [p?.currentStep, fager, p?.healthFlags],
  );

  if (!p) return null;
  const recommended = recommendStep(p);
  const slips7 = state.slips.filter((ts) => ts > Date.now() - 7 * 86400_000).length;
  const slipsTotal = state.slips.length;

  function close() { router.canGoBack() ? router.back() : router.replace('/(tabs)'); }

  // ---------- 1. REALITY CHECK ----------
  if (phase === 'reality') {
    const opts = [
      { v: 'yes',    ru: 'Да, точно хочу',                  en: 'Yes, I do',              color: '#34C759' },
      { v: 'unsure', ru: 'Хочу, но не уверен, что справлюсь', en: 'I want to, but unsure', color: '#FF9500' },
      { v: 'paused', ru: 'Уже не уверен, что хочу',         en: 'Not sure I want anymore', color: '#9AA3AF' },
    ] as const;
    return (
      <Wrap onClose={close}>
        <Header step={1} total={6} title={tt('Честный вопрос', 'Honest question')} />
        <Text style={{ color: t.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.6, lineHeight: 32 }}>
          {tt('Ты всё ещё хочешь бросить курить?', 'Do you still want to quit smoking?')}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 20 }}>
          {tt('Не верный/неверный ответ. Без этого мы только теряем время.', 'No right or wrong. Without honesty we just waste time.')}
        </Text>
        <View style={{ gap: 10, marginTop: 8 }}>
          {opts.map((o) => (
            <Pressable key={o.v} onPress={async () => {
              Haptics.selectionAsync();
              await update((s) => ({ ...s, profile: s.profile ? { ...s.profile, wantsToQuit: o.v as any } : s.profile }));
              if (o.v === 'paused') setPhase('paused');
              else setPhase('reflect');
            }}
              style={{
                padding: 16, borderRadius: radius.lg,
                backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border,
                flexDirection: 'row', alignItems: 'center', gap: 12,
              }}>
              <View style={{ width: 6, alignSelf: 'stretch', borderRadius: 3, backgroundColor: o.color }} />
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', flex: 1 }}>
                {lang === 'ru' ? o.ru : o.en}
              </Text>
              <Text style={{ color: t.textDim, fontSize: 18 }}>›</Text>
            </Pressable>
          ))}
        </View>
      </Wrap>
    );
  }

  // ---------- PAUSED — harm reduction / pause mode ----------
  if (phase === 'paused') {
    return (
      <Wrap onClose={close}>
        <LinearGradient colors={['#9AA3AF40', '#9AA3AF10']}
          style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.hand size={56} color="#9AA3AF" />
        </LinearGradient>
        <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>
          {tt('Ставим на паузу.', 'Put on pause.')}
        </Text>
        <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>
          {tt('Ок. Заставлять не имеет смысла. Программа ставится на паузу — никаких пушей и давления. Дневник, копилка и статистика остаются — они пригодятся, когда снова захочешь.',
              "OK. Forcing this makes no sense. The program is paused — no pushes, no pressure. Journal, jar, stats stay — they'll be there when you want again.")}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 19 }}>
          {tt('В Профиле можно вернуться в любой момент: «Перетестировать зависимость» → новый план.',
              'In Profile you can return any time: "Retake dependence test" → fresh plan.')}
        </Text>
        <Pressable onPress={close}
          style={{ marginTop: 12, padding: 18, borderRadius: radius.xl, backgroundColor: '#9AA3AF', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{tt('Понятно', 'OK')}</Text>
        </Pressable>
      </Wrap>
    );
  }

  // ---------- 2. REFLECT — what didn't work ----------
  if (phase === 'reflect') {
    const causes = [
      { v: 'no_tech',     ru: 'Не делал техники из приложения',          en: "Didn't do app techniques" },
      { v: 'tech_weak',   ru: 'Делал, но в момент тяги не помогло',     en: 'Did them, but they failed at peak' },
      { v: 'trigger',     ru: 'Триггер был сильнее меня',                en: 'The trigger was stronger than me' },
      { v: 'env',         ru: 'Окружение мешало (друзья/работа/дом)',    en: 'Environment got in the way' },
      { v: 'belief',      ru: 'Не верил, что метод сработает',           en: "Didn't believe the method would work" },
      { v: 'too_hard',    ru: 'Слишком тяжело физически',                en: 'Too physically hard' },
      { v: 'stress',      ru: 'Сильный стресс / ситуация в жизни',       en: 'Major stress / life event' },
    ];
    function toggle(v: string) {
      Haptics.selectionAsync();
      setReflect((r) => (r.includes(v) ? r.filter((x) => x !== v) : [...r, v]));
    }
    return (
      <Wrap onClose={close}>
        <Header step={2} total={6} title={tt('Что не сработало', 'What did not work')} />
        <Text style={{ color: t.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 }}>
          {tt('Срывов за неделю: ', 'Slips this week: ')}
          <Text style={{ color: '#FF9F0A' }}>{slips7}</Text>
          <Text style={{ color: t.textDim, fontWeight: '400', fontSize: 14 }}>
            {tt(`. Всего: ${slipsTotal}.`, `. Total: ${slipsTotal}.`)}
          </Text>
        </Text>
        <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 20 }}>
          {tt('Отметь всё что сработало против тебя. Это поможет подобрать правильный следующий шаг.',
              'Tick everything that worked against you. Helps pick the right next step.')}
        </Text>
        <View style={{ gap: 8 }}>
          {causes.map((c) => {
            const sel = reflect.includes(c.v);
            return (
              <Pressable
                key={c.v}
                onPress={() => toggle(c.v)}
                style={{
                  padding: 14, borderRadius: radius.md,
                  backgroundColor: sel ? t.accentSoft : t.bgElev,
                  borderWidth: 1, borderColor: sel ? t.accent : t.border,
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 6,
                  borderWidth: 2, borderColor: sel ? t.accent : t.border,
                  backgroundColor: sel ? t.accent : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel && <Icon.check size={13} color="#fff" />}
                </View>
                <Text style={{ color: t.text, fontSize: 14, flex: 1 }}>{lang === 'ru' ? c.ru : c.en}</Text>
              </Pressable>
            );
          })}
        </View>
        <Footer onBack={() => setPhase('reality')} onNext={() => setPhase('choose')} />
      </Wrap>
    );
  }

  // ---------- 3. CHOOSE METHOD ----------
  if (phase === 'choose') {
    return (
      <Wrap onClose={close}>
        <Header step={3} total={6} title={tt('Выбираем метод', 'Pick a method')} />
        <Text style={{ color: t.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 }}>
          {tt('Что попробуем дальше', 'What do we try next')}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 20 }}>
          {tt('Это твой выбор, не приказ. Можно начать с самого мягкого, можно сразу с препаратами — обоснования внутри.',
              "Your choice, not an order. You can start gentle or jump to meds — rationale inside each.")}
        </Text>
        <View style={{ gap: 10 }}>
          {alts.map((id) => {
            const s = getStep(id);
            const isPicked = pickedMethod === id;
            const isRecommended = recommended === id;
            return (
              <Pressable key={id} onPress={() => { Haptics.selectionAsync(); setPickedMethod(id); }}>
                <View style={{
                  padding: 14, borderRadius: radius.lg,
                  backgroundColor: isPicked ? s.color + '14' : t.bgElev,
                  borderWidth: 2, borderColor: isPicked ? s.color : 'transparent',
                  gap: 6,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: 12, backgroundColor: s.color + '24',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ color: s.color, fontWeight: '800' }}>{s.index}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={{ color: t.text, fontSize: 15, fontWeight: '700', flexShrink: 1 }} numberOfLines={2}>
                          {lang === 'ru' ? s.titleRu : s.titleEn}
                        </Text>
                        {isRecommended && (
                          <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: t.accentSoft }}>
                            <Text style={{ color: t.accent, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 }}>
                              {tt('РЕКОМЕНДУЕМ', 'RECOMMENDED')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
                        {lang === 'ru' ? s.shortRu : s.shortEn}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: t.text, fontSize: 13, lineHeight: 19 }}>
                    {lang === 'ru' ? s.whyRu : s.whyEn}
                  </Text>
                  <Text style={{ color: t.textDim, fontSize: 11 }}>{s.evidenceRu}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <Footer onBack={() => setPhase('reflect')} onNext={() => {
          if (!pickedMethod) return;
          setPrep(prepChecklist(pickedMethod, p.faithEnabled).map((x) => ({ id: x.id, done: false })));
          setPhase('date');
        }} disabled={!pickedMethod} />
      </Wrap>
    );
  }

  // ---------- 4. QUIT DATE ----------
  if (phase === 'date') {
    const presets = [
      { d: 0,  ru: 'Прямо сейчас',         en: 'Right now' },
      { d: 1,  ru: 'Завтра утром',         en: 'Tomorrow morning' },
      { d: 3,  ru: 'Через 3 дня',          en: 'In 3 days' },
      { d: 7,  ru: 'Через неделю',         en: 'In 1 week' },
      { d: 14, ru: 'Через 2 недели',       en: 'In 2 weeks' },
    ];
    const needsRx = pickedMethod === 'L4_pharma' || pickedMethod === 'L5_intensive';
    return (
      <Wrap onClose={close}>
        <Header step={4} total={6} title={tt('Дата старта', 'Quit date')} />
        <Text style={{ color: t.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 }}>
          {tt('Когда стартуешь?', 'When do you start?')}
        </Text>
        {needsRx && (
          <View style={{ padding: 12, borderRadius: 10, backgroundColor: '#FF9F0A20', borderWidth: 1, borderColor: '#FF9F0A40' }}>
            <Text style={{ color: '#FF9F0A', fontSize: 13, lineHeight: 18 }}>
              {tt('Этот метод требует рецепта. Реалистичный минимум — 3–7 дней на запись и поход к врачу.',
                  'This method needs a prescription. Realistic minimum is 3–7 days for the doctor visit.')}
            </Text>
          </View>
        )}
        <View style={{ gap: 8 }}>
          {presets.map((p2) => {
            const sel = daysOffset === p2.d;
            const date = new Date(Date.now() + p2.d * 86400_000);
            const fmt = date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long' });
            return (
              <Pressable key={p2.d} unstable_pressDelay={0} onPress={() => { Haptics.selectionAsync(); setDaysOffset(p2.d); }}
                style={{
                  padding: 14, borderRadius: radius.md,
                  backgroundColor: sel ? t.accentSoft : t.bgElev,
                  borderWidth: 1, borderColor: sel ? t.accent : t.border,
                  flexDirection: 'row', alignItems: 'center',
                }}>
                <Text style={{ color: t.text, fontSize: 15, fontWeight: '600', flex: 1 }}>
                  {lang === 'ru' ? p2.ru : p2.en}
                </Text>
                <Text style={{ color: t.textDim, fontSize: 13 }}>{fmt}</Text>
              </Pressable>
            );
          })}
        </View>
        <Footer onBack={() => setPhase('choose')} onNext={() => setPhase(daysOffset > 0 ? 'bridge' : 'prep')} />
      </Wrap>
    );
  }

  // ---------- 5. BRIDGE PLAN — only if quitDate > 0 ----------
  if (phase === 'bridge') {
    const opts = [
      { v: 'none',      ru: 'Не курю с этого момента (пакт на честность)', en: "I don't smoke from now on (honesty pact)" },
      { v: 'last_pack', ru: 'Сегодня выкуриваю последнюю пачку',           en: 'I finish my last pack today' },
      { v: 'taper',     ru: 'Снижаю по сигарете в день до даты',           en: 'I taper one cig/day until date' },
    ] as const;
    return (
      <Wrap onClose={close}>
        <Header step={5} total={6} title={tt('До даты старта', 'Until quit date')} />
        <Text style={{ color: t.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 }}>
          {tt(`Что будет в эти ${daysOffset} ${daysOffset === 1 ? 'день' : 'дня/дней'}?`, `What about these ${daysOffset} day(s)?`)}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 20 }}>
          {tt('Никакой иллюзии. Скажи как будет на самом деле.', 'No illusions. Say what will really happen.')}
        </Text>
        <View style={{ gap: 8 }}>
          {opts.map((o) => {
            const sel = bridgeMode === o.v;
            return (
              <Pressable key={o.v} unstable_pressDelay={0} onPress={() => { Haptics.selectionAsync(); setBridgeMode(o.v); }}
                style={{
                  padding: 14, borderRadius: radius.md,
                  backgroundColor: sel ? t.accentSoft : t.bgElev,
                  borderWidth: 1, borderColor: sel ? t.accent : t.border,
                }}>
                <Text style={{ color: t.text, fontSize: 14, fontWeight: '600' }}>{lang === 'ru' ? o.ru : o.en}</Text>
              </Pressable>
            );
          })}
        </View>
        {bridgeMode === 'taper' && (
          <View style={{ marginTop: 4, gap: 6 }}>
            <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {tt('Сигарет сегодня', 'Cigs today')}
            </Text>
            <TextInput value={bridgePerDay} onChangeText={setBridgePerDay} keyboardType="number-pad"
              placeholder="10" placeholderTextColor={t.textDim}
              style={{ backgroundColor: t.bgElev, color: t.text, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: t.border, fontSize: 18, fontWeight: '700' }}
            />
            {Number(bridgePerDay) > 0 && daysOffset > 0 && (
              <Text style={{ color: t.textDim, fontSize: 12, lineHeight: 17 }}>
                {tt(
                  `Снижение примерно на ${(Number(bridgePerDay) / daysOffset).toFixed(1)} сигарет в день, к дате старта будет 0.`,
                  `Drop ~${(Number(bridgePerDay) / daysOffset).toFixed(1)} cigs/day; at the start date you’ll be at 0.`,
                )}
              </Text>
            )}
          </View>
        )}
        <Footer onBack={() => setPhase('date')} onNext={() => setPhase('prep')} />
      </Wrap>
    );
  }

  // ---------- 6. PREP CHECKLIST ----------
  if (phase === 'prep') {
    const items = pickedMethod ? prepChecklist(pickedMethod, p.faithEnabled) : [];
    function toggle(id: string) {
      Haptics.selectionAsync();
      setPrep((px) => px.map((x) => x.id === id ? { ...x, done: !x.done } : x));
    }
    const doneCount = prep.filter((x) => x.done).length;
    return (
      <Wrap onClose={close}>
        <Header step={6} total={6} title={tt('Подготовка', 'Preparation')} />
        <Text style={{ color: t.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 }}>
          {tt('Сделать до даты старта', 'Do before the quit date')}
        </Text>
        <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 20 }}>
          {tt(`Отметь что сделал. Можно сделать позже — список будет на главной.`,
              'Tick what you did. Can be done later — the list will be on home.')}
        </Text>
        <View style={{ gap: 8 }}>
          {items.map((it) => {
            const done = prep.find((x) => x.id === it.id)?.done ?? false;
            return (
              <Pressable key={it.id} unstable_pressDelay={0} onPress={() => toggle(it.id)}
                style={{
                  padding: 14, borderRadius: radius.md,
                  backgroundColor: done ? '#30D15814' : t.bgElev,
                  borderWidth: 1, borderColor: done ? '#30D15840' : t.border,
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  borderWidth: 2, borderColor: done ? '#30D158' : t.border,
                  backgroundColor: done ? '#30D158' : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {done && <Icon.check size={13} color="#fff" />}
                </View>
                <Text style={{ color: t.text, fontSize: 14, flex: 1, textDecorationLine: done ? 'line-through' : 'none' }}>
                  {lang === 'ru' ? it.ru : it.en}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ color: t.textDim, fontSize: 12, textAlign: 'center' }}>
          {tt(`${doneCount} из ${items.length} готово`, `${doneCount} of ${items.length} done`)}
        </Text>
        <Footer onBack={() => setPhase(daysOffset > 0 ? 'bridge' : 'date')} onNext={() => setPhase('commit')} />
      </Wrap>
    );
  }

  // ---------- 7. COMMIT ----------
  if (phase === 'commit') {
    const newStep = pickedMethod ? getStep(pickedMethod) : null;
    const startDate = new Date(Date.now() + daysOffset * 86400_000);
    const startDateStr = startDate.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long' });

    async function commit() {
      if (!pickedMethod) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const isImmediate = daysOffset === 0;
      const startMs = isImmediate ? Date.now() : startDate.getTime();

      await update((s) => {
        if (!s.profile) return s;
        // Archive previous step into history.
        const prevSince = s.profile.stepEnteredAt ?? s.profile.quitDate ?? Date.now();
        const slipsOnPrev = s.slips.filter((ts) => ts >= prevSince).length;
        const history = s.profile.methodHistory ?? [];
        const archived = s.profile.currentStep ? [
          ...history,
          { stepId: s.profile.currentStep, startedAt: prevSince, endedAt: Date.now(), slips: slipsOnPrev, reason: reflect.join(',') },
        ] : history;

        return {
          ...s,
          profile: {
            ...s.profile,
            wantsToQuit: 'yes',
            methodHistory: archived,
            ...(isImmediate ? {
              currentStep: pickedMethod,
              stepEnteredAt: startMs,
              quitDate: startMs,
              pendingMethod: undefined,
              pendingQuitDate: undefined,
              pendingPrep: prep,
            } : {
              pendingMethod: pickedMethod,
              pendingQuitDate: startMs,
              pendingPrep: prep,
            }),
          },
        };
      });

      // Reschedule notifications anchored to new quit date.
      try {
        await scheduleQuitProgram(startMs, lang, 8, p?.checkInHour ?? 21);
      } catch {}

      setPhase('done');
    }

    return (
      <Wrap onClose={close}>
        <LinearGradient colors={[(newStep?.color ?? t.accent) + '38', (newStep?.color ?? t.accent) + '08']}
          style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.shieldStar size={56} color={newStep?.color ?? t.accent} />
        </LinearGradient>
        <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>
          {tt('Подтверди план', 'Confirm the plan')}
        </Text>

        <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 8 }}>
          <Row label={tt('Метод', 'Method')} value={newStep ? (lang === 'ru' ? newStep.titleRu : newStep.titleEn) : '—'} color={newStep?.color} />
          <Row label={tt('Старт', 'Start')} value={daysOffset === 0 ? tt('Прямо сейчас', 'Right now') : startDateStr} />
          <Row label={tt('До старта', 'Until start')}
            value={
              bridgeMode === 'none' ? tt('Не курю с сейчас', 'No smoking from now')
              : bridgeMode === 'last_pack' ? tt('Последняя пачка', 'Last pack')
              : tt(`Снижаю с ${bridgePerDay || 0}/день`, `Taper from ${bridgePerDay || 0}/day`)
            } />
          <Row label={tt('Подготовка', 'Preparation')} value={`${prep.filter((x) => x.done).length} / ${prep.length}`} />
        </View>

        <Pressable onPress={commit}
          style={{ padding: 18, borderRadius: radius.xl, backgroundColor: newStep?.color ?? t.accent, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>
            {daysOffset === 0 ? tt('Стартую сейчас', 'Start now') : tt('Запланировать', 'Schedule it')}
          </Text>
        </Pressable>
        <Pressable onPress={() => setPhase('prep')} style={{ padding: 14, alignItems: 'center' }}>
          <Text style={{ color: t.textDim, fontWeight: '600' }}>{tt('Назад', 'Back')}</Text>
        </Pressable>
      </Wrap>
    );
  }

  // ---------- DONE ----------
  return (
    <Wrap onClose={close}>
      <LinearGradient colors={['#30D15838', '#30D15808']}
        style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
        <Icon.check size={56} color="#30D158" />
      </LinearGradient>
      <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>
        {daysOffset === 0 ? tt('Поехали.', "Let's go.") : tt('Запланировано.', 'Scheduled.')}
      </Text>
      <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>
        {daysOffset === 0
          ? tt('Кольцо стартует сейчас. Уведомления пересобраны под новый план.',
               'Ring starts now. Notifications rebuilt for the new plan.')
          : tt('На главной увидишь карточку «Подготовка к старту» с обратным отсчётом и чек-листом.',
               'On home you’ll see a "Preparation" card with countdown and checklist.')}
      </Text>
      <Pressable onPress={() => router.replace('/(tabs)')}
        style={{ padding: 18, borderRadius: radius.xl, backgroundColor: '#30D158', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>{tt('На главную', 'Home')}</Text>
      </Pressable>
    </Wrap>
  );
}

/* ---- shared UI ---- */

function Wrap({ children, onClose }: { children: any; onClose: () => void }) {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: spacing.md }}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={{ color: t.accent, fontSize: 17 }}>{tt('Закрыть', 'Close')}</Text>
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, gap: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ step, total, title }: { step: number; total: number; title: string }) {
  const t = useTheme();
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={{ flex: 1, height: 3, borderRadius: 3, backgroundColor: i < step ? t.accent : t.border }} />
        ))}
      </View>
      <Text style={{ color: t.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' }}>
        {tt('Шаг', 'Step')} {step} / {total} · {title}
      </Text>
    </View>
  );
}

function Footer({ onBack, onNext, disabled }: { onBack: () => void; onNext: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
      <Pressable onPress={onBack}
        style={{ paddingHorizontal: 18, paddingVertical: 16, borderRadius: radius.xl, borderWidth: 1, borderColor: t.border }}>
        <Text style={{ color: t.text, fontSize: 16 }}>{tt('Назад', 'Back')}</Text>
      </Pressable>
      <Pressable onPress={onNext} disabled={disabled}
        style={{ flex: 1, paddingVertical: 18, borderRadius: radius.xl, backgroundColor: disabled ? t.border : t.accent, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>{tt('Дальше', 'Next')}</Text>
      </Pressable>
    </View>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</Text>
      <Text style={{ color: color ?? t.text, fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 12 }}>{value}</Text>
    </View>
  );
}
