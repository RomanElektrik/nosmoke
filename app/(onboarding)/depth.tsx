// Deep onboarding: past attempts, excuses (SRQ-derived), readiness scales,
// commitment mode, daily check-in time. Sources: Fotuhi 2013, Vangeli 2011,
// Kotz/West 2013 (MTSS), Halpern NEJM 2015 (deposit-contract).

import { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { update } from '../../lib/storage';
import type { AttemptMethod, Excuse } from '../../lib/storage';
import { Icon, type IconKey } from '../../components/Icon';

const tt = (ru: string, en: string) => (currentLang() === 'ru' ? ru : en);

type Step = 0 | 1 | 2 | 3 | 4;

// Per-step visual identity
const STEP_META_FIXED: { icon: IconKey; color: string; subRu: string; subEn: string }[] = [
  { icon: 'fire',   color: '#FF453A', subRu: 'Каждая попытка — опыт. Используем его.',          subEn: 'Each attempt is experience. We will use it.' },
  { icon: 'book',   color: '#0A84FF', subRu: 'То, что не сработало раньше, не сработает снова.', subEn: "What didn't work before won't work again." },
  { icon: 'brain',  color: '#BF5AF2', subRu: 'Оправдания одинаковы у миллионов — мы их знаем.', subEn: 'Excuses are universal — we know them all.' },
  { icon: 'target', color: '#30D158', subRu: 'Честный ответ помогает говорить с тобой по делу.', subEn: 'An honest answer helps us talk to you directly.' },
  { icon: 'pulse',  color: '#FF9F0A', subRu: 'Один тап в день. Лучший поведенческий приём.',    subEn: 'One tap a day. Strongest behavioural tool.' },
];

export default function Depth() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [step, setStep] = useState<Step>(0);

  // Step 0 — past attempts count
  const [attemptsCount, setAttemptsCount] = useState<number>(0);
  // Step 1 — longest attempt + last method + last trigger
  const [longestDays, setLongestDays] = useState<string>('');
  const [lastMethod, setLastMethod] = useState<AttemptMethod | null>(null);
  const [lastTrigger, setLastTrigger] = useState<string>('');
  // Step 2 — excuses (SRQ-derived)
  const [excuses, setExcuses] = useState<Excuse[]>([]);
  // Step 3 — readiness sliders 0-10
  const [importance, setImportance] = useState<number>(7);
  const [confidence, setConfidence] = useState<number>(5);
  // Step 4 — daily check-in time
  const [checkInHour, setCheckInHour] = useState<number>(21);

  const TOTAL_STEPS = 5;
  const meta = STEP_META_FIXED[step];

  function next() { Haptics.selectionAsync(); if (step < 4) setStep((step + 1) as Step); else finish(); }
  function back() { Haptics.selectionAsync(); if (step > 0) setStep((step - 1) as Step); else router.back(); }

  async function finish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => {
      if (!s.profile) return s;
      const pastAttempts = attemptsCount > 0 ? [{
        method: lastMethod ?? 'cold_turkey',
        longestDays: Number(longestDays) || 0,
        trigger: lastTrigger.trim() || undefined,
      }] : [];
      return {
        ...s,
        profile: {
          ...s.profile,
          pastAttempts,
          topExcuses: excuses,
          importance,
          confidence,
          selfEfficacy: confidence,
          commitmentMode: 'soft',
          checkInHour,
        },
      };
    });
    router.replace('/(onboarding)/plan');
  }

  const IconComp = Icon[meta.icon];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Progress */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: 8 }}>
        <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>
          {tt(`Шаг ${step + 1} из ${TOTAL_STEPS}`, `Step ${step + 1} of ${TOTAL_STEPS}`)}
        </Text>
        <View style={{ height: 6, borderRadius: 6, backgroundColor: t.border, overflow: 'hidden' }}>
          <View style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%`, height: '100%', backgroundColor: meta.color, borderRadius: 6 }} />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18, paddingBottom: 40, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled">
          <Animated.View key={step} entering={FadeInDown.duration(260)} style={{ gap: 18 }}>
            {/* Icon badge */}
            <LinearGradient
              colors={[meta.color + '38', meta.color + '0A']}
              style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
              <IconComp size={34} color={meta.color} />
            </LinearGradient>

            {step === 0 && <StepCount value={attemptsCount} onChange={setAttemptsCount} sub={tt(meta.subRu, meta.subEn)} accent={meta.color} />}
            {step === 1 && <StepLastAttempt
              longestDays={longestDays} onLongest={setLongestDays}
              method={lastMethod} onMethod={setLastMethod}
              trigger={lastTrigger} onTrigger={setLastTrigger}
              disabled={attemptsCount === 0}
              sub={tt(meta.subRu, meta.subEn)} accent={meta.color}
            />}
            {step === 2 && <StepExcuses value={excuses} onChange={setExcuses} sub={tt(meta.subRu, meta.subEn)} accent={meta.color} />}
            {step === 3 && <StepReadiness importance={importance} confidence={confidence} onImportance={setImportance} onConfidence={setConfidence} sub={tt(meta.subRu, meta.subEn)} accent={meta.color} />}
            {step === 4 && <StepCheckInTime hour={checkInHour} onChange={setCheckInHour} sub={tt(meta.subRu, meta.subEn)} accent={meta.color} />}
          </Animated.View>
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 10, padding: spacing.lg }}>
          <Pressable onPress={back}
            style={{ width: 56, alignItems: 'center', justifyContent: 'center', borderRadius: radius.xl, borderWidth: 1, borderColor: t.border }}>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <Icon.arrowRight size={20} color={t.textDim} />
            </View>
          </Pressable>
          <Pressable onPress={next}
            style={{ flex: 1, paddingVertical: 18, borderRadius: radius.xl, backgroundColor: meta.color, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
              {step === 4 ? tr('common.done') : tr('common.continue')}
            </Text>
            {step < 4 && <Icon.arrowRight size={18} color="#fff" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- shared heading ---------- */

function H1({ children, sub, accent }: { children: any; sub?: string; accent?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: t.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.6, lineHeight: 33 }}>{children}</Text>
      {sub ? <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 21 }}>{sub}</Text> : null}
    </View>
  );
}

/* ---------- step components ---------- */

function StepCount({ value, onChange, sub, accent }: { value: number; onChange: (v: number) => void; sub: string; accent: string }) {
  const lang = currentLang();
  const t = useTheme();
  const opts = [
    { v: 0,  ru: 'Это первая попытка', en: 'My first attempt' },
    { v: 1,  ru: '1 раз пробовал',     en: 'Tried once' },
    { v: 2,  ru: '2–3 раза',            en: '2–3 times' },
    { v: 4,  ru: '4–10 раз',            en: '4–10 times' },
    { v: 11, ru: 'Больше 10 раз',       en: 'More than 10' },
  ];
  return (
    <View style={{ gap: 16 }}>
      <H1 sub={sub} accent={accent}>{tt('Сколько раз ты уже пробовал бросить?', 'How many times have you tried to quit?')}</H1>
      <View style={{ gap: 10, marginTop: 4 }}>
        {opts.map((o) => {
          const sel = value === o.v;
          return (
            <Pressable key={o.v} onPress={() => { Haptics.selectionAsync(); onChange(o.v); }}
              style={{
                paddingVertical: 17, paddingHorizontal: 18, borderRadius: radius.lg,
                backgroundColor: sel ? accent + '16' : t.bgElev,
                borderWidth: 1.5, borderColor: sel ? accent : t.border,
                flexDirection: 'row', alignItems: 'center', gap: 12,
              }}>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: sel ? '700' : '500', flex: 1 }}>
                {lang === 'ru' ? o.ru : o.en}
              </Text>
              <View style={{
                width: 24, height: 24, borderRadius: 12, borderWidth: 2,
                borderColor: sel ? accent : t.border,
                backgroundColor: sel ? accent : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {sel && <Icon.check size={13} color="#fff" />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StepLastAttempt(props: {
  longestDays: string; onLongest: (v: string) => void;
  method: AttemptMethod | null; onMethod: (v: AttemptMethod) => void;
  trigger: string; onTrigger: (v: string) => void;
  disabled: boolean; sub: string; accent: string;
}) {
  const t = useTheme();
  const lang = currentLang();
  const methods: { v: AttemptMethod; ru: string; en: string }[] = [
    { v: 'cold_turkey', ru: 'Силой воли',        en: 'Cold turkey' },
    { v: 'nrt',         ru: 'Пластырь / жвачка', en: 'NRT (patch / gum)' },
    { v: 'varenicline', ru: 'Варениклин',         en: 'Varenicline' },
    { v: 'cytisine',    ru: 'Цитизин',            en: 'Cytisine' },
    { v: 'bupropion',   ru: 'Бупропион',          en: 'Bupropion' },
    { v: 'ecig',        ru: 'Электронка',         en: 'E-cigarette' },
    { v: 'app',         ru: 'Приложение',         en: 'App' },
    { v: 'other',       ru: 'Другое',             en: 'Other' },
  ];

  if (props.disabled) {
    return (
      <View style={{ gap: 16 }}>
        <H1 sub={tt('Начинаем с самого мягкого метода — шаг за шагом.', 'We start with the gentlest method — step by step.')} accent={props.accent}>
          {tt('Хорошо, начинаем с чистого листа.', 'Good, we start fresh.')}
        </H1>
      </View>
    );
  }
  return (
    <View style={{ gap: 18 }}>
      <H1 sub={props.sub} accent={props.accent}>{tt('Что было в последний раз?', 'What happened last time?')}</H1>

      <View style={{ gap: 6 }}>
        <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {tt('Самая длинная попытка, дней', 'Longest attempt, days')}
        </Text>
        <TextInput
          value={props.longestDays} onChangeText={props.onLongest} keyboardType="number-pad"
          placeholder={tt('например, 30', 'e.g. 30')} placeholderTextColor={t.textDim}
          style={{ backgroundColor: t.bgElev, color: t.text, padding: 16, borderRadius: radius.md, fontSize: 24, fontWeight: '800', borderWidth: 1, borderColor: t.border }}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {tt('Каким методом', 'Which method')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {methods.map((m) => {
            const sel = props.method === m.v;
            return (
              <Pressable key={m.v} onPress={() => { Haptics.selectionAsync(); props.onMethod(m.v); }}
                style={{
                  paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
                  backgroundColor: sel ? props.accent : t.bgElev,
                  borderWidth: 1.5, borderColor: sel ? props.accent : t.border,
                }}>
                <Text style={{ color: sel ? '#fff' : t.text, fontSize: 14, fontWeight: sel ? '700' : '500' }}>
                  {lang === 'ru' ? m.ru : m.en}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {tt('Что вернуло к курению', 'What brought you back')}
        </Text>
        <TextInput
          value={props.trigger} onChangeText={props.onTrigger}
          placeholder={tt('например: «после ссоры с женой»', 'e.g. "after a fight with my wife"')} placeholderTextColor={t.textDim}
          multiline
          style={{ backgroundColor: t.bgElev, color: t.text, padding: 16, borderRadius: radius.md, fontSize: 16, minHeight: 72, borderWidth: 1, borderColor: t.border }}
        />
      </View>
    </View>
  );
}

const EXCUSES: { v: Excuse; ru: string; en: string }[] = [
  { v: 'one_wont_hurt', ru: 'Одна не помешает',     en: 'One won\'t hurt' },
  { v: 'after_stress',  ru: 'После такого можно',   en: 'After all that, I can' },
  { v: 'monday',        ru: 'Начну в понедельник',  en: 'I\'ll start Monday' },
  { v: 'social',        ru: 'Все вокруг курят',     en: 'Everyone around smokes' },
  { v: 'bored',         ru: 'От скуки',             en: 'From boredom' },
  { v: 'reward',        ru: 'Я заслужил',           en: 'I deserve it' },
  { v: 'event',         ru: 'Праздник / поездка',   en: 'Holiday / trip' },
  { v: 'too_hard',      ru: 'Слишком тяжело',       en: 'Too hard' },
  { v: 'try_later',     ru: 'Лучше попробую позже', en: 'I\'ll try later' },
  { v: 'cant_alone',    ru: 'Один не справлюсь',    en: 'I can\'t do it alone' },
];

function StepExcuses({ value, onChange, sub, accent }: { value: Excuse[]; onChange: (v: Excuse[]) => void; sub: string; accent: string }) {
  const t = useTheme();
  const lang = currentLang();
  function toggle(v: Excuse) {
    Haptics.selectionAsync();
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }
  return (
    <View style={{ gap: 16 }}>
      <H1 sub={sub} accent={accent}>{tt('Какие из этих мыслей у тебя бывают?', 'Which of these thoughts do you have?')}</H1>
      <View style={{ gap: 8, marginTop: 4 }}>
        {EXCUSES.map((e) => {
          const sel = value.includes(e.v);
          return (
            <Pressable key={e.v} onPress={() => toggle(e.v)}
              style={{
                paddingVertical: 15, paddingHorizontal: 18, borderRadius: radius.lg,
                backgroundColor: sel ? accent + '16' : t.bgElev,
                borderWidth: 1.5, borderColor: sel ? accent : t.border,
                flexDirection: 'row', alignItems: 'center', gap: 12,
              }}>
              <View style={{
                width: 24, height: 24, borderRadius: 7, borderWidth: 2,
                borderColor: sel ? accent : t.border,
                backgroundColor: sel ? accent : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {sel && <Icon.check size={13} color="#fff" />}
              </View>
              <Text style={{ color: t.text, fontSize: 15, flex: 1 }}>«{lang === 'ru' ? e.ru : e.en}»</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StepReadiness({ importance, confidence, onImportance, onConfidence, sub, accent }: {
  importance: number; confidence: number;
  onImportance: (v: number) => void; onConfidence: (v: number) => void;
  sub: string; accent: string;
}) {
  const t = useTheme();
  const Slider = ({ value, onChange, color, label }: { value: number; onChange: (v: number) => void; color: string; label: string }) => (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: color, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 }}>{value}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {Array.from({ length: 11 }).map((_, i) => (
          <Pressable key={i} onPress={() => { Haptics.selectionAsync(); onChange(i); }}
            style={{ flex: 1, height: 38, borderRadius: 8, backgroundColor: i <= value ? color : t.border }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: t.textDim, fontSize: 11 }}>0</Text>
        <Text style={{ color: t.textDim, fontSize: 11 }}>10</Text>
      </View>
    </View>
  );
  return (
    <View style={{ gap: 22 }}>
      <H1 sub={sub} accent={accent}>{tt('Где ты сейчас?', 'Where are you now?')}</H1>
      <Slider value={importance} onChange={onImportance} color="#34C759"
        label={tt('Насколько важно бросить?', 'How important is quitting?')} />
      <Slider value={confidence} onChange={onConfidence} color="#0A84FF"
        label={tt('Насколько уверен, что справишься?', 'How confident you can do it?')} />
    </View>
  );
}

function StepCheckInTime({ hour, onChange, sub, accent }: { hour: number; onChange: (h: number) => void; sub: string; accent: string }) {
  const t = useTheme();
  const presets = [9, 12, 18, 20, 21, 22];
  return (
    <View style={{ gap: 16 }}>
      <H1 sub={sub} accent={accent}>{tt('Ежедневный чек-ин', 'Daily check-in')}</H1>
      <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 20 }}>
        {tt(
          'Раз в день мы спросим: «Сегодня курил?» Один тап. Это один из самых сильных поведенческих приёмов.',
          'Once a day we ask: "Did you smoke today?" One tap. One of the strongest behavioural tools.',
        )}
      </Text>
      <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 6 }}>
        {tt('В какое время', 'At what time')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {presets.map((h) => {
          const sel = hour === h;
          return (
            <Pressable key={h} onPress={() => { Haptics.selectionAsync(); onChange(h); }}
              style={{
                paddingHorizontal: 20, paddingVertical: 14, borderRadius: 999,
                backgroundColor: sel ? accent : t.bgElev,
                borderWidth: 1.5, borderColor: sel ? accent : t.border,
              }}>
              <Text style={{ color: sel ? '#fff' : t.text, fontWeight: '700', fontSize: 16 }}>
                {String(h).padStart(2, '0')}:00
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
