import { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import type { Trigger, Motivation, QuitMethod, Profile, HealthFlag } from '../../lib/storage';
import { update } from '../../lib/storage';

type Step =
  | { kind: 'years' } | { kind: 'perday' } | { kind: 'pack' } | { kind: 'type' }
  | { kind: 'health' }
  | { kind: 'morning' } | { kind: 'triggers' } | { kind: 'motivation' }
  | { kind: 'method' } | { kind: 'faith' };

const STEPS: Step[] = [
  { kind: 'years' }, { kind: 'perday' }, { kind: 'pack' }, { kind: 'type' },
  { kind: 'health' },
  { kind: 'morning' }, { kind: 'triggers' }, { kind: 'motivation' },
  { kind: 'method' }, { kind: 'faith' },
];

export default function Quiz() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [idx, setIdx] = useState(0);

  const [years, setYears] = useState('5');
  const [perday, setPerday] = useState('15');
  const [packPrice, setPackPrice] = useState('220');
  const [packSize, setPackSize] = useState('20');
  const [currency, setCurrency] = useState(currentLang() === 'ru' ? 'RUB' : 'USD');
  const [type, setType] = useState<Profile['type']>('cigarette');
  const [morning, setMorning] = useState<0 | 1 | 2 | 3>(2);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [mots, setMots] = useState<Motivation[]>([]);
  const [method, setMethod] = useState<QuitMethod>('cold_turkey');
  const [faith, setFaith] = useState<'yes' | 'no' | 'later'>('later');
  const [age, setAge] = useState('30');
  const [healthFlags, setHealthFlags] = useState<HealthFlag[]>([]);

  const step = STEPS[idx];
  const isLast = idx === STEPS.length - 1;
  const underage = step.kind === 'health' && (!age || Number(age) < 18);

  function next() {
    if (underage) return;
    Haptics.selectionAsync();
    if (!isLast) return setIdx(idx + 1);
    finish();
  }

  async function finish() {
    // Quiz captures only the 2 heaviest FTND items — Heaviness of Smoking Index (HSI, 0–6):
    // q1 (time to first cigarette) + q4 (cigs/day). The full Fagerström test (0–10) is
    // taken separately in /practice/fagerstrom. We scale HSI → 0–10 so the whole app
    // (recommendStep, transition, AI) works on ONE scale. The precise test overwrites this later.
    const q1 = morning === 0 ? 3 : morning === 1 ? 2 : morning === 2 ? 1 : 0;
    const q4 = Number(perday) >= 31 ? 3 : Number(perday) >= 21 ? 2 : Number(perday) >= 11 ? 1 : 0;
    const hsi = q1 + q4; // 0–6
    const fager = Math.round((hsi * 10) / 6); // estimated FTND-equivalent, 0–10
    const profile: Profile = {
      yearsSmoked: Number(years) || 0,
      cigsPerDay: Number(perday) || 0,
      cigsInPack: Number(packSize) || 20,
      packPrice: Number(packPrice) || 0,
      currency,
      type,
      fagerstromScore: fager,
      triggers,
      motivations: mots,
      method,
      quitDate: Date.now(),
      faithEnabled: faith === 'yes',
      language: currentLang(),
      onboardingComplete: false,
      age: Number(age) || undefined,
      healthFlags,
    };
    await update((s) => ({ ...s, profile }));
    router.replace('/(onboarding)/personality');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', gap: 4, padding: spacing.md }}>
        {STEPS.map((_, i) => (
          <View key={i} style={{
            flex: 1, height: 3, borderRadius: 3,
            backgroundColor: i <= idx ? t.accent : t.border,
          }} />
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 20, flexGrow: 1 }}>
        {step.kind === 'years' && (
          <NumberStep title={tr('onb.q_years')} value={years} onChange={setYears} />
        )}
        {step.kind === 'perday' && (
          <NumberStep title={tr('onb.q_perday')} value={perday} onChange={setPerday} />
        )}
        {step.kind === 'pack' && (
          <View style={{ gap: 16 }}>
            <Field label={tr('onb.q_pack_price')} value={packPrice} onChange={setPackPrice} />
            <Field label={tr('onb.q_pack_size')} value={packSize} onChange={setPackSize} />
            <Field label={tr('onb.q_currency')} value={currency} onChange={setCurrency} keyboard="default" />
          </View>
        )}
        {step.kind === 'type' && (
          <Choice title={tr('onb.q_type')}
            options={[
              { v: 'cigarette', l: tr('onb.type_cigarette') },
              { v: 'vape', l: tr('onb.type_vape') },
              { v: 'iqos', l: tr('onb.type_iqos') },
              { v: 'rolling', l: tr('onb.type_rolling') },
            ]}
            value={type} onChange={(v) => setType(v as Profile['type'])} />
        )}
        {step.kind === 'health' && (
          <HealthStep age={age} onAge={setAge} flags={healthFlags} onFlags={setHealthFlags} underage={!!underage} />
        )}
        {step.kind === 'morning' && (
          <Choice title={tr('onb.q_morning')}
            options={[
              { v: 0, l: tr('onb.morning_5') },
              { v: 1, l: tr('onb.morning_30') },
              { v: 2, l: tr('onb.morning_60') },
              { v: 3, l: tr('onb.morning_later') },
            ]}
            value={morning} onChange={(v) => setMorning(v as 0|1|2|3)} />
        )}
        {step.kind === 'triggers' && (
          <Multi title={tr('onb.q_triggers')}
            options={[
              { v: 'stress', l: tr('onb.trig_stress') },
              { v: 'coffee', l: tr('onb.trig_coffee') },
              { v: 'alcohol', l: tr('onb.trig_alcohol') },
              { v: 'after_meal', l: tr('onb.trig_after_meal') },
              { v: 'driving', l: tr('onb.trig_driving') },
              { v: 'social', l: tr('onb.trig_social') },
              { v: 'boredom', l: tr('onb.trig_boredom') },
            ]}
            value={triggers} onChange={(v) => setTriggers(v as Trigger[])} />
        )}
        {step.kind === 'motivation' && (
          <Multi title={tr('onb.q_motivation')}
            options={[
              { v: 'health', l: tr('onb.mot_health') },
              { v: 'money', l: tr('onb.mot_money') },
              { v: 'family', l: tr('onb.mot_family') },
              { v: 'sport', l: tr('onb.mot_sport') },
              { v: 'smell', l: tr('onb.mot_smell') },
              { v: 'control', l: tr('onb.mot_control') },
              { v: 'faith', l: tr('onb.mot_faith') },
            ]}
            value={mots} onChange={(v) => setMots(v as Motivation[])} />
        )}
        {step.kind === 'method' && (
          <Choice title={tr('onb.q_method')}
            options={[
              { v: 'cold_turkey', l: tr('onb.method_cold') },
              { v: 'taper', l: tr('onb.method_taper') },
            ]}
            value={method} onChange={(v) => setMethod(v as QuitMethod)} />
        )}
        {step.kind === 'faith' && (
          <Choice title={tr('onb.q_faith')}
            options={[
              { v: 'yes', l: tr('onb.faith_yes') },
              { v: 'no', l: tr('onb.faith_no') },
              { v: 'later', l: tr('onb.faith_later') },
            ]}
            value={faith} onChange={(v) => setFaith(v as any)} />
        )}
      </ScrollView>
      <View style={{ padding: spacing.lg, flexDirection: 'row', gap: 10 }}>
        {idx > 0 && (
          <Pressable onPress={() => setIdx(idx - 1)}
            style={{ paddingHorizontal: 18, paddingVertical: 16, borderRadius: radius.xl, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.text, fontSize: 16 }}>{tr('common.back')}</Text>
          </Pressable>
        )}
        <Pressable onPress={next} disabled={underage}
          style={{ flex: 1, paddingVertical: 18, borderRadius: radius.xl, backgroundColor: underage ? t.border : t.accent, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>{tr('common.continue')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function NumberStep({ title, value, onChange }: { title: string; value: string; onChange: (v: string) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 18 }}>
      <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>{title}</Text>
      <TextInput
        keyboardType="number-pad" value={value} onChangeText={onChange}
        style={{ fontSize: 64, fontWeight: '700', color: t.text, textAlign: 'center', paddingVertical: 24 }}
      />
    </View>
  );
}

function Field({ label, value, onChange, keyboard = 'number-pad' as const }: any) {
  const t = useTheme();
  return (
    <View>
      <Text style={{ color: t.textDim, fontSize: 13, marginBottom: 6 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType={keyboard}
        style={{ backgroundColor: t.bgElev, color: t.text, padding: 14, borderRadius: radius.md, fontSize: 18, borderWidth: 1, borderColor: t.border }} />
    </View>
  );
}

function Choice<T>({ title, options, value, onChange }: { title: string; options: { v: T; l: string }[]; value: T; onChange: (v: T) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>{title}</Text>
      <View style={{ gap: 10 }}>
        {options.map((o) => {
          const sel = String(o.v) === String(value);
          return (
            <Pressable key={String(o.v)} onPress={() => { Haptics.selectionAsync(); onChange(o.v); }}
              style={{
                padding: 16, borderRadius: radius.md,
                backgroundColor: sel ? t.accentSoft : t.bgElev,
                borderWidth: 1, borderColor: sel ? t.accent : t.border,
              }}>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: sel ? '600' : '400' }}>{o.l}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function HealthStep({ age, onAge, flags, onFlags, underage }: {
  age: string; onAge: (v: string) => void;
  flags: HealthFlag[]; onFlags: (v: HealthFlag[]) => void; underage: boolean;
}) {
  const t = useTheme();
  const ru = currentLang() === 'ru';
  const FLAGS: { v: HealthFlag; l: string }[] = ru ? [
    { v: 'pregnant',        l: 'Беременность или грудное вскармливание' },
    { v: 'heart_disease',   l: 'Болезни сердца и сосудов' },
    { v: 'seizures',        l: 'Судороги или эпилепсия' },
    { v: 'psychiatric',     l: 'Психическое расстройство (депрессия и др.)' },
    { v: 'eating_disorder', l: 'Расстройство пищевого поведения' },
    { v: 'kidney',          l: 'Тяжёлые болезни почек' },
  ] : [
    { v: 'pregnant',        l: 'Pregnancy or breastfeeding' },
    { v: 'heart_disease',   l: 'Heart or vascular disease' },
    { v: 'seizures',        l: 'Seizures or epilepsy' },
    { v: 'psychiatric',     l: 'Psychiatric condition (depression, etc.)' },
    { v: 'eating_disorder', l: 'Eating disorder' },
    { v: 'kidney',          l: 'Severe kidney disease' },
  ];
  function toggle(v: HealthFlag) {
    Haptics.selectionAsync();
    onFlags(flags.includes(v) ? flags.filter((x) => x !== v) : [...flags, v]);
  }
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>
        {ru ? 'Немного о здоровье' : 'A bit about your health'}
      </Text>
      <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 21 }}>
        {ru
          ? 'Это нужно, чтобы безопасно подбирать метод. Приложение для взрослых 18+ и не заменяет врача.'
          : 'This helps pick a method safely. The app is for adults 18+ and does not replace a doctor.'}
      </Text>

      <Text style={{ color: t.textDim, fontSize: 13 }}>{ru ? 'Твой возраст' : 'Your age'}</Text>
      <TextInput
        keyboardType="number-pad" value={age} onChangeText={onAge}
        style={{ fontSize: 44, fontWeight: '700', color: t.text, textAlign: 'center', paddingVertical: 12,
          backgroundColor: t.bgElev, borderRadius: radius.md, borderWidth: 1, borderColor: underage ? '#FF453A' : t.border }}
      />
      {underage && (
        <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: '#FF453A14', borderWidth: 1, borderColor: '#FF453A44' }}>
          <Text style={{ color: '#FF453A', fontSize: 14, lineHeight: 20, fontWeight: '600' }}>
            {ru
              ? 'Приложение предназначено для людей 18 лет и старше. Если ты младше — обратись к врачу или родителям за поддержкой в отказе от курения.'
              : 'This app is intended for people aged 18 and older. If you are younger, please ask a doctor or a parent for support with quitting.'}
          </Text>
        </View>
      )}

      <Text style={{ color: t.textDim, fontSize: 13, marginTop: 6 }}>
        {ru ? 'Отметь, если что-то из этого про тебя:' : 'Mark anything that applies to you:'}
      </Text>
      <View style={{ gap: 8 }}>
        {FLAGS.map((f) => {
          const sel = flags.includes(f.v);
          return (
            <Pressable key={f.v} onPress={() => toggle(f.v)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                padding: 14, borderRadius: radius.md,
                backgroundColor: sel ? t.accentSoft : t.bgElev,
                borderWidth: 1, borderColor: sel ? t.accent : t.border,
              }}>
              <View style={{
                width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                borderColor: sel ? t.accent : t.border,
                backgroundColor: sel ? t.accent : 'transparent',
              }} />
              <Text style={{ color: t.text, fontSize: 15, flex: 1 }}>{f.l}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: t.textDim, fontSize: 12, lineHeight: 18 }}>
        {ru
          ? 'Если что-то отмечено — приложение не будет предлагать тебе препараты без врача и сделает упор на безопасные поведенческие техники.'
          : 'If anything is marked, the app will not suggest medications without a doctor and will focus on safe behavioural techniques.'}
      </Text>
    </View>
  );
}

function Multi<T extends string>({ title, options, value, onChange }: { title: string; options: { v: T; l: string }[]; value: T[]; onChange: (v: T[]) => void }) {
  const t = useTheme();
  function toggle(v: T) {
    Haptics.selectionAsync();
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {options.map((o) => {
          const sel = value.includes(o.v);
          return (
            <Pressable key={o.v} onPress={() => toggle(o.v)}
              style={{
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
                backgroundColor: sel ? t.accentSoft : t.bgElev,
                borderWidth: 1, borderColor: sel ? t.accent : t.border,
              }}>
              <Text style={{ color: t.text, fontSize: 15, fontWeight: sel ? '600' : '400' }}>{o.l}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
