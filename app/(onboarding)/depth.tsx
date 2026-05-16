// Deep onboarding: past attempts, excuses (SRQ-derived), readiness scales,
// commitment mode, daily check-in time. Sources: Fotuhi 2013, Vangeli 2011,
// Kotz/West 2013 (MTSS), Halpern NEJM 2015 (deposit-contract).

import { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { update } from '../../lib/storage';
import type { AttemptMethod, Excuse } from '../../lib/storage';
import { Icon } from '../../components/Icon';

const tt = (ru: string, en: string) => (currentLang() === 'ru' ? ru : en);

type Step = 0 | 1 | 2 | 3 | 4;

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
      // For multiple, simplification: store one summary entry plus count is implied by count.
      // (Future: collect per-attempt details.)
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', gap: 4, padding: spacing.md }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={{ flex: 1, height: 3, borderRadius: 3, backgroundColor: i <= step ? t.accent : t.border }} />
        ))}
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 18, paddingBottom: 40, flexGrow: 1 }}>
          {step === 0 && <StepCount value={attemptsCount} onChange={setAttemptsCount} />}
          {step === 1 && <StepLastAttempt
            longestDays={longestDays} onLongest={setLongestDays}
            method={lastMethod} onMethod={setLastMethod}
            trigger={lastTrigger} onTrigger={setLastTrigger}
            disabled={attemptsCount === 0}
          />}
          {step === 2 && <StepExcuses value={excuses} onChange={setExcuses} />}
          {step === 3 && <StepReadiness importance={importance} confidence={confidence} onImportance={setImportance} onConfidence={setConfidence} />}
          {step === 4 && <StepCheckInTime hour={checkInHour} onChange={setCheckInHour} />}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 10, padding: spacing.lg }}>
          <Pressable onPress={back} style={{ paddingHorizontal: 18, paddingVertical: 16, borderRadius: radius.xl, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.text, fontSize: 16 }}>{tr('common.back')}</Text>
          </Pressable>
          <Pressable onPress={next} style={{ flex: 1, paddingVertical: 18, borderRadius: radius.xl, backgroundColor: t.accent, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>{step === 4 ? tr('common.done') : tr('common.continue')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- step components ---------- */

function H1({ children }: { children: any }) {
  const t = useTheme();
  return <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6, lineHeight: 34 }}>{children}</Text>;
}
function Sub({ children }: { children: any }) {
  const t = useTheme();
  return <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 22 }}>{children}</Text>;
}

