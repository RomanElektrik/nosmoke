import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { useAppState } from '../../lib/storage';
import { secondsClean, nextMilestone, progressFor } from '../../lib/health';
import {
  moneySaved, cigsAvoided, lifeRegainedSeconds,
  formatMoneyLive, formatDurationLive, formatCigs, formatDuration,
} from '../../lib/money';
import { StreakRing } from '../../components/StreakRing';
import { Icon } from '../../components/Icon';
import { MoneyJar } from '../../components/MoneyJar';
import { programToday, currentLevel, cravingsSurvived, checkInStreak, programPhase } from '../../lib/program';
import { getStep, escalationSuggestion, prepChecklist } from '../../lib/stepped';
import { getTrack } from '../../lib/tracks';
import { update } from '../../lib/storage';
import { todayDoses, isDoseTaken, doseKey, medCourseDay } from '../../lib/medication';

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [state] = useAppState();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-activate pending method when its scheduled date arrives.
  useEffect(() => {
    const p2 = state.profile;
    if (!p2?.pendingMethod || !p2?.pendingQuitDate) return;
    if (p2.pendingQuitDate <= Date.now()) {
      const startMs = p2.pendingQuitDate;
      const stepId = p2.pendingMethod;
      import('../../lib/storage').then(({ update }) => {
        update((s) => s.profile ? ({
          ...s,
          profile: {
            ...s.profile,
            currentStep: stepId,
            stepEnteredAt: startMs,
            quitDate: startMs,
            pendingMethod: undefined,
            pendingQuitDate: undefined,
          },
        }) : s);
      });
    }
  }, [state.profile?.pendingMethod, state.profile?.pendingQuitDate, now]);

  if (!state.profile) return null;
  const p = state.profile;
  const secs = secondsClean(p.quitDate, now);
  const next = nextMilestone(secs);
  const progress = next ? progressFor(next, secs) : 1;
  const lang = currentLang();
  const lvl = currentLevel(secs);
  const programDay = programToday(state);
  const survived = cravingsSurvived(state);
  const checkStreak = checkInStreak(state);
  const phase = programPhase(state);
  const localeStr = lang === 'ru' ? 'ru-RU' : 'en-US';

  const days = Math.floor(secs / 86400);
  const ringLabel = days >= 1 ? `${days}` : `${Math.floor(secs / 3600)}h`;
  const ringSub = days >= 1 ? (lang === 'ru' ? 'дней без сигарет' : 'days smoke-free') : '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <LinearGradient
        colors={[t.accentSoft, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: 14, paddingBottom: 130 }}>
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <StreakRing progress={progress} label={ringLabel} sub={ringSub} />
          <Text style={{
            color: t.text, fontSize: 24, fontWeight: '600', letterSpacing: -0.3, marginTop: 14,
            fontVariant: ['tabular-nums'] as any,
          }}>
            {formatDurationLive(secs, lang)}
          </Text>
          {next && (
            <View style={{
              marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
              backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border,
            }}>
              <Text style={{ color: t.textDim, fontSize: 12 }}>
                {lang === 'ru' ? 'до' : 'to'} <Text style={{ color: t.text, fontWeight: '600' }}>{tr(next.titleKey)}</Text> · {formatDuration(next.at - secs, lang)}
              </Text>
            </View>
          )}
        </View>

        {/* chip stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <ChipStat
            color="#30D158" icon={<Icon.sparkle size={18} color="#30D158" />}
            value={formatMoneyLive(moneySaved(p, secs), p.currency, localeStr)}
            label={lang === 'ru' ? 'сэкономил' : 'saved'} />
          <ChipStat
            color="#FF9500" icon={<Icon.flame size={18} color="#FF9500" />}
            value={formatCigs(cigsAvoided(p, secs))}
            label={lang === 'ru' ? 'не выкурил' : 'avoided'} />
          <ChipStat
            color="#FF453A" icon={<Icon.heart size={18} color="#FF453A" />}
            value={formatDurationLive(lifeRegainedSeconds(p, secs), lang)}
            label={lang === 'ru' ? 'жизни' : 'life'} mono />
        </View>

        {/* Single prioritised action */}
        <TodayFocus secs={secs} />

        {/* Pending start banner */}
        {p.pendingMethod && p.pendingQuitDate && p.pendingQuitDate > Date.now() && (() => {
          const newStep = getStep(p.pendingMethod);
          const items = prepChecklist(p.pendingMethod, p.faithEnabled);
          const doneCount = (p.pendingPrep ?? []).filter((x) => x.done).length;
          const daysLeft = Math.ceil((p.pendingQuitDate - Date.now()) / 86400_000);
          return (
            <Pressable onPress={() => router.push('/transition')}>
              <View style={{
                padding: 16, borderRadius: radius.lg,
                backgroundColor: newStep.color + '14', borderWidth: 1, borderColor: newStep.color + '40',
                gap: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: newStep.color + '24', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: newStep.color, fontWeight: '800', fontSize: 16 }}>{daysLeft}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: newStep.color, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {lang === 'ru' ? `Старт через ${daysLeft} ${daysLeft === 1 ? 'день' : 'дн.'}` : `Starts in ${daysLeft} day(s)`}
                    </Text>
                    <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
                      {lang === 'ru' ? newStep.titleRu : newStep.titleEn}
                    </Text>
                    <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
                      {lang === 'ru' ? `Подготовка: ${doneCount} из ${items.length}` : `Preparation: ${doneCount} of ${items.length}`}
                    </Text>
                  </View>
                  <Text style={{ color: t.textDim, fontSize: 18 }}>›</Text>
                </View>
              </View>
            </Pressable>
          );
        })()}

        {/* Graduation banner */}
        {phase === 'graduated' && (
          <Pressable onPress={() => router.push('/program')}>
            <View style={{
              padding: 16, borderRadius: radius.lg,
              backgroundColor: '#FFD60A20', borderWidth: 1, borderColor: '#FFD60A60',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFD60A30',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon.crown size={26} color="#FFD60A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFD60A', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {lang === 'ru' ? 'Курс пройден' : 'Course complete'}
                  </Text>
                  <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', marginTop: 2 }}>
                    {lang === 'ru' ? 'Maintenance mode' : 'Maintenance mode'}
                  </Text>
                  <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
                    {lang === 'ru' ? 'Поддержка раз в неделю. Ты молодец.' : 'Support once a week. Well done.'}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}

        {/* Merged plan card: method + program + medication + escalation */}
        {phase !== 'graduated' && <PlanCard />}

        <MoneyJar profile={p} onPress={() => router.push('/goal')} />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <QuickLink icon={<Icon.pulse size={20} color={t.text} />} label={tr('tabs.health')} onPress={() => router.push('/(tabs)/health')} />
          <QuickLink icon={<Icon.toolbox size={20} color={t.text} />} label={tr('tabs.techniques')} onPress={() => router.push('/(tabs)/techniques')} />
          <QuickLink icon={<Icon.chat size={20} color={t.text} />} label={tr('tabs.coach')} onPress={() => router.push('/(tabs)/coach')} />
        </View>
      </ScrollView>

      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); router.push('/craving'); }}
        style={({ pressed }) => ({
          position: 'absolute', left: 16, right: 16, bottom: 24,
          backgroundColor: t.danger, borderRadius: radius.xl, paddingVertical: 18, alignItems: 'center',
          shadowColor: t.danger, shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 10 },
          elevation: 8, opacity: pressed ? 0.9 : 1,
          flexDirection: 'row', justifyContent: 'center', gap: 10,
        })}>
        <Icon.flame size={20} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 }}>{tr('home.sos')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// Single prioritised "do this now" card. Days 1–6 = peak-abstinence crisis window
// (research: days 2–5 are subjectively the hardest, the main retention drop-off).
function TodayFocus({ secs }: { secs: number }) {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  if (!state.profile) return null;

  const today = new Date().toISOString().slice(0, 10);
  const checkDone = !!state.checkIns.find((c) => c.date === today);

  // Medication dose overdue today?
  let medOverdue = false;
  if (state.profile.medication) {
    const { schedule } = todayDoses(state, lang);
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    medOverdue = schedule.some((d) => (d.hour * 60 + d.minute) <= nowMin && !isDoseTaken(state, today, d.doseNumber));
  }

  // Priority: overdue medication → daily check-in → breathing practice.
  let action: { label: string; sub: string; href: string; color: string; icon: any };
  if (medOverdue) {
    action = {
      label: lang === 'ru' ? 'Приём препарата' : 'Take your medication',
      sub: lang === 'ru' ? 'Есть доза, которую пора принять' : 'A dose is due now',
      href: '/meds', color: '#0A84FF', icon: Icon.shield,
    };
  } else if (!checkDone) {
    action = {
      label: lang === 'ru' ? 'Чек-ин дня' : 'Daily check-in',
      sub: lang === 'ru' ? 'Один тап — ответь честно' : 'One tap — be honest',
      href: '/checkin', color: '#34C759', icon: Icon.pulse,
    };
  } else {
    action = {
      label: lang === 'ru' ? '5 минут дыхания' : '5 minutes of breathing',
      sub: lang === 'ru' ? 'Снизит тягу и стресс прямо сейчас' : 'Lowers craving and stress right now',
      href: '/practice/cyclic_sigh', color: '#0A84FF', icon: Icon.wind,
    };
  }

  const I = action.icon;
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); router.push(action.href as any); }}>
      <View style={{
        padding: 16, borderRadius: radius.lg,
        backgroundColor: action.color + '14', borderWidth: 1, borderColor: action.color + '50',
        flexDirection: 'row', alignItems: 'center', gap: 14,
      }}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: action.color + '28', alignItems: 'center', justifyContent: 'center' }}>
          <I size={28} color={action.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: action.color, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'Сделай сейчас' : 'Do this now'}
          </Text>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '700', marginTop: 2 }}>{action.label}</Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>{action.sub}</Text>
        </View>
        <Text style={{ color: action.color, fontSize: 20 }}>›</Text>
      </View>
    </Pressable>
  );
}

