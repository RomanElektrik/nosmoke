import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { BreathingOrb } from '../../components/BreathingOrb';
import { Icon } from '../../components/Icon';
import { update, useAppState } from '../../lib/storage';
import { FAGERSTROM_RU, FAGERSTROM_EN, fagerstromBand, nrtRecommendation, taperPlan, REPLACE_ACTIONS_RU, REPLACE_ACTIONS_EN } from '../../lib/clinical';

export default function Practice() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();

  const back = () => router.back();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={back} hitSlop={12}>
          <Text style={{ color: t.accent, fontSize: 17 }}>← {tr('common.back')}</Text>
        </Pressable>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {id === 'box_breath'  && <BoxBreath onDone={back} />}
        {id === 'cyclic_sigh' && <CyclicSigh onDone={back} />}
        {id === 'pharma'      && <Pharma onDone={back} />}
        {id === 'urge_surf'   && <UrgeSurf onDone={back} />}
        {id === 'halt_check'  && <HaltCheck onDone={back} />}
        {id === 'if_then'     && <IfThen onDone={back} />}
        {id === 'grounding'   && <Grounding onDone={back} />}
        {id === 'reframe'     && <Reframe onDone={back} />}
        {id === 'fagerstrom'  && <Fagerstrom onDone={back} />}
        {id === 'nrt'         && <Nrt onDone={back} />}
        {id === 'taper'       && <Taper onDone={back} />}
        {id === 'mindfulness' && <Mindfulness onDone={back} />}
        {id === 'replace'     && <Replace onDone={back} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Title({ icon: I, color, title, intro }: any) {
  const t = useTheme();
  return (
    <View style={{ paddingHorizontal: spacing.lg, gap: 12 }}>
      <LinearGradient colors={[color + '38', color + '08']}
        style={{ width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
        <I size={36} color={color} />
      </LinearGradient>
      <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>{title}</Text>
      {intro ? <Text style={{ color: t.textDim, fontSize: 15, lineHeight: 21 }}>{intro}</Text> : null}
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled, color }: any) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={{ marginHorizontal: spacing.lg, marginTop: 16, padding: 18, borderRadius: radius.xl, backgroundColor: disabled ? t.border : (color ?? t.accent), alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

/* ---------------- existing practices ---------------- */

function BoxBreath({ onDone }: { onDone: () => void }) {
  const { t: tr } = useTranslation();
  return (
    <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
      <Title icon={Icon.wind} color="#5AC8FA" title={tr('tech.box.t')} intro={tr('tech.box.b')} />
      <BreathingOrb totalSeconds={120} onDone={onDone} />
    </ScrollView>
  );
}

function CyclicSigh({ onDone }: { onDone: () => void }) {
  const { t: tr } = useTranslation();
  const t = useTheme();
  const lang = currentLang();
  // Pattern (Balban 2023): inhale 1.5s + small top-off 0.8s + exhale 4.5s.
  const PHASES = [
    { key: 'in1', ru: 'Вдох',          en: 'Inhale',      dur: 1500, scale: 0.95 },
    { key: 'in2', ru: 'Добор воздуха', en: 'Top off',     dur: 800,  scale: 1.1 },
    { key: 'out', ru: 'Длинный выдох', en: 'Long exhale', dur: 4500, scale: 0.55 },
  ] as const;

  const TOTAL = 300;
  const [phase, setPhase] = useState(0);
  const startedAt = useRef(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);
  const scale = useSharedValue(0.55);
  const opacity = useSharedValue(0.6);

  // Per-second ticker
  useEffect(() => {
    startedAt.current = Date.now();
    const id = setInterval(() => {
      const e = Math.floor((Date.now() - startedAt.current) / 1000);
      setElapsedSec(e);
      if (e >= TOTAL) {
        clearInterval(id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onDone();
      }
    }, 250);
    return () => clearInterval(id);
  }, []);

  // Smooth ease curve
  const ease = Easing.bezier(0.42, 0, 0.58, 1);

  // Phase animation
  useEffect(() => {
    const p = PHASES[phase];
    Haptics.selectionAsync();
    scale.value = withTiming(p.scale, { duration: p.dur, easing: ease });
    opacity.value = withTiming(p.key === 'out' ? 0.35 : 0.85, { duration: p.dur, easing: ease });
    const id = setTimeout(() => setPhase((i) => (i + 1) % PHASES.length), p.dur);
    return () => clearTimeout(id);
  }, [phase]);

  const aOuter = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const aInner = useAnimatedStyle(() => ({ transform: [{ scale: scale.value * 1.18 }], opacity: opacity.value * 0.5 }));
  const aGlow  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value * 1.5 }], opacity: opacity.value * 0.18 }));
  const cur = PHASES[phase];
  const remaining = Math.max(0, TOTAL - elapsedSec);

  return (
    <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
      <Title icon={Icon.wind} color="#0A84FF" title={tr('tech.cyclic.t')}
        intro={lang === 'ru'
          ? 'Двойной вдох носом + длинный выдох ртом. 5 минут.'
          : 'Double inhale through nose + long exhale through mouth. 5 min.'} />
      <View style={{ alignItems: 'center', paddingVertical: 28, height: 320, justifyContent: 'center' }}>
        {/* outer glow */}
        <Animated.View style={[
          { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#0A84FF' }, aGlow,
        ]} />
        {/* halo */}
        <Animated.View style={[
          { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: '#0A84FF20' }, aInner,
        ]} />
        {/* main orb */}
        <Animated.View style={[
          {
            width: 200, height: 200, borderRadius: 100,
            backgroundColor: '#0A84FF24',
            borderWidth: 2, borderColor: '#0A84FF',
            alignItems: 'center', justifyContent: 'center',
          }, aOuter,
        ]}>
          <Text style={{ color: t.text, fontSize: 22, fontWeight: '700' }}>
            {lang === 'ru' ? cur.ru : cur.en}
          </Text>
        </Animated.View>
      </View>
      <Text style={{
        color: t.textDim, textAlign: 'center', fontSize: 18, fontWeight: '600',
        fontVariant: ['tabular-nums'] as any, letterSpacing: 0.5,
      }}>
        {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
      </Text>
      <Pressable onPress={onDone} style={{ marginHorizontal: spacing.lg, padding: 14, alignItems: 'center' }}>
        <Text style={{ color: t.textDim, fontWeight: '600' }}>{tr('common.done')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Pharma({ onDone }: { onDone: () => void }) {
  const t = useTheme();
  const lang = currentLang();
  const [state] = useAppState();
  const p = state.profile;
  const items = (lang === 'ru' ? [
    { id: 'cytisine',    name: 'Цитизин (Табекс)',     rr: 'RR 2.21', text: 'Растительный препарат. БЕЗ рецепта в России. Курс 25 дней по точной схеме (1 табл каждые 2 ч в первые 3 дня). Quit date — день 5. Цена в десятки раз ниже варениклина.', color: '#30D158' },
    { id: 'bupropion',   name: 'Бупропион (Велбутрин)', rr: 'RR 1.64', text: 'Антидепрессант, снижает тягу. По рецепту. 8 недель. Особенно хорош при сопутствующей депрессии. Противопоказан при судорогах.', color: '#FF9500' },
    { id: 'varenicline', name: 'Варениклин (Чампикс)', rr: 'RR 2.32', text: 'Самая эффективная монотерапия. По рецепту. 12 недель с титрованием. Принимать после еды. Возможны тошнота, яркие сны.', color: '#0A84FF' },
  ] : [
    { id: 'cytisine',    name: 'Cytisine (Tabex)',      rr: 'RR 2.21', text: 'Plant-derived. OTC in Russia / EU. 25-day strict schedule (1 tab every 2h first 3 days). Quit day = day 5. Many times cheaper than varenicline.', color: '#30D158' },
    { id: 'bupropion',   name: 'Bupropion (Wellbutrin)', rr: 'RR 1.64', text: 'Antidepressant lowering craving. Prescription. 8 weeks. Best with co-existing depression. Contraindicated with seizures.', color: '#FF9500' },
    { id: 'varenicline', name: 'Varenicline (Chantix)', rr: 'RR 2.32', text: 'Most effective monotherapy. Prescription. 12 weeks with titration. Take after meals. Nausea, vivid dreams possible.', color: '#0A84FF' },
  ]) as { id: 'varenicline'|'cytisine'|'bupropion'; name: string; rr: string; text: string; color: string }[];

  const selected = p?.medication ?? null;
  async function pick(id: typeof items[number]['id'] | null) {
    Haptics.notificationAsync(id ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    const startMs = Date.now();
    await update((s) => ({
      ...s,
      profile: s.profile ? {
        ...s.profile,
        medication: id ?? undefined,
        medicationStartedAt: id ? startMs : undefined,
      } : s.profile,
    }));
    if (id) {
      try {
        const { scheduleMedicationDoses } = await import('../../lib/notifications');
        await scheduleMedicationDoses(lang, id, startMs);
      } catch {}
    }
  }
  // Adherence calendar: last 14 days from check-ins
  const today = new Date(); today.setHours(0,0,0,0);
  const adherence: { date: string; taken: boolean | null }[] = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    const entry = state.checkIns.find((c) => c.date === key);
    return { date: key, taken: entry?.medTaken ?? null };
  });

  return (
    <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
      <Title icon={Icon.shield} color="#34C759" title={lang === 'ru' ? 'Лекарства' : 'Medications'} intro={lang === 'ru'
        ? 'Самый сильный медицинский рычаг. Отметь что принимаешь — и приложение начнёт вести расписание и адхерентность.'
        : 'Strongest medical lever. Mark what you take — the app will keep your schedule and adherence.'} />

      {/* Active medication banner with adherence */}
      {selected && (() => {
        const cur = items.find((x) => x.id === selected);
        if (!cur) return null;
        const startedDays = p?.medicationStartedAt ? Math.floor((Date.now() - p.medicationStartedAt) / 86400_000) + 1 : 1;
        const takenCount = adherence.filter((a) => a.taken === true).length;
        const skippedCount = adherence.filter((a) => a.taken === false).length;
        return (
          <View style={{ marginHorizontal: spacing.lg, padding: 14, borderRadius: radius.lg, backgroundColor: cur.color + '14', borderWidth: 1, borderColor: cur.color + '40', gap: 10 }}>
            <Text style={{ color: cur.color, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
              {lang === 'ru' ? `Принимаешь · день ${startedDays}` : `Taking · day ${startedDays}`}
            </Text>
            <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>{cur.name}</Text>
            <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
              {adherence.map((a) => (
                <View key={a.date} style={{
                  flex: 1, height: 26, borderRadius: 5,
                  backgroundColor: a.taken === true ? cur.color : a.taken === false ? '#FF453A40' : t.border,
                }} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: t.textDim, fontSize: 11 }}>{lang === 'ru' ? '14 дней назад' : '14 days ago'}</Text>
              <Text style={{ color: t.textDim, fontSize: 11 }}>{lang === 'ru' ? `${takenCount} принял · ${skippedCount} пропусков` : `${takenCount} taken · ${skippedCount} skipped`}</Text>
              <Text style={{ color: t.textDim, fontSize: 11 }}>{lang === 'ru' ? 'сегодня' : 'today'}</Text>
            </View>
          </View>
        );
      })()}

      <View style={{ paddingHorizontal: spacing.lg, gap: 10 }}>
        {items.map((d) => {
          const isMine = selected === d.id;
          return (
            <View key={d.id} style={{ padding: 14, borderRadius: radius.lg, backgroundColor: d.color + '12', borderWidth: 1, borderColor: isMine ? d.color : d.color + '30' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', flex: 1 }} numberOfLines={1}>{d.name}</Text>
                <Chip2 color={d.color}>{d.rr}</Chip2>
              </View>
              <Text style={{ color: t.textDim, fontSize: 13, marginTop: 8, lineHeight: 19 }}>{d.text}</Text>
              <Pressable onPress={() => pick(isMine ? null : d.id)}
                style={{
                  marginTop: 10, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
                  backgroundColor: isMine ? d.color : 'transparent',
                  borderWidth: 1, borderColor: d.color,
                }}>
                <Text style={{ color: isMine ? '#fff' : d.color, fontWeight: '700', fontSize: 13 }}>
                  {isMine ? (lang === 'ru' ? '✓ Принимаю' : '✓ I take this') : (lang === 'ru' ? 'Я принимаю' : 'I take this')}
                </Text>
              </Pressable>
            </View>
          );
        })}
        <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, marginTop: 4 }}>
          <Text style={{ color: t.textDim, fontSize: 12, lineHeight: 18 }}>
            {lang === 'ru'
              ? 'Источники: Cochrane Lindson 2023 (network meta-analysis), Theodoulou 2023 (NRT). Сравнение с плацебо. Отдельно про твою ситуацию — у врача.'
              : 'Sources: Cochrane Lindson 2023 (network meta-analysis), Theodoulou 2023 (NRT). vs placebo. For your specific case — see a clinician.'}
          </Text>
        </View>
      </View>
      <PrimaryButton label={lang === 'ru' ? 'Понятно' : 'OK'} onPress={onDone} color="#34C759" />
    </ScrollView>
  );
}

function Chip2({ color, children }: any) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: color + '24' }}>
      <Text style={{ color, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>{children}</Text>
    </View>
  );
}

function UrgeSurf({ onDone }: { onDone: () => void }) {
  const { t: tr } = useTranslation();
  const t = useTheme();
  const lang = currentLang();
  const [step, setStep] = useState(0);
  const stepsRu = [
    'Где в теле ощущение тяги? Покажи себе пальцем.',
    'Какого оно размера и формы? Тёплое или холодное?',
    'Двигается или стоит? Просто наблюдай.',
    'Назови ощущение про себя: «жжение», «давление», «беспокойство».',
    'Сделай 3 длинных выдоха. Проверь — оно изменилось?',
    'Волна спадает. Ты не сделал ничего, чтобы её прогнать. Она уходит сама.',
  ];
  const stepsEn = [
    'Where in the body is the craving? Point to it.',
    'What size and shape? Warm or cold?',
    'Moving or still? Just observe.',
    'Name it silently: "burning", "pressure", "restlessness".',
    'Three long exhales. Has it changed?',
    'The wave is fading. You did nothing to push it away. It leaves on its own.',
  ];
  const steps = lang === 'ru' ? stepsRu : stepsEn;
  return (
    <ScrollView contentContainerStyle={{ gap: 20, paddingBottom: 40 }}>
      <Title icon={Icon.feather} color="#0A84FF" title={tr('tech.surf.t')} intro={tr('tech.surf.s')} />
      <View style={{ marginHorizontal: spacing.lg, padding: 22, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, minHeight: 160, justifyContent: 'center' }}>
        <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          {step + 1} / {steps.length}
        </Text>
        <Text style={{ color: t.text, fontSize: 20, lineHeight: 28 }}>{steps[step]}</Text>
      </View>
      {step < steps.length - 1
        ? <PrimaryButton label={tr('practice.grounding.next')} onPress={() => { Haptics.selectionAsync(); setStep(step + 1); }} />
        : <PrimaryButton label={tr('common.done')} onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onDone(); }} />}
    </ScrollView>
  );
}

function HaltCheck({ onDone }: { onDone: () => void }) {
  const { t: tr } = useTranslation();
  const t = useTheme();
  const items: { k: 'h'|'a'|'l'|'t'; color: string }[] = [
    { k: 'h', color: '#FF9500' }, { k: 'a', color: '#FF453A' }, { k: 'l', color: '#5AC8FA' }, { k: 't', color: '#BF5AF2' },
  ];
  const [i, setI] = useState(0);
  const cur = items[i];

  if (i >= items.length) {
    return (
      <View style={{ flex: 1, padding: spacing.lg, justifyContent: 'center', gap: 16 }}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#30D15824', alignItems: 'center', justifyContent: 'center' }}>
          <Icon.check size={48} color="#30D158" />
        </View>
        <Text style={{ color: t.text, fontSize: 28, fontWeight: '700' }}>{tr('practice.halt.done_title')}</Text>
        <Text style={{ color: t.textDim, fontSize: 16, lineHeight: 22 }}>{tr('practice.halt.done_text')}</Text>
        <PrimaryButton label={tr('common.done')} onPress={onDone} />
      </View>
    );
  }
  function answer() {
    Haptics.selectionAsync();
    setTimeout(() => setI(i + 1), 200);
  }
  return (
    <ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 40 }}>
      <Title icon={Icon.pulse} color="#FF9F0A" title={tr('practice.halt.title')} intro={tr('practice.halt.intro')} />
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: spacing.lg }}>
        {items.map((_, idx) => (
          <View key={idx} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: idx <= i ? t.accent : t.border }} />
        ))}
      </View>
      <View style={{ marginHorizontal: spacing.lg, padding: 24, borderRadius: radius.lg, backgroundColor: cur.color + '15', borderWidth: 1, borderColor: cur.color + '40' }}>
        <Text style={{ color: cur.color, fontSize: 14, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>{cur.k.toUpperCase()}</Text>
        <Text style={{ color: t.text, fontSize: 24, fontWeight: '700', marginTop: 8, lineHeight: 30 }}>{tr(`practice.halt.${cur.k}`)}</Text>
        <Text style={{ color: t.textDim, fontSize: 14, marginTop: 12, lineHeight: 20 }}>{tr(`practice.halt.${cur.k}_hint`)}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: spacing.lg }}>
        <Pressable onPress={answer} style={{ flex: 1, padding: 18, borderRadius: radius.xl, backgroundColor: t.accent, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 17 }}>{tr('practice.halt.yes')}</Text>
        </Pressable>
        <Pressable onPress={answer} style={{ flex: 1, padding: 18, borderRadius: radius.xl, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, alignItems: 'center' }}>
          <Text style={{ color: t.text, fontWeight: '600', fontSize: 17 }}>{tr('practice.halt.no')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function IfThen({ onDone }: { onDone: () => void }) {
  const { t: tr } = useTranslation();
  const t = useTheme();
  const [state] = useAppState();
  const [trig, setTrig] = useState('');
  const [act, setAct] = useState('');
  const [savedAt, setSavedAt] = useState(0);
  const lang = currentLang();
  const recent = state.ifThens.slice(-5).reverse();

  async function save() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => ({
      ...s,
      ifThens: [...s.ifThens, { id: String(Date.now()), ts: Date.now(), trigger: trig.trim(), action: act.trim() }],
    }));
    setSavedAt(Date.now());
    setTrig(''); setAct('');
  }

  return (
    <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
      <Title icon={Icon.toolbox} color="#30D158" title={tr('practice.ifthen.title')} intro={tr('practice.ifthen.intro')} />
      <View style={{ paddingHorizontal: spacing.lg, gap: 12 }}>
        <Text style={{ color: t.textDim, fontSize: 13 }}>{tr('practice.ifthen.trigger')}</Text>
        <TextInput value={trig} onChangeText={setTrig} placeholder={tr('practice.ifthen.trigger_ph')} placeholderTextColor={t.textDim}
          multiline style={{ backgroundColor: t.bgElev, color: t.text, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, minHeight: 60, fontSize: 16 }} />
        <Text style={{ color: t.textDim, fontSize: 13, marginTop: 6 }}>{tr('practice.ifthen.action')}</Text>
        <TextInput value={act} onChangeText={setAct} placeholder={tr('practice.ifthen.action_ph')} placeholderTextColor={t.textDim}
          multiline style={{ backgroundColor: t.bgElev, color: t.text, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, minHeight: 60, fontSize: 16 }} />
      </View>
      <PrimaryButton label={savedAt && Date.now() - savedAt < 1500 ? (lang === 'ru' ? 'Сохранено' : 'Saved') : tr('practice.ifthen.save')} disabled={!trig.trim() || !act.trim()} onPress={save} color="#30D158" />

      {recent.length > 0 && (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: 12, gap: 8 }}>
          <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'Твои сценарии' : 'Your scripts'}
          </Text>
          {recent.map((r) => (
            <View key={r.id} style={{ padding: 12, borderRadius: radius.md, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
              <Text style={{ color: t.text, fontSize: 14 }}>
                <Text style={{ fontWeight: '700' }}>{lang === 'ru' ? 'Если ' : 'If '}</Text>{r.trigger}
              </Text>
              <Text style={{ color: t.text, fontSize: 14, marginTop: 4 }}>
                <Text style={{ fontWeight: '700' }}>{lang === 'ru' ? 'То ' : 'Then '}</Text>{r.action}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Grounding({ onDone }: { onDone: () => void }) {
  const { t: tr } = useTranslation();
  const t = useTheme();
  const steps: { k: 'see'|'hear'|'feel'|'smell'|'taste'; n: number }[] = [
    { k: 'see', n: 5 }, { k: 'hear', n: 4 }, { k: 'feel', n: 3 }, { k: 'smell', n: 2 }, { k: 'taste', n: 1 },
  ];
  const [i, setI] = useState(0);
  const cur = steps[i];

  if (i >= steps.length) {
    return (
      <View style={{ flex: 1, padding: spacing.lg, justifyContent: 'center', gap: 16 }}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#BF5AF224', alignItems: 'center', justifyContent: 'center' }}>
          <Icon.check size={48} color="#BF5AF2" />
        </View>
        <Text style={{ color: t.text, fontSize: 28, fontWeight: '700' }}>{tr('practice.grounding.done_title')}</Text>
        <Text style={{ color: t.textDim, fontSize: 16, lineHeight: 22 }}>{tr('practice.grounding.done_text')}</Text>
        <PrimaryButton label={tr('common.done')} onPress={onDone} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 40 }}>
      <Title icon={Icon.sparkle} color="#BF5AF2" title={tr('practice.grounding.title')} intro={tr('practice.grounding.intro')} />
      <View style={{ marginHorizontal: spacing.lg, padding: 24, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, minHeight: 160 }}>
        <Text style={{ fontSize: 80, fontWeight: '800', color: '#BF5AF2', letterSpacing: -2 }}>{cur.n}</Text>
        <Text style={{ color: t.text, fontSize: 18, lineHeight: 26, marginTop: 8 }}>{tr(`practice.grounding.${cur.k}`)}</Text>
      </View>
      <PrimaryButton label={tr('practice.grounding.next')} onPress={() => { Haptics.selectionAsync(); setI(i + 1); }} color="#BF5AF2" />
    </ScrollView>
  );
}

function Reframe({ onDone }: { onDone: () => void }) {
  const { t: tr } = useTranslation();
  const t = useTheme();
  const [state] = useAppState();
  const lang = currentLang();
  const [thought, setThought] = useState('');
  const [fact, setFact] = useState('');
  const [neu, setNeu] = useState('');
  const [savedAt, setSavedAt] = useState(0);
  const recent = state.reframes.slice(-3).reverse();

  async function save() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => ({
      ...s,
      reframes: [...s.reframes, { id: String(Date.now()), ts: Date.now(), thought: thought.trim(), counter: fact.trim(), replacement: neu.trim() }],
    }));
    setSavedAt(Date.now());
    setThought(''); setFact(''); setNeu('');
  }

  return (
    <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
      <Title icon={Icon.brain} color="#BF5AF2" title={tr('practice.reframe.title')} intro={tr('practice.reframe.intro')} />
      <View style={{ paddingHorizontal: spacing.lg, gap: 12 }}>
        <Text style={{ color: t.textDim, fontSize: 13 }}>{tr('practice.reframe.step1')}</Text>
        <TextInput value={thought} onChangeText={setThought} placeholder={tr('practice.reframe.thought_ph')} placeholderTextColor={t.textDim}
          multiline style={{ backgroundColor: t.bgElev, color: t.text, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, minHeight: 60, fontSize: 16 }} />
        <Text style={{ color: t.textDim, fontSize: 13, marginTop: 6 }}>{tr('practice.reframe.step2')}</Text>
        <TextInput value={fact} onChangeText={setFact} placeholder={tr('practice.reframe.fact_ph')} placeholderTextColor={t.textDim}
          multiline style={{ backgroundColor: t.bgElev, color: t.text, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, minHeight: 60, fontSize: 16 }} />
        <Text style={{ color: t.textDim, fontSize: 13, marginTop: 6 }}>{tr('practice.reframe.step3')}</Text>
        <TextInput value={neu} onChangeText={setNeu} placeholder={tr('practice.reframe.new_ph')} placeholderTextColor={t.textDim}
          multiline style={{ backgroundColor: t.bgElev, color: t.text, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, minHeight: 60, fontSize: 16 }} />
      </View>
      <PrimaryButton label={savedAt && Date.now() - savedAt < 1500 ? (lang === 'ru' ? 'Сохранено' : 'Saved') : tr('practice.reframe.save')} disabled={!thought.trim() || !neu.trim()} onPress={save} color="#BF5AF2" />

      {recent.length > 0 && (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: 12, gap: 8 }}>
          <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'История' : 'Past entries'}
          </Text>
          {recent.map((r) => (
            <View key={r.id} style={{ padding: 12, borderRadius: radius.md, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
              <Text style={{ color: t.textDim, fontSize: 12, fontStyle: 'italic' }} numberOfLines={2}>{r.thought}</Text>
              <Text style={{ color: t.accent, fontSize: 14, fontWeight: '600', marginTop: 6 }}>→ {r.replacement}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/* ---------------- new clinical practices ---------------- */

function Fagerstrom({ onDone }: { onDone: () => void }) {
  const t = useTheme();
  const lang = currentLang();
  const Q = lang === 'ru' ? FAGERSTROM_RU : FAGERSTROM_EN;
  const [i, setI] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  function pick(score: number) {
    Haptics.selectionAsync();
    const next = [...scores, score];
    setScores(next);
    if (i + 1 < Q.length) setI(i + 1);
    else {
      const total = next.reduce((a, b) => a + b, 0);
      update((s) => ({ ...s, profile: s.profile ? { ...s.profile, fagerstromScore: total } : s.profile }));
      setDone(true);
    }
  }

  if (done) {
    const total = scores.reduce((a, b) => a + b, 0);
    const band = fagerstromBand(total);
    return (
      <ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 40 }}>
        <Title icon={Icon.flask} color="#0A84FF" title={lang === 'ru' ? 'Результат Фагерстрёма' : 'Fagerström result'} />
        <View style={{ marginHorizontal: spacing.lg, padding: 22, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, alignItems: 'center' }}>
          <Text style={{ color: t.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'Балл' : 'Score'}
          </Text>
          <Text style={{ color: t.accent, fontSize: 64, fontWeight: '800', letterSpacing: -2, marginVertical: 4 }}>{total}<Text style={{ color: t.textDim, fontSize: 22, fontWeight: '500' }}>/10</Text></Text>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>{lang === 'ru' ? band.ru : band.en}</Text>
          <Text style={{ color: t.textDim, fontSize: 14, marginTop: 12, lineHeight: 21, textAlign: 'center' }}>
            {lang === 'ru' ? band.tipRu : band.tipEn}
          </Text>
        </View>
        <PrimaryButton label={lang === 'ru' ? 'Понятно' : 'OK'} onPress={onDone} color="#0A84FF" />
      </ScrollView>
    );
  }

  const q = Q[i];
  return (
    <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
      <Title icon={Icon.flask} color="#0A84FF" title={lang === 'ru' ? 'Тест Фагерстрёма' : 'Fagerström test'} intro={lang === 'ru' ? '6 вопросов о привычке. Балл 0–10 покажет силу зависимости.' : '6 questions about your habit. 0–10 score shows dependence level.'} />
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: spacing.lg }}>
        {Q.map((_, idx) => (
          <View key={idx} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: idx <= i ? '#0A84FF' : t.border }} />
        ))}
      </View>
      <View style={{ marginHorizontal: spacing.lg, padding: 18, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border }}>
        <Text style={{ color: t.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{i + 1} / {Q.length}</Text>
        <Text style={{ color: t.text, fontSize: 19, fontWeight: '700', marginTop: 8, lineHeight: 26 }}>{q.q}</Text>
      </View>
      <View style={{ paddingHorizontal: spacing.lg, gap: 8 }}>
        {q.options.map((o) => (
          <Pressable key={o.label} onPress={() => pick(o.score)}
            style={{ padding: 14, borderRadius: radius.md, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: t.text, fontSize: 15 }}>{o.label}</Text>
            <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '700' }}>+{o.score}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function Nrt({ onDone }: { onDone: () => void }) {
  const t = useTheme();
  const lang = currentLang();
  const [state] = useAppState();
  const p = state.profile;
  if (!p) return null;
  const rec = nrtRecommendation(p.cigsPerDay, p.fagerstromScore ?? 0);
  return (
    <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
      <Title icon={Icon.shield} color="#30D158" title={lang === 'ru' ? 'Заместительная терапия' : 'Nicotine replacement'} intro={lang === 'ru'
        ? `Рекомендация на основе ${p.cigsPerDay} сиг/день и балла Фагерстрёма ${p.fagerstromScore ?? '—'}. Это справка, не назначение.`
        : `Suggestion based on ${p.cigsPerDay} cigs/day and Fagerström ${p.fagerstromScore ?? '—'}. Reference, not a prescription.`} />
      <View style={{ marginHorizontal: spacing.lg, gap: 10 }}>
        <Card title={lang === 'ru' ? 'Пластырь' : 'Patch'} text={rec.patch} color="#30D158" />
        <Card title={lang === 'ru' ? 'Быстрая форма' : 'Rapid form'} text={rec.rapid} color="#0A84FF" />
        <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 6 }}>
          <Text style={{ color: t.text, fontWeight: '700', marginBottom: 4 }}>
            {lang === 'ru' ? 'Важное' : 'Notes'}
          </Text>
          {rec.notes.map((n, i) => (
            <Text key={i} style={{ color: t.textDim, fontSize: 13, lineHeight: 19 }}>• {n}</Text>
          ))}
        </View>
      </View>
      <PrimaryButton label={lang === 'ru' ? 'Понятно' : 'OK'} onPress={onDone} color="#30D158" />
    </ScrollView>
  );
}

function Card({ title, text, color }: { title: string; text: string; color: string }) {
  const t = useTheme();
  return (
    <View style={{ padding: 14, borderRadius: radius.md, backgroundColor: color + '14', borderWidth: 1, borderColor: color + '30' }}>
      <Text style={{ color, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Text>
      <Text style={{ color: t.text, fontSize: 15, marginTop: 6, lineHeight: 21 }}>{text}</Text>
    </View>
  );
}

function Taper({ onDone }: { onDone: () => void }) {
  const t = useTheme();
  const lang = currentLang();
  const [state] = useAppState();
  const p = state.profile;
  const [weeks, setWeeks] = useState(4);
  if (!p) return null;
  const plan = taperPlan(p.cigsPerDay, weeks);
  return (
    <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
      <Title icon={Icon.pulse} color="#FF9F0A" title={lang === 'ru' ? 'Постепенное снижение' : 'Taper plan'} intro={lang === 'ru'
        ? `Старт: ${p.cigsPerDay} сиг/день. Через ${weeks} недель — ноль.`
        : `Start: ${p.cigsPerDay} cigs/day. By week ${weeks} — zero.`} />
      <View style={{ paddingHorizontal: spacing.lg, flexDirection: 'row', gap: 8 }}>
        {[2, 4, 6, 8].map((w) => (
          <Pressable key={w} onPress={() => { Haptics.selectionAsync(); setWeeks(w); }}
            style={{ flex: 1, padding: 12, borderRadius: radius.md, backgroundColor: weeks === w ? '#FF9F0A' : t.bgElev, borderWidth: 1, borderColor: weeks === w ? '#FF9F0A' : t.border, alignItems: 'center' }}>
            <Text style={{ color: weeks === w ? '#fff' : t.text, fontWeight: '700' }}>{w} {lang === 'ru' ? 'нед' : 'wk'}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ paddingHorizontal: spacing.lg, gap: 8 }}>
        {plan.map((target, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: radius.md, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FF9F0A22', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FF9F0A', fontWeight: '800' }}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 14 }}>{lang === 'ru' ? `Неделя ${i + 1}` : `Week ${i + 1}`}</Text>
              <View style={{ height: 6, backgroundColor: t.border, borderRadius: 6, marginTop: 6, overflow: 'hidden' }}>
                <View style={{ width: `${(target / p.cigsPerDay) * 100}%`, height: '100%', backgroundColor: '#FF9F0A' }} />
              </View>
            </View>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', minWidth: 40, textAlign: 'right' }}>{target}</Text>
          </View>
        ))}
      </View>
      <PrimaryButton label={lang === 'ru' ? 'Принять план' : 'Accept plan'} onPress={onDone} color="#FF9F0A" />
    </ScrollView>
  );
}

function Mindfulness({ onDone }: { onDone: () => void }) {
  const t = useTheme();
  const lang = currentLang();
  const TOTAL = 600; // 10 min
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef<any>(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setElapsed((e) => Math.min(TOTAL, e + 1)), 1000);
      return () => clearInterval(ref.current);
    }
  }, [running]);

  useEffect(() => {
    if (elapsed >= TOTAL) {
      setRunning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [elapsed]);

  const phasesRu = [
    { at: 0,   text: 'Сядь удобно. Закрой глаза. Просто заметь дыхание — не меняй его.' },
    { at: 60,  text: 'Замечай вдох и выдох. Считай до 10 выдохов и начинай заново.' },
    { at: 180, text: 'Если приходит мысль о сигарете — не борись. Скажи про себя «тяга» и возвращайся к дыханию.' },
    { at: 360, text: 'Замечай тело. Где напряжение? Расслабь плечи, лоб, челюсть.' },
    { at: 480, text: 'Замечай саму тягу как ощущение в теле. Где она? Какого размера? Просто наблюдай.' },
    { at: 540, text: 'Последняя минута. Поблагодари себя. Это была тренировка ума.' },
  ];
  const phasesEn = [
    { at: 0,   text: 'Sit comfortably. Close your eyes. Just notice your breath — don\'t change it.' },
    { at: 60,  text: 'Notice each inhale and exhale. Count to 10 exhales and start over.' },
    { at: 180, text: 'If a smoking thought arrives — don\'t fight it. Say "craving" silently and return to breath.' },
    { at: 360, text: 'Notice the body. Where is tension? Relax shoulders, forehead, jaw.' },
    { at: 480, text: 'Notice the craving as a body sensation. Where is it? What size? Just observe.' },
    { at: 540, text: 'Last minute. Thank yourself. This was training for the mind.' },
  ];
  const phases = lang === 'ru' ? phasesRu : phasesEn;
  const cur = [...phases].reverse().find((p) => elapsed >= p.at) ?? phases[0];

  const pct = elapsed / TOTAL;
  const mins = Math.floor((TOTAL - elapsed) / 60);
  const secs = (TOTAL - elapsed) % 60;
  const finished = elapsed >= TOTAL;

  return (
    <ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 40 }}>
      <Title icon={Icon.flame} color="#FF9500" title={lang === 'ru' ? 'Майндфулнес 10 минут' : 'Mindfulness 10 min'} />
      <View style={{ alignItems: 'center', marginVertical: 16 }}>
        {finished ? (
          <View style={{ width: 96, height: 96, borderRadius: 28, backgroundColor: '#FF950024', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.check size={56} color="#FF9500" />
          </View>
        ) : (
          <Text style={{ color: t.text, fontSize: 64, fontWeight: '800', letterSpacing: -2 }}>
            {`${mins}:${String(secs).padStart(2, '0')}`}
          </Text>
        )}
        <View style={{ width: 200, height: 6, backgroundColor: t.border, borderRadius: 6, marginTop: 12, overflow: 'hidden' }}>
          <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: '#FF9500' }} />
        </View>
      </View>
      <View style={{ marginHorizontal: spacing.lg, padding: 18, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, minHeight: 120, justifyContent: 'center' }}>
        <Text style={{ color: t.text, fontSize: 17, lineHeight: 25 }}>{cur.text}</Text>
      </View>
      {!finished ? (
        <PrimaryButton label={running ? (lang === 'ru' ? 'Пауза' : 'Pause') : (lang === 'ru' ? 'Начать' : 'Start')} onPress={() => setRunning(!running)} color="#FF9500" />
      ) : (
        <PrimaryButton label={lang === 'ru' ? 'Готово' : 'Done'} onPress={onDone} color="#FF9500" />
      )}
    </ScrollView>
  );
}

function Replace({ onDone }: { onDone: () => void }) {
  const t = useTheme();
  const lang = currentLang();
  const list = lang === 'ru' ? REPLACE_ACTIONS_RU : REPLACE_ACTIONS_EN;
  const [pick, setPick] = useState(() => list[Math.floor(Math.random() * list.length)]);
  function reroll() {
    Haptics.selectionAsync();
    let next = pick;
    while (next === pick) next = list[Math.floor(Math.random() * list.length)];
    setPick(next);
  }
  return (
    <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
      <Title icon={Icon.drop} color="#5AC8FA" title={lang === 'ru' ? 'Замена ритуала' : 'Replace the ritual'} intro={lang === 'ru' ? 'Сделай это вместо сигареты прямо сейчас.' : 'Do this instead of a cigarette right now.'} />
      <View style={{ marginHorizontal: spacing.lg, padding: 24, borderRadius: radius.lg, backgroundColor: '#5AC8FA15', borderWidth: 1, borderColor: '#5AC8FA40', minHeight: 140, justifyContent: 'center' }}>
        <Text style={{ color: t.text, fontSize: 22, fontWeight: '700', lineHeight: 30 }}>{pick}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: spacing.lg }}>
        <Pressable onPress={reroll} style={{ flex: 1, padding: 16, borderRadius: radius.xl, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, alignItems: 'center' }}>
          <Text style={{ color: t.text, fontWeight: '600' }}>{lang === 'ru' ? '↻ Другое' : '↻ Another'}</Text>
        </Pressable>
        <Pressable onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onDone(); }}
          style={{ flex: 1, padding: 16, borderRadius: radius.xl, backgroundColor: '#5AC8FA', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{lang === 'ru' ? 'Сделал' : 'Done'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
