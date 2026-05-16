import { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { Icon, type IconKey } from '../../components/Icon';
import type { Trigger, Motivation, QuitMethod, Profile, HealthFlag } from '../../lib/storage';
import { update } from '../../lib/storage';

const tt = (ru: string, en: string) => (currentLang() === 'ru' ? ru : en);

type StepKind =
  | 'years' | 'perday' | 'pack' | 'type' | 'health'
  | 'morning' | 'triggers' | 'motivation' | 'method' | 'faith';

const STEPS: StepKind[] = [
  'years', 'perday', 'pack', 'type', 'health',
  'morning', 'triggers', 'motivation', 'method', 'faith',
];

// Per-step visual identity + warm sub-line.
const META: Record<StepKind, { icon: IconKey; color: string; subRu: string; subEn: string }> = {
  years:      { icon: 'fire',   color: '#FF9500', subRu: 'Без осуждения. Просто чтобы понять твою историю.', subEn: 'No judgement. Just to understand your story.' },
  perday:     { icon: 'flame',  color: '#FF453A', subRu: 'Честная цифра поможет точнее посчитать прогресс.',  subEn: 'An honest number makes your progress accurate.' },
  pack:       { icon: 'sparkle',color: '#30D158', subRu: 'Скоро ты увидишь, сколько денег возвращается тебе.', subEn: 'Soon you will see the money coming back to you.' },
  type:       { icon: 'wind',   color: '#5AC8FA', subRu: 'Сигареты, вейп или IQOS — подход немного разный.',  subEn: 'Cigarettes, vape or IQOS — the approach differs.' },
  health:     { icon: 'heart',  color: '#FF453A', subRu: 'Чтобы безопасно подобрать метод именно под тебя.',  subEn: 'So we can pick a method that is safe for you.' },
  morning:    { icon: 'bolt',   color: '#FF9F0A', subRu: 'Утренняя сигарета многое говорит о зависимости.',   subEn: 'The morning cigarette reveals a lot about dependence.' },
  triggers:   { icon: 'target', color: '#BF5AF2', subRu: 'Зная триггеры, мы перебьём их заранее.',             subEn: 'Knowing your triggers, we counter them in advance.' },
  motivation: { icon: 'star',   color: '#34C759', subRu: 'Твоё «зачем» — топливо в трудный день.',             subEn: 'Your "why" is fuel for the hard days.' },
  method:     { icon: 'leaf',   color: '#0A84FF', subRu: 'Резко или постепенно — оба пути рабочие.',           subEn: 'Cold turkey or gradual — both paths work.' },
  faith:      { icon: 'cross',  color: '#FF9500', subRu: 'Полностью по желанию. Можно включить позже.',        subEn: 'Entirely optional. Can be enabled later.' },
};

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

  const kind = STEPS[idx];
  const meta = META[kind];
  const isLast = idx === STEPS.length - 1;
  const underage = kind === 'health' && (!age || Number(age) < 18);

  function next() {
    if (underage) return;
    Haptics.selectionAsync();
    if (!isLast) return setIdx(idx + 1);
    finish();
  }

  async function finish() {
    // Quiz captures the 2 heaviest FTND items — Heaviness of Smoking Index
    // (HSI, 0–6) — scaled to a 0–10 FTND-equivalent; the precise test refines it.
    const q1 = morning === 0 ? 3 : morning === 1 ? 2 : morning === 2 ? 1 : 0;
    const q4 = Number(perday) >= 31 ? 3 : Number(perday) >= 21 ? 2 : Number(perday) >= 11 ? 1 : 0;
    const hsi = q1 + q4;
    const fager = Math.round((hsi * 10) / 6);
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
      {/* Progress */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: 8 }}>
        <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>
          {tt(`Шаг ${idx + 1} из ${STEPS.length}`, `Step ${idx + 1} of ${STEPS.length}`)}
        </Text>
        <View style={{ height: 6, borderRadius: 6, backgroundColor: t.border, overflow: 'hidden' }}>
          <View style={{ width: `${((idx + 1) / STEPS.length) * 100}%`, height: '100%', backgroundColor: t.accent, borderRadius: 6 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 30, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <Animated.View key={idx} entering={FadeInDown.duration(260)} style={{ gap: 18 }}>
          {/* Icon badge */}
          <LinearGradient colors={[meta.color + '38', meta.color + '0A']}
            style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
            {(() => { const I = Icon[meta.icon]; return <I size={34} color={meta.color} />; })()}
          </LinearGradient>

          {/* Title comes from each step's control; subtitle is the warm line */}
          {kind === 'years' && (
            <NumberStep title={tr('onb.q_years')} sub={tt(META.years.subRu, META.years.subEn)}
              value={years} onChange={setYears} accent={meta.color}
              unit={tt('лет', 'years')} quick={[1, 3, 5, 10, 20]} />
          )}
          {kind === 'perday' && (
            <NumberStep title={tr('onb.q_perday')} sub={tt(META.perday.subRu, META.perday.subEn)}
              value={perday} onChange={setPerday} accent={meta.color}
              unit={tt('шт/день', '/day')} quick={[5, 10, 15, 20, 30]} />
          )}
          {kind === 'pack' && (
            <View style={{ gap: 14 }}>
              <Head title={tr('onb.q_pack_price')} sub={tt(META.pack.subRu, META.pack.subEn)} />
              <Field label={tr('onb.q_pack_price')} value={packPrice} onChange={setPackPrice} />
              <Field label={tr('onb.q_pack_size')} value={packSize} onChange={setPackSize} />
              <Field label={tr('onb.q_currency')} value={currency} onChange={setCurrency} keyboard="default" />
            </View>
          )}
          {kind === 'type' && (
            <Choice title={tr('onb.q_type')} sub={tt(META.type.subRu, META.type.subEn)} accent={meta.color}
              options={[
                { v: 'cigarette', l: tr('onb.type_cigarette') },
                { v: 'vape', l: tr('onb.type_vape') },
                { v: 'iqos', l: tr('onb.type_iqos') },
                { v: 'rolling', l: tr('onb.type_rolling') },
              ]}
              value={type} onChange={(v) => setType(v as Profile['type'])} />
          )}
          {kind === 'health' && (
            <HealthStep age={age} onAge={setAge} flags={healthFlags} onFlags={setHealthFlags}
              underage={!!underage} accent={meta.color} />
          )}
          {kind === 'morning' && (
            <Choice title={tr('onb.q_morning')} sub={tt(META.morning.subRu, META.morning.subEn)} accent={meta.color}
              options={[
                { v: 0, l: tr('onb.morning_5') },
                { v: 1, l: tr('onb.morning_30') },
                { v: 2, l: tr('onb.morning_60') },
                { v: 3, l: tr('onb.morning_later') },
              ]}
              value={morning} onChange={(v) => setMorning(v as 0|1|2|3)} />
          )}
          {kind === 'triggers' && (
            <Multi title={tr('onb.q_triggers')} sub={tt(META.triggers.subRu, META.triggers.subEn)} accent={meta.color}
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
          {kind === 'motivation' && (
            <Multi title={tr('onb.q_motivation')} sub={tt(META.motivation.subRu, META.motivation.subEn)} accent={meta.color}
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
          {kind === 'method' && (
            <Choice title={tr('onb.q_method')} sub={tt(META.method.subRu, META.method.subEn)} accent={meta.color}
              options={[
                { v: 'cold_turkey', l: tr('onb.method_cold') },
                { v: 'taper', l: tr('onb.method_taper') },
              ]}
              value={method} onChange={(v) => setMethod(v as QuitMethod)} />
          )}
          {kind === 'faith' && (
            <Choice title={tr('onb.q_faith')} sub={tt(META.faith.subRu, META.faith.subEn)} accent={meta.color}
              options={[
                { v: 'yes', l: tr('onb.faith_yes') },
                { v: 'no', l: tr('onb.faith_no') },
                { v: 'later', l: tr('onb.faith_later') },
              ]}
              value={faith} onChange={(v) => setFaith(v as any)} />
          )}
        </Animated.View>
      </ScrollView>

      <View style={{ padding: spacing.lg, flexDirection: 'row', gap: 10 }}>
        {idx > 0 && (
          <Pressable onPress={() => { Haptics.selectionAsync(); setIdx(idx - 1); }}
            style={{ width: 56, alignItems: 'center', justifyContent: 'center', borderRadius: radius.xl, borderWidth: 1, borderColor: t.border }}>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <Icon.arrowRight size={20} color={t.textDim} />
            </View>
          </Pressable>
        )}
        <Pressable onPress={next} disabled={underage}
          style={{ flex: 1, paddingVertical: 18, borderRadius: radius.xl, backgroundColor: underage ? t.border : t.accent, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
            {isLast ? tt('Собрать мой план', 'Build my plan') : tr('common.continue')}
          </Text>
          {!underage && <Icon.arrowRight size={18} color="#fff" />}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ---------- shared bits ---------- */

function Head({ title, sub }: { title: string; sub?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: t.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.6, lineHeight: 33 }}>{title}</Text>
      {sub ? <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 21 }}>{sub}</Text> : null}
    </View>
  );
}

function NumberStep({ title, sub, value, onChange, unit, quick, accent }: {
  title: string; sub?: string; value: string; onChange: (v: string) => void;
  unit?: string; quick?: number[]; accent: string;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 18 }}>
      <Head title={title} sub={sub} />
      <View style={{ alignItems: 'center', backgroundColor: t.bgElev, borderRadius: radius.lg, borderWidth: 1, borderColor: t.border, paddingVertical: 22 }}>
        <TextInput
          keyboardType="number-pad" value={value} onChangeText={onChange}
          style={{ fontSize: 68, fontWeight: '800', color: t.text, textAlign: 'center', minWidth: 140, letterSpacing: -2 }}
        />
        {unit ? <Text style={{ color: t.textDim, fontSize: 15, marginTop: -4 }}>{unit}</Text> : null}
      </View>
      {quick && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {quick.map((q) => {
            const sel = String(q) === value;
            return (
              <Pressable key={q} onPress={() => { Haptics.selectionAsync(); onChange(String(q)); }}
                style={{
                  paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
                  backgroundColor: sel ? accent : t.bgElev,
                  borderWidth: 1, borderColor: sel ? accent : t.border,
                }}>
                <Text style={{ color: sel ? '#fff' : t.text, fontWeight: '700', fontSize: 15 }}>{q}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function Field({ label, value, onChange, keyboard = 'number-pad' as const }: any) {
  const t = useTheme();
  return (
    <View>
      <Text style={{ color: t.textDim, fontSize: 13, marginBottom: 6 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType={keyboard}
        style={{ backgroundColor: t.bgElev, color: t.text, padding: 16, borderRadius: radius.md, fontSize: 18, fontWeight: '600', borderWidth: 1, borderColor: t.border }} />
    </View>
  );
}

function Choice<T>({ title, sub, options, value, onChange, accent }: {
  title: string; sub?: string; options: { v: T; l: string }[]; value: T;
  onChange: (v: T) => void; accent: string;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 16 }}>
      <Head title={title} sub={sub} />
      <View style={{ gap: 10 }}>
        {options.map((o) => {
          const sel = String(o.v) === String(value);
          return (
            <Pressable key={String(o.v)} onPress={() => { Haptics.selectionAsync(); onChange(o.v); }}
              style={{
                paddingVertical: 17, paddingHorizontal: 18, borderRadius: radius.lg,
                backgroundColor: sel ? accent + '16' : t.bgElev,
                borderWidth: 1.5, borderColor: sel ? accent : t.border,
                flexDirection: 'row', alignItems: 'center', gap: 12,
              }}>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: sel ? '700' : '500', flex: 1 }}>{o.l}</Text>
              <View style={{
                width: 24, height: 24, borderRadius: 12,
                borderWidth: 2, borderColor: sel ? accent : t.border,
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

function Multi<T extends string>({ title, sub, options, value, onChange, accent }: {
  title: string; sub?: string; options: { v: T; l: string }[]; value: T[];
  onChange: (v: T[]) => void; accent: string;
}) {
  const t = useTheme();
  function toggle(v: T) {
    Haptics.selectionAsync();
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }
  return (
    <View style={{ gap: 16 }}>
      <Head title={title} sub={sub} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {options.map((o) => {
          const sel = value.includes(o.v);
          return (
            <Pressable key={o.v} onPress={() => toggle(o.v)}
              style={{
                paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999,
                backgroundColor: sel ? accent : t.bgElev,
                borderWidth: 1.5, borderColor: sel ? accent : t.border,
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }}>
              {sel && <Icon.check size={13} color="#fff" />}
              <Text style={{ color: sel ? '#fff' : t.text, fontSize: 15, fontWeight: sel ? '700' : '500' }}>{o.l}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function HealthStep({ age, onAge, flags, onFlags, underage, accent }: {
  age: string; onAge: (v: string) => void;
  flags: HealthFlag[]; onFlags: (v: HealthFlag[]) => void; underage: boolean; accent: string;
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
      <Head title={ru ? 'Немного о здоровье' : 'A bit about your health'}
        sub={ru ? 'Чтобы безопасно подобрать метод. Приложение для взрослых 18+.'
                : 'So we pick a method safely. The app is for adults 18+.'} />

      <View style={{ alignItems: 'center', backgroundColor: t.bgElev, borderRadius: radius.lg, paddingVertical: 18,
        borderWidth: 1, borderColor: underage ? '#FF453A' : t.border }}>
        <Text style={{ color: t.textDim, fontSize: 13, marginBottom: 2 }}>{ru ? 'Твой возраст' : 'Your age'}</Text>
        <TextInput keyboardType="number-pad" value={age} onChangeText={onAge}
          style={{ fontSize: 52, fontWeight: '800', color: t.text, textAlign: 'center', minWidth: 110, letterSpacing: -1.5 }} />
      </View>
      {underage && (
        <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: '#FF453A14', borderWidth: 1, borderColor: '#FF453A44' }}>
          <Text style={{ color: '#FF453A', fontSize: 14, lineHeight: 20, fontWeight: '600' }}>
            {ru
              ? 'Приложение для людей 18 лет и старше. Если ты младше — обратись за поддержкой к врачу или родителям.'
              : 'This app is for people aged 18+. If you are younger, please ask a doctor or a parent for support.'}
          </Text>
        </View>
      )}

      <Text style={{ color: t.textDim, fontSize: 14, marginTop: 2 }}>
        {ru ? 'Отметь, если что-то из этого про тебя:' : 'Mark anything that applies:'}
      </Text>
      <View style={{ gap: 8 }}>
        {FLAGS.map((f) => {
          const sel = flags.includes(f.v);
          return (
            <Pressable key={f.v} onPress={() => toggle(f.v)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                padding: 15, borderRadius: radius.md,
                backgroundColor: sel ? accent + '16' : t.bgElev,
                borderWidth: 1.5, borderColor: sel ? accent : t.border,
              }}>
              <View style={{
                width: 24, height: 24, borderRadius: 7, borderWidth: 2,
                borderColor: sel ? accent : t.border,
                backgroundColor: sel ? accent : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {sel && <Icon.check size={13} color="#fff" />}
              </View>
              <Text style={{ color: t.text, fontSize: 15, flex: 1 }}>{f.l}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