// Vaping / IQOS users have a different habit shape: no natural "pack" pacing,
// constant access, often hidden high nicotine intake. One rotating tip.
const VAPE_TIPS_RU = [
  'У вейпа нет «пачки» — нет естественной паузы. Назначь себе чёткие правила: где и когда нельзя парить.',
  'Скрытая доза часто выше, чем кажется. Если планируешь снижать постепенно — снижай крепость жидкости (мг никотина), а не только число затяжек.',
  'Убери вейп из зоны лёгкого доступа: из кармана, со стола, от кровати. Каждый лишний шаг до устройства — твой союзник.',
  'Затяжка «на автомате» — главный враг вейпера. Перед каждой спрашивай себя: это тяга или просто рука потянулась?',
];
const VAPE_TIPS_EN = [
  'A vape has no "pack" — no natural pause. Set yourself clear rules: where and when you will not vape.',
  'Hidden nicotine intake is often higher than it feels. If tapering, lower the liquid strength (nicotine mg), not just puff count.',
  'Move the vape out of easy reach — out of your pocket, off the desk, away from the bed. Every extra step is your ally.',
  'Autopilot puffs are the vaper\'s main enemy. Before each one ask: is this a craving, or just my hand reaching?',
];

function VapeNote() {
  const t = useTheme();
  const lang = currentLang();
  const [state] = useAppState();
  const type = state.profile?.type;
  if (type !== 'vape' && type !== 'iqos') return null;
  const tips = lang === 'ru' ? VAPE_TIPS_RU : VAPE_TIPS_EN;
  const idx = Math.floor(Date.now() / 86400_000) % tips.length;
  return (
    <View style={{
      padding: 14, borderRadius: radius.lg,
      backgroundColor: '#5AC8FA12', borderWidth: 1, borderColor: '#5AC8FA30',
      gap: 6,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon.wind size={16} color="#5AC8FA" />
        <Text style={{ color: '#5AC8FA', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
          {type === 'iqos'
            ? (lang === 'ru' ? 'Трек: IQOS' : 'Track: IQOS')
            : (lang === 'ru' ? 'Трек: вейпинг' : 'Track: vaping')}
        </Text>
      </View>
      <Text style={{ color: t.text, fontSize: 14, lineHeight: 20 }}>{tips[idx]}</Text>
    </View>
  );
}

// ONE merged card: method (step) + program day + today focus + medication dose
// + escalation hint. Replaces the old separate Method / Program / Med cards
// that felt like conflicting plans.
function PlanCard() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const stepId = state.profile?.currentStep;
  if (!stepId) return null;
  const step = getStep(stepId);
  const prog = programToday(state);
  const sug = escalationSuggestion(state);
  const med = state.profile?.medication;
  const medInfo = med ? todayDoses(state, lang) : null;
  const focus = prog.data ? (lang === 'ru' ? prog.data.focusRu : prog.data.focusEn) : '';
  const pct = prog.total > 0 ? prog.day / prog.total : 0;

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: t.textDim, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 4 }}>
        {lang === 'ru' ? 'Твой план' : 'Your plan'}
      </Text>
      <Pressable onPress={() => router.push('/program')}>
        <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 12 }}>
          {/* Method + program day */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: step.color + '24', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: step.color, fontWeight: '800', fontSize: 17 }}>{step.index}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
                {lang === 'ru' ? step.titleRu : step.titleEn}
              </Text>
              <Text style={{ color: t.textDim, fontSize: 13, marginTop: 1 }}>
                {prog.data
                  ? (lang === 'ru' ? `День ${prog.day} из ${prog.total}` : `Day ${prog.day} of ${prog.total}`)
                  : (lang === 'ru' ? `Ступень ${step.index} из 5` : `Step ${step.index} of 5`)}
              </Text>
            </View>
            <Text style={{ color: t.textDim, fontSize: 20 }}>›</Text>
          </View>

          {prog.data && (
            <View style={{ height: 5, backgroundColor: t.border, borderRadius: 5, overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, pct * 100)}%`, height: '100%', backgroundColor: step.color }} />
            </View>
          )}
          {!!focus && (
            <Text style={{ color: t.text, fontSize: 14, lineHeight: 20 }}>{focus}</Text>
          )}

          {/* Medication dose — inline, not a separate card */}
          {medInfo && medInfo.schedule.length > 0 && (
            <Pressable onPress={() => router.push('/meds')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border }}>
              <Icon.shield size={18} color={step.color} />
              <Text style={{ color: t.text, fontSize: 13, flex: 1 }}>
                {lang === 'ru' ? 'Приём препарата сегодня' : 'Medication doses today'}
              </Text>
              <Text style={{ color: step.color, fontSize: 14, fontWeight: '800' }}>
                {medInfo.takenCount}/{medInfo.schedule.length}
              </Text>
            </Pressable>
          )}

          {/* Escalation hint — folded in, not a scary separate card */}
          {sug.yes && (
            <Pressable onPress={() => router.push('/transition')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border }}>
              <Icon.bolt size={16} color={t.warn} />
              <Text style={{ color: t.warn, fontSize: 13, fontWeight: '600', flex: 1 }}>
                {lang === 'ru' ? 'Метод держит слабовато — обсудим?' : 'Method feels too light — discuss?'}
              </Text>
              <Text style={{ color: t.warn, fontSize: 14 }}>→</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </View>
  );
}

function MedicationDiary() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const med = state.profile?.medication;
  const stepId = state.profile?.currentStep;
  const trackHasMed = stepId ? getTrack(stepId).hasMedication : false;

  // Track requires a medication but user hasn't chosen one — show CTA
  if (!med && trackHasMed) {
    const expected = stepId === 'L2_nrt_light' ? 'Цитизин (Табекс)'
      : stepId === 'L3_nrt_combo' ? 'Бупропион (Велбутрин)'
      : 'Варениклин (Чампикс)';
    return (
      <Pressable onPress={() => router.push('/practice/pharma')}>
        <View style={{
          padding: 14, borderRadius: radius.lg,
          backgroundColor: t.warn + '14', borderWidth: 1, borderStyle: 'dashed', borderColor: t.warn + '60',
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: t.warn + '24', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.shield size={20} color={t.warn} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.warn, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
              {lang === 'ru' ? 'Препарат не активирован' : 'Medication not activated'}
            </Text>
            <Text style={{ color: t.text, fontSize: 14, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
              {lang === 'ru' ? `Метод требует: ${expected}` : `Method needs: ${expected}`}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
              {lang === 'ru' ? 'Тап → выбери препарат → стартует расписание' : 'Tap → pick med → schedule starts'}
            </Text>
          </View>
          <Text style={{ color: t.textDim, fontSize: 18 }}>›</Text>
        </View>
      </Pressable>
    );
  }
  if (!med) return null;
  const day = medCourseDay(state);
  const { schedule, takenCount } = todayDoses(state, lang);
  if (schedule.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const medColor = med === 'cytisine' ? '#30D158' : med === 'bupropion' ? '#FF9500' : '#0A84FF';
  const medName = med === 'cytisine' ? 'Цитизин (Табекс)'
    : med === 'bupropion' ? 'Бупропион'
    : 'Варениклин';

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  async function toggle(doseNumber: number) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => {
      const logs = s.doseLogs ?? [];
      const exists = logs.some((d) => d.date === today && d.doseNumber === doseNumber);
      return {
        ...s,
        doseLogs: exists
          ? logs.filter((d) => !(d.date === today && d.doseNumber === doseNumber))
          : [...logs, { date: today, doseNumber, takenAt: Date.now() }],
      };
    });
  }

  return (
    <Pressable onPress={() => router.push('/meds')}>
      <View style={{
        padding: 14, borderRadius: radius.lg,
        backgroundColor: medColor + '12', borderWidth: 1, borderColor: medColor + '30',
        gap: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={{
              width: 36, height: 36, borderRadius: 12, backgroundColor: medColor + '24',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon.shield size={20} color={medColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: medColor, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                {lang === 'ru' ? `Дневник приёма · день ${day}` : `Med diary · day ${day}`}
              </Text>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
                {medName}
              </Text>
            </View>
          </View>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '800' }}>
            {takenCount}/{schedule.length}
          </Text>
        </View>

        {/* Doses list */}
        <View style={{ gap: 6 }}>
          {schedule.map((d) => {
            const taken = isDoseTaken(state, today, d.doseNumber);
            const due = (d.hour * 60 + d.minute) <= nowMin;
            const isMissed = due && !taken;
            return (
              <Pressable key={d.doseNumber} onPress={(e) => { e.stopPropagation?.(); toggle(d.doseNumber); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10,
                  backgroundColor: taken ? medColor + '20' : (isMissed ? '#FF453A14' : 'transparent'),
                  borderWidth: 1, borderColor: taken ? medColor + '50' : (isMissed ? '#FF453A40' : t.border),
                }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                  borderColor: taken ? medColor : (isMissed ? '#FF453A' : t.border),
                  backgroundColor: taken ? medColor : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {taken && <Icon.check size={13} color="#fff" />}
                </View>
                <Text style={{
                  color: taken ? medColor : (isMissed ? '#FF453A' : t.text),
                  fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'],
                  width: 56,
                }}>
                  {String(d.hour).padStart(2, '0')}:{String(d.minute).padStart(2, '0')}
                </Text>
                <Text style={{ color: t.textDim, fontSize: 12, flex: 1 }} numberOfLines={1}>
                  {lang === 'ru' ? d.noteRu : d.noteEn}
                </Text>
                {isMissed && !taken && (
                  <Text style={{ color: '#FF453A', fontSize: 10, fontWeight: '800' }}>
                    {lang === 'ru' ? 'ПОРА' : 'DUE'}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
        <Text style={{ color: t.textDim, fontSize: 11, textAlign: 'center', marginTop: 2 }}>
          {lang === 'ru' ? 'Тап на карточку — открыть полный дневник' : 'Tap card — open full diary'}
        </Text>
      </View>
    </Pressable>
  );
}

function MethodCard({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  const lang = currentLang();
  const [state] = useAppState();
  const stepId = state.profile?.currentStep;
  if (!stepId) return null;
  const step = getStep(stepId);
  const sug = escalationSuggestion(state);
  return (
    <Pressable onPress={onPress}>
      <View style={{
        padding: 14, borderRadius: radius.lg,
        backgroundColor: step.color + '12', borderWidth: 1, borderColor: step.color + '30',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: step.color + '28', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: step.color, fontWeight: '800', fontSize: 16 }}>{step.index}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
              {lang === 'ru' ? `Метод · ступень ${step.index} из 5` : `Method · step ${step.index} of 5`}
            </Text>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
              {lang === 'ru' ? step.titleRu : step.titleEn}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
              {lang === 'ru' ? step.shortRu : step.shortEn}
            </Text>
          </View>
          <Text style={{ color: t.textDim, fontSize: 18 }}>›</Text>
        </View>
        {sug.yes && (
          <View style={{ marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: t.warn + '20', borderWidth: 1, borderColor: t.warn + '50' }}>
            <Text style={{ color: t.warn, fontSize: 12, fontWeight: '700' }}>
              {lang === 'ru' ? 'Метод не работает достаточно — поднимем сильнее →' : 'Method not enough — let’s step up →'}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function PressableMini({ onPress, color, label, title, sub, icon: I, progress }: { onPress: () => void; color: string; label: string; title: string; sub?: string; icon: any; progress: number }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <View style={{
        backgroundColor: t.bgElev, borderRadius: radius.lg, padding: 14,
        borderWidth: 1, borderColor: t.border, gap: 8, minHeight: 96,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{
            width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
            backgroundColor: color + '20',
          }}>
            <I size={16} color={color} />
          </View>
          <Text style={{ color: t.textDim, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
        </View>
        <Text style={{ color: t.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 }} numberOfLines={1}>{title}</Text>
        {sub ? (
          <Text style={{ color: t.textDim, fontSize: 12 }} numberOfLines={1}>{sub}</Text>
        ) : null}
        <View style={{ height: 3, backgroundColor: t.border, borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%`, height: '100%', backgroundColor: color }} />
        </View>
      </View>
    </Pressable>
  );
}

