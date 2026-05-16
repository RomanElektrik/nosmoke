import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../lib/theme';
import { useTranslation, currentLang } from '../lib/i18n';
import { useAppState, update } from '../lib/storage';
import { chat } from '../lib/ai';
import { cravingsSurvived } from '../lib/program';
import { escalationSuggestion, getStep } from '../lib/stepped';
import { Icon } from '../components/Icon';

// Lapse Recovery Protocol — Marlatt RP, AVE-aware:
// 1) Defuse abstinence violation effect ("a lapse ≠ a relapse")
// 2) Surface self-efficacy data (cravings already survived)
// 3) Identify trigger
// 4) Re-commit with concrete next step (24h)
// 5) AI helper for personalized 48h plan
// IMPORTANT: never reset streak / never zero stats. Lapses logged separately.

export default function Slip() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const lang = currentLang();
  const [state] = useAppState();
  // If the slip was just logged via the daily check-in, the trigger is already
  // known — don't ask the same question twice (P1: no double survey).
  const lastSmoked = [...state.cravings].reverse().find((c) => c.outcome === 'smoked');
  const knownTrigger = lastSmoked?.trigger ?? '';
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [trigger, setTrigger] = useState<string>(knownTrigger);
  const [nextStep, setNextStep] = useState<string>('');
  const [advice, setAdvice] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const survived = cravingsSurvived(state);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  }, []);

  async function finish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // We do NOT reset quitDate / streak. Slip is logged in cravings via SOS already.
    // Trigger + next-step also captured for trend analysis.
    if (trigger || nextStep) {
      await update((s) => ({
        ...s,
        cravings: s.cravings.length > 0 && s.cravings[s.cravings.length - 1].outcome === 'smoked'
          ? s.cravings.map((c, i) =>
              i === s.cravings.length - 1
                ? { ...c, trigger: (trigger as any) || c.trigger, note: nextStep || c.note }
                : c)
          : s.cravings,
      }));
    }
    router.replace('/(tabs)');
  }

  async function askAi() {
    if (loadingAi) return;
    setLoadingAi(true);
    try {
      const reply = await chat(state, lang, 'analyze_slip', [
        { role: 'user', content: lang === 'ru'
          ? `Я только что закурил. Триггер: ${trigger || '—'}. Помоги без осуждения и предложи один конкретный шаг на ближайшие 48 часов.`
          : `I just smoked. Trigger: ${trigger || '—'}. Help without shame and propose one concrete step for the next 48 hours.` },
      ]);
      setAdvice(reply);
    } catch (e: any) {
      setAdvice(lang === 'ru' ? 'ИИ недоступен. Шаг на 48 ч: дыхание 5 минут утром + замена ритуала на каждый позыв. Только это.' : 'AI unavailable. 48h step: 5-min breath in the morning + ritual replacement on every urge. Just that.');
    }
    setLoadingAi(false);
  }

  // Step 0 — defuse AVE
  if (step === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18, paddingBottom: 40 }}>
          <LinearGradient colors={['#5AC8FA38', '#5AC8FA08']}
            style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.feather size={56} color="#5AC8FA" />
          </LinearGradient>
          <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 }}>
            {lang === 'ru' ? 'Это срыв, не возврат.' : 'A lapse, not a relapse.'}
          </Text>
          <Text style={{ color: t.text, fontSize: 16, lineHeight: 23 }}>
            {lang === 'ru'
              ? 'Одна сигарета — это данные, не приговор. У 75% бросающих бывают срывы. Те, кто бросил насовсем, тоже срывались — и просто продолжили дальше.'
              : 'One cigarette is data, not a verdict. 75% of quitters have lapses. The ones who quit for good also slipped — and simply kept going.'}
          </Text>

          <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: '#30D15814', borderWidth: 1, borderColor: '#30D15830' }}>
            <Text style={{ color: '#30D158', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
              {lang === 'ru' ? 'Что у тебя уже есть' : 'What you already have'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Stat color="#30D158" value={String(survived)} label={lang === 'ru' ? 'тяг прошёл' : 'cravings survived'} />
              <Stat color="#0A84FF" value={String(state.cravings.length)} label={lang === 'ru' ? 'эпизодов' : 'episodes logged'} />
              <Stat color="#FF9F0A" value={String(state.slips.length)} label={lang === 'ru' ? 'срывов' : 'slips'} />
            </View>
            <Text style={{ color: t.textDim, fontSize: 13, marginTop: 12, lineHeight: 19 }}>
              {lang === 'ru'
                ? 'Эти цифры — твои. Они не обнуляются. Ты уже знаешь, как держаться.'
                : "These numbers are yours. They don't reset. You already know how to hold."}
            </Text>
          </View>

          <Pressable onPress={() => { Haptics.selectionAsync(); setStep(knownTrigger ? 2 : 1); }}
            style={{ marginTop: 12, padding: 18, borderRadius: radius.xl, backgroundColor: '#5AC8FA', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
              {knownTrigger
                ? (lang === 'ru' ? 'Дальше →' : 'Continue →')
                : (lang === 'ru' ? 'Что произошло →' : 'What happened →')}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 1 — trigger ID
  if (step === 1) {
    const triggers: { v: string; ru: string; en: string }[] = [
      { v: 'stress', ru: 'Стресс', en: 'Stress' },
      { v: 'coffee', ru: 'Кофе/еда', en: 'Coffee/food' },
      { v: 'alcohol', ru: 'Алкоголь', en: 'Alcohol' },
      { v: 'social', ru: 'Компания', en: 'Social' },
      { v: 'boredom', ru: 'Скука', en: 'Boredom' },
      { v: 'driving', ru: 'За рулём', en: 'Driving' },
      { v: 'after_meal', ru: 'После еды', en: 'After meal' },
    ];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18, paddingBottom: 40 }}>
          <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'Шаг 2 из 4' : 'Step 2 of 4'}
          </Text>
          <Text style={{ color: t.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.6 }}>
            {lang === 'ru' ? 'Что сработало триггером?' : 'What was the trigger?'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {triggers.map((tg) => {
              const sel = trigger === tg.v;
              return (
                <Pressable key={tg.v} onPress={() => { Haptics.selectionAsync(); setTrigger(tg.v); }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
                    backgroundColor: sel ? '#5AC8FA' : t.bgElev,
                    borderWidth: 1, borderColor: sel ? '#5AC8FA' : t.border,
                  }}>
                  <Text style={{ color: sel ? '#fff' : t.text, fontWeight: '600' }}>
                    {lang === 'ru' ? tg.ru : tg.en}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={() => setStep(2)}
            style={{ marginTop: 16, padding: 18, borderRadius: radius.xl, backgroundColor: trigger ? '#5AC8FA' : t.border, alignItems: 'center' }}
            disabled={!trigger}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>{lang === 'ru' ? 'Дальше' : 'Next'}</Text>
          </Pressable>
          <Pressable onPress={() => setStep(2)} style={{ alignItems: 'center', padding: 8 }}>
            <Text style={{ color: t.textDim, fontSize: 13 }}>{lang === 'ru' ? 'Не знаю / пропустить' : "I don't know / skip"}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 2 — re-commit with one concrete next step
  if (step === 2) {
    const suggestions = lang === 'ru'
      ? ['Дыхание 5 минут перед утренним кофе', 'Стакан воды на каждый позыв', 'Пройти Cyclic Sighing 1 раз в день', 'Написать одному близкому, что я держусь', 'Не покупать сигареты в ближайшие 48 часов']
      : ['5-min breath before morning coffee', 'Glass of water on every urge', 'Do Cyclic Sighing once a day', 'Text one close person "I am holding"', 'Do not buy cigarettes for the next 48 hours'];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 14, paddingBottom: 40 }}>
          <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'Шаг 3 из 4' : 'Step 3 of 4'}
          </Text>
          <Text style={{ color: t.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.6 }}>
            {lang === 'ru' ? 'Один шаг на 48 часов' : 'One step for 48 hours'}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 14 }}>
            {lang === 'ru' ? 'Не план «больше никогда». Только следующие 48 часов.' : 'Not a "never again" plan. Just the next 48 hours.'}
          </Text>
          <TextInput
            value={nextStep} onChangeText={setNextStep} multiline
            placeholder={lang === 'ru' ? 'Напиши свой шаг...' : 'Write your step...'} placeholderTextColor={t.textDim}
            style={{ backgroundColor: t.bgElev, color: t.text, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, minHeight: 80, fontSize: 16 }}
          />
          <Text style={{ color: t.textDim, fontSize: 12 }}>{lang === 'ru' ? 'Или выбери готовое:' : 'Or pick a ready one:'}</Text>
          {suggestions.map((s) => (
            <Pressable key={s} onPress={() => { Haptics.selectionAsync(); setNextStep(s); }}
              style={{
                padding: 12, borderRadius: radius.md,
                backgroundColor: nextStep === s ? '#5AC8FA20' : t.bgElev,
                borderWidth: 1, borderColor: nextStep === s ? '#5AC8FA' : t.border,
              }}>
              <Text style={{ color: t.text, fontSize: 14 }}>{s}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setStep(3)}
            style={{ marginTop: 12, padding: 18, borderRadius: radius.xl, backgroundColor: nextStep.trim() ? '#5AC8FA' : t.border, alignItems: 'center' }}
            disabled={!nextStep.trim()}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>{lang === 'ru' ? 'Беру обязательство' : 'I commit'}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 3 — close
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18, paddingBottom: 40 }}>
        <LinearGradient colors={['#30D15838', '#30D15808']}
          style={{ width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.check size={56} color="#30D158" />
        </LinearGradient>
        <Text style={{ color: t.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 }}>
          {lang === 'ru' ? 'Ты вернулся в путь.' : 'You\'re back on path.'}
        </Text>
        <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 12 }}>
          <View>
            <Text style={{ color: t.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
              {lang === 'ru' ? 'Триггер' : 'Trigger'}
            </Text>
            <Text style={{ color: t.text, fontSize: 16, marginTop: 4 }}>
              {trigger ? (lang === 'ru'
                ? ({stress:'Стресс',coffee:'Кофе/еда',alcohol:'Алкоголь',social:'Компания',boredom:'Скука',driving:'За рулём',after_meal:'После еды'} as any)[trigger]
                : trigger.replace('_', ' ')) : '—'}
            </Text>
          </View>
          <View>
            <Text style={{ color: t.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
              {lang === 'ru' ? 'Шаг на 48 часов' : '48-hour step'}
            </Text>
            <Text style={{ color: t.text, fontSize: 16, marginTop: 4, lineHeight: 22 }}>{nextStep}</Text>
          </View>
        </View>

        <Pressable onPress={askAi}
          style={{ padding: 14, borderRadius: radius.md, backgroundColor: '#0A84FF14', borderWidth: 1, borderColor: '#0A84FF40' }}>
          <Text style={{ color: '#0A84FF', fontWeight: '700' }}>
            {loadingAi ? (lang === 'ru' ? 'Помощник думает…' : 'Assistant thinking…') : (advice ? (lang === 'ru' ? 'Спросить ещё раз' : 'Ask again') : (lang === 'ru' ? 'Получить персональный план от ИИ' : 'Get a personal plan from AI'))}
          </Text>
        </Pressable>
        {!!advice && (
          <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.text, fontSize: 14, lineHeight: 20 }}>{advice}</Text>
          </View>
        )}

        {/* Method change CTA — tiered intensity */}
        <MethodChangeBlock />

        <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 4 }}>
          {lang === 'ru'
            ? 'Срыв зафиксирован в дневнике. Программа, копилка и уровни — твои, они продолжают идти.'
            : 'The slip is logged in the journal. Program, jar and levels keep going.'}
        </Text>

        <Pressable onPress={finish}
          style={{ marginTop: 4, padding: 18, borderRadius: radius.xl, backgroundColor: '#30D158', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>{lang === 'ru' ? 'На главную' : 'Home'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function MethodChangeBlock() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const sug = escalationSuggestion(state);
  const cur = state.profile?.currentStep;
  if (!cur) return null;
  const curStep = getStep(cur);
  const nextStep = sug.toStep ? getStep(sug.toStep) : null;

  const intensityColor =
    sug.intensity === 'auto' ? '#FF453A' :
    sug.intensity === 'medium' ? '#FF9500' :
    sug.intensity === 'soft' ? '#0A84FF' : '#0A84FF';

  return (
    <View style={{
      padding: 16, borderRadius: radius.lg,
      backgroundColor: intensityColor + '14',
      borderWidth: 1, borderColor: intensityColor + '40',
      gap: 10,
    }}>
      <Text style={{ color: intensityColor, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
        {lang === 'ru' ? 'Метод' : 'Method'}
      </Text>
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>
        {lang === 'ru' ? `Сейчас: ${curStep.titleRu}` : `Now: ${curStep.titleEn}`}
      </Text>
      <Text style={{ color: t.text, fontSize: 13, lineHeight: 19 }}>
        {sug.yes
          ? (lang === 'ru' ? sug.reasonRu : sug.reasonEn)
          : (lang === 'ru' ? 'Если ощущаешь, что метод тебе не подходит — можно поменять.' : 'If this method doesn’t fit — switch any time.')}
      </Text>
      {nextStep && sug.yes && (
        <View style={{ padding: 10, borderRadius: 10, backgroundColor: nextStep.color + '20', borderWidth: 1, borderColor: nextStep.color + '40' }}>
          <Text style={{ color: nextStep.color, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? `Следующая ступень · ${nextStep.index}/5` : `Next step · ${nextStep.index}/5`}
          </Text>
          <Text style={{ color: t.text, fontSize: 14, fontWeight: '700', marginTop: 2 }}>
            {lang === 'ru' ? nextStep.titleRu : nextStep.titleEn}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 4, lineHeight: 17 }}>
            {lang === 'ru' ? nextStep.whyRu : nextStep.whyEn}
          </Text>
        </View>
      )}
      <Pressable onPress={() => router.push(sug.yes ? '/transition' : '/method')}
        style={{ padding: 12, borderRadius: 10, backgroundColor: intensityColor, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
          {sug.yes
            ? (lang === 'ru' ? 'Пересобрать план' : 'Rebuild the plan')
            : (lang === 'ru' ? 'Посмотреть все методы' : 'See all methods')}
        </Text>
      </Pressable>
    </View>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, padding: 10, borderRadius: 12, backgroundColor: color + '20' }}>
      <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 }}>{value}</Text>
      <Text style={{ color: t.textDim, fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