function StepCount({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const t = useTheme();
  const lang = currentLang();
  const opts = [
    { v: 0,  ru: 'Это первая попытка', en: 'My first attempt' },
    { v: 1,  ru: '1 раз пробовал',     en: 'Tried once' },
    { v: 2,  ru: '2–3 раза',            en: '2–3 times' },
    { v: 4,  ru: '4–10 раз',            en: '4–10 times' },
    { v: 11, ru: 'Больше 10 раз',       en: 'More than 10' },
  ];
  return (
    <View style={{ gap: 16 }}>
      <H1>{tt('Сколько раз ты уже пробовал бросить?', 'How many times have you tried to quit?')}</H1>
      <Sub>{tt('Не для оценки. Это нужно, чтобы подобрать метод сильнее, если самый мягкий тебе уже не помог.', 'Not to judge. This helps pick a stronger method if the gentle one didn’t work.')}</Sub>
      <View style={{ gap: 10, marginTop: 4 }}>
        {opts.map((o) => {
          const sel = value === o.v;
          return (
            <Pressable key={o.v} onPress={() => { Haptics.selectionAsync(); onChange(o.v); }}
              style={{
                padding: 16, borderRadius: radius.md,
                backgroundColor: sel ? t.accentSoft : t.bgElev,
                borderWidth: 1, borderColor: sel ? t.accent : t.border,
              }}>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: sel ? '700' : '500' }}>{lang === 'ru' ? o.ru : o.en}</Text>
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
  disabled: boolean;
}) {
  const t = useTheme();
  const lang = currentLang();
  const methods: { v: AttemptMethod; ru: string; en: string }[] = [
    { v: 'cold_turkey', ru: 'Силой воли',     en: 'Cold turkey' },
    { v: 'nrt',         ru: 'Пластырь / жвачка', en: 'NRT (patch / gum)' },
    { v: 'varenicline', ru: 'Варениклин',     en: 'Varenicline' },
    { v: 'cytisine',    ru: 'Цитизин',         en: 'Cytisine' },
    { v: 'bupropion',   ru: 'Бупропион',       en: 'Bupropion' },
    { v: 'ecig',        ru: 'Электронка',      en: 'E-cigarette' },
    { v: 'app',         ru: 'Приложение',      en: 'App' },
    { v: 'other',       ru: 'Другое',          en: 'Other' },
  ];

  if (props.disabled) {
    return (
      <View style={{ gap: 16 }}>
        <H1>{tt('Хорошо, начинаем с чистого листа.', 'Good, we start clean.')}</H1>
        <Sub>{tt('Это значит, что мы стартуем с самого щадящего метода и будем подниматься, только если будет нужно.', 'We start with the gentlest method and step up only if needed.')}</Sub>
      </View>
    );
  }
  return (
    <View style={{ gap: 18 }}>
      <H1>{tt('Что было в последний раз?', 'What happened last time?')}</H1>
      <Sub>{tt('То, что не сработало раньше, не сработает и сейчас. Найдём другой способ.', "What didn't work before won't work now. We'll find another way.")}</Sub>

      <View style={{ gap: 6 }}>
        <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>{tt('Самая длинная попытка, дней', 'Longest attempt, days')}</Text>
        <TextInput
          value={props.longestDays} onChangeText={props.onLongest} keyboardType="number-pad"
          placeholder={tt('например, 30', 'e.g. 30')} placeholderTextColor={t.textDim}
          style={{ backgroundColor: t.bgElev, color: t.text, padding: 14, borderRadius: radius.md, fontSize: 22, fontWeight: '700', borderWidth: 1, borderColor: t.border }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>{tt('Каким методом', 'Which method')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {methods.map((m) => {
            const sel = props.method === m.v;
            return (
              <Pressable key={m.v} onPress={() => { Haptics.selectionAsync(); props.onMethod(m.v); }}
                style={{
                  paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999,
                  backgroundColor: sel ? t.accentSoft : t.bgElev,
                  borderWidth: 1, borderColor: sel ? t.accent : t.border,
                }}>
                <Text style={{ color: t.text, fontSize: 14, fontWeight: sel ? '700' : '500' }}>{lang === 'ru' ? m.ru : m.en}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>{tt('Что вернуло курить', 'What brought you back')}</Text>
        <TextInput
          value={props.trigger} onChangeText={props.onTrigger}
          placeholder={tt('например: «после ссоры с женой»', 'e.g. "after a fight with my wife"')} placeholderTextColor={t.textDim}
          multiline
          style={{ backgroundColor: t.bgElev, color: t.text, padding: 14, borderRadius: radius.md, fontSize: 16, minHeight: 70, borderWidth: 1, borderColor: t.border }}
        />
      </View>
    </View>
  );
}

const EXCUSES: { v: Excuse; ru: string; en: string }[] = [
  { v: 'one_wont_hurt', ru: 'Одна не помешает',     en: 'One won’t hurt' },
  { v: 'after_stress',  ru: 'После такого можно',   en: 'After all that, I can' },
  { v: 'monday',        ru: 'Начну в понедельник',  en: 'I’ll start Monday' },
  { v: 'social',        ru: 'Все вокруг курят',     en: 'Everyone around smokes' },
  { v: 'bored',         ru: 'От скуки',             en: 'From boredom' },
  { v: 'reward',        ru: 'Я заслужил',           en: 'I deserve it' },
  { v: 'event',         ru: 'Праздник / поездка',   en: 'Holiday / trip' },
  { v: 'too_hard',      ru: 'Слишком тяжело',       en: 'Too hard' },
  { v: 'try_later',     ru: 'Лучше попробую позже', en: 'I’ll try later' },
  { v: 'cant_alone',    ru: 'Один не справлюсь',    en: 'I can’t do it alone' },
];

function StepExcuses({ value, onChange }: { value: Excuse[]; onChange: (v: Excuse[]) => void }) {
  const t = useTheme();
  const lang = currentLang();
  function toggle(v: Excuse) {
    Haptics.selectionAsync();
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }
  return (
    <View style={{ gap: 16 }}>
      <H1>{tt('Какие из этих мыслей у тебя бывают?', 'Which of these thoughts do you have?')}</H1>
      <Sub>{tt('Эти оправдания одинаковые у миллионов курильщиков. Зная твои — мы заранее их перебьём.', 'These rationalizations are common among millions of smokers. Knowing yours, we counter them ahead of time.')}</Sub>
      <View style={{ gap: 8, marginTop: 4 }}>
        {EXCUSES.map((e) => {
          const sel = value.includes(e.v);
          return (
            <Pressable key={e.v} onPress={() => toggle(e.v)}
              style={{
                padding: 14, borderRadius: radius.md,
                backgroundColor: sel ? t.accentSoft : t.bgElev,
                borderWidth: 1, borderColor: sel ? t.accent : t.border,
                flexDirection: 'row', alignItems: 'center', gap: 10,
              }}>
              <View style={{
                width: 22, height: 22, borderRadius: 11,
                borderWidth: 2, borderColor: sel ? t.accent : t.border,
                backgroundColor: sel ? t.accent : 'transparent',
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

function StepReadiness({ importance, confidence, onImportance, onConfidence }: any) {
  const t = useTheme();
  const Slider = ({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) => (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: t.textDim, fontSize: 12 }}>0</Text>
        <Text style={{ color: t.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 }}>{value}</Text>
        <Text style={{ color: t.textDim, fontSize: 12 }}>10</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {Array.from({ length: 11 }).map((_, i) => (
          <Pressable key={i} onPress={() => { Haptics.selectionAsync(); onChange(i); }}
            style={{ flex: 1, height: 36, borderRadius: 8, backgroundColor: i <= value ? color : t.border }} />
        ))}
      </View>
    </View>
  );
  return (
    <View style={{ gap: 22 }}>
      <H1>{tt('Где ты сейчас?', 'Where are you now?')}</H1>
      <View style={{ gap: 10 }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{tt('Насколько важно бросить?', 'How important is quitting?')}</Text>
        <Slider value={importance} onChange={onImportance} color="#34C759" />
      </View>
      <View style={{ gap: 10 }}>
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{tt('Насколько уверен, что справишься?', 'How confident you can do it?')}</Text>
        <Slider value={confidence} onChange={onConfidence} color="#0A84FF" />
      </View>
      <Sub>
        {tt('Это поможет ИИ-помощнику говорить с тобой по делу, а не общими словами.', 'This helps the AI assistant talk to you to the point, not in generic words.')}
      </Sub>
    </View>
  );
}

function StepCheckInTime({ hour, onChange }: { hour: number; onChange: (h: number) => void }) {
  const t = useTheme();
  const presets = [9, 12, 18, 20, 21, 22];
  return (
    <View style={{ gap: 16 }}>
      <H1>{tt('Ежедневный чек-ин', 'Daily check-in')}</H1>
      <Sub>{tt('Раз в день мы спросим: «Сегодня курил?» Один тап. Это один из самых сильных поведенческих приёмов — он держит тебя в контакте с целью.', 'Once a day we ask: "Did you smoke today?" One tap. One of the strongest behavioural tools — it keeps you in contact with your goal.')}</Sub>
      <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 6 }}>{tt('В какое время', 'At what time')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {presets.map((h) => {
          const sel = hour === h;
          return (
            <Pressable key={h} onPress={() => { Haptics.selectionAsync(); onChange(h); }}
              style={{
                paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999,
                backgroundColor: sel ? t.accent : t.bgElev,
                borderWidth: 1, borderColor: sel ? t.accent : t.border,
              }}>
              <Text style={{ color: sel ? '#fff' : t.text, fontWeight: '700' }}>{String(h).padStart(2, '0')}:00</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