function ChipStat({ icon, value, label, color, mono }: { icon: any; value: string; label: string; color: string; mono?: boolean }) {
  const t = useTheme();
  return (
    <View style={{
      flex: 1, padding: 12, borderRadius: radius.md,
      backgroundColor: color + '14', borderWidth: 1, borderColor: color + '24',
      alignItems: 'flex-start', gap: 6,
    }}>
      {icon}
      <Text
        style={{
          color: t.text, fontSize: mono ? 14 : 16, fontWeight: '700', letterSpacing: -0.3,
          ...(mono ? { fontVariant: ['tabular-nums'] as any } : {}),
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >{value}</Text>
      <Text style={{ color: t.textDim, fontSize: 11 }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function QuickLink({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress}
      style={{ flex: 1, padding: 14, borderRadius: radius.md, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, alignItems: 'center', gap: 6 }}>
      {icon}
      <Text style={{ color: t.text, fontWeight: '600', fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

type Task = { ru: string; en: string; ctaRu: string; ctaEn: string; href: string };

const TASKS: Task[] = [
  { ru: 'Сделай 3 круга дыхания 4-4-4-4 — прямо сейчас.',
    en: 'Do 3 rounds of 4-4-4-4 breathing — right now.',
    ctaRu: 'Открыть дыхание', ctaEn: 'Open breathing', href: '/practice/box_breath' },
  { ru: 'Запиши тягу или триггер прямо сейчас — даже если ты удержался.',
    en: 'Log an urge or trigger right now — even if you held on.',
    ctaRu: 'Добавить запись', ctaEn: 'Add entry', href: '/journal?open=add' },
  { ru: 'Если предложат курить — что ты ответишь? Сформулируй.',
    en: 'If offered a cigarette — what will you say? Decide now.',
    ctaRu: 'Сделать if-then', ctaEn: 'Make if-then', href: '/practice/if_then' },
  { ru: 'Стакан воды + 4 минуты ожидания. Тяга пройдёт.',
    en: 'Glass of water + 4 minutes wait. Craving passes.',
    ctaRu: 'Прокатить волну', ctaEn: 'Surf the wave', href: '/practice/urge_surf' },
  { ru: 'Скажи одному близкому, что ты бросаешь.',
    en: 'Tell one close person you are quitting.',
    ctaRu: 'Контракт', ctaEn: 'Contract', href: '/goal' },
  { ru: '5 минут cyclic sighing — лучший дыхательный протокол.',
    en: '5 minutes of cyclic sighing — the strongest breathing protocol.',
    ctaRu: 'Начать практику', ctaEn: 'Start practice', href: '/practice/cyclic_sigh' },
  { ru: 'Поставь цель в копилке — на что потратишь сэкономленное.',
    en: 'Set a goal in the jar — what to spend the savings on.',
    ctaRu: 'Поставить цель', ctaEn: 'Set goal', href: '/goal' },
];

function DailyTaskCard({ quitDate, lang, onGo }: { quitDate: number; lang: 'ru' | 'en'; onGo: (href: string) => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const idx = Math.max(0, Math.floor((Date.now() - quitDate) / 86400_000) % TASKS.length);
  const task = TASKS[idx];
  return (
    <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon.toolbox size={16} color={t.accent} />
        <Text style={{ color: t.textDim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
          {tr('home.today_task')}
        </Text>
      </View>
      <Text style={{ color: t.text, fontSize: 16, lineHeight: 23 }}>
        {lang === 'ru' ? task.ru : task.en}
      </Text>
      <Pressable onPress={() => { Haptics.selectionAsync(); onGo(task.href); }}
        style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: t.accent, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{lang === 'ru' ? task.ctaRu : task.ctaEn}</Text>
        <Icon.arrowRight size={14} color="#fff" />
      </Pressable>
    </View>
  );
}
