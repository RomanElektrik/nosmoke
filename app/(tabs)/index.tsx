import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { useAppState, update } from '../../lib/storage';
import { secondsClean } from '../../lib/health';
import { moneySaved, cigsAvoided, formatMoneyLive, formatCigs } from '../../lib/money';
import { identityHeadline, plural } from '../../lib/identity';
import { Icon } from '../../components/Icon';
import { programToday } from '../../lib/program';
import { getStep, escalationSuggestion, prepChecklist } from '../../lib/stepped';
import { todayDoses, isDoseTaken, expectedMedForStep, MED_SAFETY } from '../../lib/medication';
import { newlyUnlocked } from '../../lib/achievements';
import { relapseStatus } from '../../lib/relapse';
import { scheduleQuitProgram } from '../../lib/notifications';
import { AchievementUnlock } from '../../components/AchievementUnlock';
import { ARTICLES, ARTICLE_IMAGES } from '../../lib/articles';
import { usePremium, FREE_ARTICLE_COUNT } from '../../lib/subscription';

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [state] = useAppState();
  // Slow 60s tick. The whole Home used to re-render every SECOND, recomputing
  // programToday/escalation/relapse on each tick. The live counter and money
  // tick inside LiveHero with their own 1s timer; Home itself needs time only
  // to re-check the pending-method auto-activation below.
  const [now, setNow] = useState(Date.now());
  const [unlockQueue, setUnlockQueue] = useState<string[]>([]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Detect & persist newly unlocked achievements, queue them for celebration.
  useEffect(() => {
    const fresh = newlyUnlocked(state);
    if (fresh.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    update((s) => ({
      ...s,
      achievements: {
        ...(s.achievements ?? {}),
        ...Object.fromEntries(fresh.map((id) => [id, Date.now()])),
      },
    }));
    setUnlockQueue((q) => [...q, ...fresh.filter((id) => !q.includes(id))]);
  }, [state]);

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
            // quitDate intentionally NOT reset (same invariant as the immediate
            // branch in transition.tsx) — a scheduled method switch must never
            // wipe the streak the user accumulated while waiting.
            pendingMethod: undefined,
            pendingQuitDate: undefined,
          },
        }) : s);
      });
    }
  }, [state.profile?.pendingMethod, state.profile?.pendingQuitDate, now]);

  if (!state.profile) return null;
  const p = state.profile;
  const lang = currentLang();
  const localeStr = lang === 'ru' ? 'ru-RU' : 'en-US';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Atmosphere gradient */}
      <LinearGradient
        colors={[t.accentSoft, t.accentSoft, 'transparent']}
        locations={[0, 0.35, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420 }}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 14, paddingBottom: 150 }}>
        <Text style={{ color: t.textDim, fontSize: 13, textAlign: 'center', marginTop: 12 }}>
          {greeting(lang)}
        </Text>

        {/* Live ticking region (counter + money) — isolated with its own timer */}
        <LiveHero p={p} lang={lang} localeStr={localeStr} />

        {/* Primary navigation — 3 tiles in one row inside a shared container
            with dividers, so they read as a single block (not floating icons).
            «Путь» reachable from the Path tab below — no need to duplicate here. */}
        <View style={{ marginTop: 12, backgroundColor: t.bgElev, borderRadius: radius.xl, borderWidth: 1, borderColor: t.border, paddingVertical: 14, paddingHorizontal: 6, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row' }}>
            <SquareCard
              color={t.info} icon={<Icon.chat size={32} color={t.info} />}
              title={lang === 'ru' ? 'Помощник' : 'AI coach'}
              onPress={() => router.push('/chat?mode=support' as any)} />
            <SquareCard
              color={t.warn} icon={<Icon.toolbox size={32} color={t.warn} />}
              title={tr('tabs.techniques')}
              onPress={() => router.push('/(tabs)/techniques')} />
            {/* «Письмо себе» — капсула времени: пишется в сильный день,
                читается в слабый (SOS показывает её в момент тяги). */}
            <SquareCard
              color="#FFD60A" icon={<Icon.feather size={32} color="#FFD60A" />}
              title={lang === 'ru' ? 'Письмо себе' : 'My letter'}
              onPress={() => router.push('/letter' as any)} />
          </View>
        </View>

        {/* Relapse-aware: if smoking most days, gently offer an honest restart */}
        <RelapseCard />

        {/* Gentle, rare honesty check — our non-nagging "smoking or not" signal */}
        <StatusCheckCard />

        {/* One-time prompt: build a personal SOS toolkit of quick craving-busters */}
        {(p.copingMethods?.length ?? 0) === 0 && (
          <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/coping' as any); }}
            style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
            <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.info + '12', borderWidth: 1, borderColor: t.info + '40', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.info + '24', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.waves size={22} color={t.info} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>{lang === 'ru' ? 'Если потянет — что поможет?' : 'When the urge hits — what helps?'}</Text>
                <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 2, lineHeight: 17 }}>{lang === 'ru' ? 'Выбери быстрые приёмы — покажем их в SOS' : 'Pick quick moves — shown in SOS'}</Text>
              </View>
              <Text style={{ color: t.info, fontSize: 18 }}>›</Text>
            </View>
          </Pressable>
        )}

        {/* Goal/jar lives in the Progress tab now, not on home. */}

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

        <MethodCard />
        <MedicationCard />

        {/* Knowledge — coping articles */}
        <KnowledgeSection />
      </ScrollView>

      {unlockQueue.length > 0 && (
        <AchievementUnlock
          achId={unlockQueue[0]}
          onClose={() => setUnlockQueue((q) => q.slice(1))}
        />
      )}
    </SafeAreaView>
  );
}

function greeting(lang: 'ru' | 'en'): string {
  const h = new Date().getHours();
  if (lang === 'ru') {
    if (h < 6) return 'Доброй ночи';
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  }
  if (h < 6) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// ─── Breathing drop ───────────────────────────────────────────────────────────
// Layered radial glows + a central circle with a slow breathing pulse.
// `plural` is imported from lib/identity.ts (shared with identity copy).

// Headline number for the orb — the streak number that NEVER resets.
// Identity meaning lives in the line below the orb, not in the unit.
function dropHeadline(secs: number, lang: 'ru' | 'en'): { big: string; unit: string } {
  const days = Math.floor(secs / 86400);
  const hours = Math.floor(secs / 3600);
  const mins = Math.floor(secs / 60);
  if (days >= 1) {
    return { big: String(days), unit: lang === 'ru' ? plural(days, ['день', 'дня', 'дней']) : (days === 1 ? 'day' : 'days') };
  }
  if (hours >= 1) {
    return { big: String(hours), unit: lang === 'ru' ? plural(hours, ['час', 'часа', 'часов']) : (hours === 1 ? 'hour' : 'hours') };
  }
  if (mins >= 1) {
    return { big: String(mins), unit: lang === 'ru' ? plural(mins, ['минута', 'минуты', 'минут']) : (mins === 1 ? 'minute' : 'minutes') };
  }
  return { big: lang === 'ru' ? 'Старт' : 'Start', unit: lang === 'ru' ? 'ты начал' : 'you began' };
}

// The only part of Home that ticks every second: streak counter, identity
// headline and the two live stats. Keeping the timer here means the rest of
// Home (method/escalation/relapse cards) re-renders once a minute, not 60×.
function LiveHero({ p, lang, localeStr }: { p: NonNullable<ReturnType<typeof useAppState>[0]['profile']>; lang: 'ru' | 'en'; localeStr: string }) {
  const t = useTheme();
  const router = useRouter();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const secs = secondsClean(p.quitDate, now);
  return (
    <>
      <BreathingDrop secs={secs} lang={lang} />
      {/* Identity hero — the heart of the positioning. Evolves with days. */}
      <Text style={{
        color: t.text, fontSize: 18, fontWeight: '700', textAlign: 'center',
        lineHeight: 25, marginTop: 8, paddingHorizontal: 14, letterSpacing: -0.3,
      }}>
        {identityHeadline(secs, lang)}
      </Text>
      {/* Concrete wins — two stats with a colour divider. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 4 }}>
        <Pressable onPress={() => router.push('/goal' as any)} style={{ alignItems: 'center', flex: 1, paddingVertical: 8 }}>
          <Text style={{ color: t.accent, fontSize: 26, fontWeight: '900', letterSpacing: -0.6 }}>
            {formatMoneyLive(moneySaved(p, secs), p.currency, localeStr)}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 4, fontWeight: '600' }}>{lang === 'ru' ? 'сэкономлено' : 'saved'}</Text>
        </Pressable>
        <View style={{ width: 1, height: 36, backgroundColor: t.border }} />
        <Pressable onPress={() => router.push('/journal')} style={{ alignItems: 'center', flex: 1, paddingVertical: 8 }}>
          <Text style={{ color: t.warn, fontSize: 26, fontWeight: '900', letterSpacing: -0.6 }}>{formatCigs(cigsAvoided(p, secs))}</Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 4, fontWeight: '600' }}>{lang === 'ru' ? 'не выкурено' : 'avoided'}</Text>
        </Pressable>
      </View>
    </>
  );
}

function BreathingDrop({ secs, lang }: { secs: number; lang: 'ru' | 'en' }) {
  const t = useTheme();
  const scale = useSharedValue(1);
  const { big, unit } = dropHeadline(secs, lang);
  const isText = big === 'Старт' || big === 'Start';

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.05, { duration: 2750, easing: Easing.inOut(Easing.ease) }),
      -1, true,
    );
    return () => cancelAnimation(scale);
  }, []);

  const aCore = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={{ width: 248, height: 248, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 14 }}>
      {/* outer soft halo */}
      <View style={{
        position: 'absolute', width: 248, height: 248, borderRadius: 124,
        backgroundColor: t.accentSoft,
      }} />
      {/* large solid green core — the number sits fully inside it */}
      <Animated.View style={[{
        width: 188, height: 188, borderRadius: 94,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        shadowColor: t.accent, shadowOpacity: 0.5, shadowRadius: 26,
        shadowOffset: { width: 0, height: 14 }, elevation: 10,
      }, aCore]}>
        <LinearGradient
          colors={['#3BD168', '#1B9C52']}
          start={{ x: 0.2, y: 0 }} end={{ x: 0.85, y: 1 }}
          style={{ position: 'absolute', width: 188, height: 188 }}
        />
      </Animated.View>
      {/* centre headline */}
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{
          color: '#fff', fontWeight: isText ? '700' : '200',
          fontSize: isText ? 38 : 76, letterSpacing: isText ? -1 : -3,
          lineHeight: isText ? 44 : 80,
        }}>
          {big}
        </Text>
        <Text style={{
          color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 2,
          textTransform: 'uppercase', opacity: 0.9, marginTop: 4,
        }}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

// Knowledge — ALL articles inline as compact rows (no extra «Все» tap; the user
// just keeps scrolling). The free-tier article gate still applies.
function KnowledgeSection() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const premium = usePremium();
  const freeIds = new Set(ARTICLES.slice(0, FREE_ARTICLE_COUNT).map((a) => a.id));

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: t.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.4, marginLeft: 2, marginTop: 12 }}>
        {lang === 'ru' ? 'Знание' : 'Knowledge'}
      </Text>
      {ARTICLES.map((a) => {
        const I = Icon[a.icon];
        const img = ARTICLE_IMAGES[a.id];
        const locked = !premium && !freeIds.has(a.id);
        return (
          <Pressable key={a.id}
            onPress={() => router.push((locked ? '/paywall' : `/article/${a.id}`) as any)}
            style={({ pressed }) => ({
              backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border,
              borderRadius: radius.lg, overflow: 'hidden', opacity: pressed ? 0.9 : 1,
            })}>
            {img
              ? <Image source={img} style={{ width: '100%', height: 210 }} resizeMode="cover" />
              : <View style={{ width: '100%', height: 210, backgroundColor: a.color + '1A', alignItems: 'center', justifyContent: 'center' }}>
                  <I size={48} color={a.color} />
                </View>}
            <View style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: t.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3, flex: 1 }} numberOfLines={2}>
                  {lang === 'ru' ? a.titleRu : a.titleEn}
                </Text>
                {locked && <Icon.star size={15} color="#FFD60A" />}
              </View>
              <Text style={{ color: t.textDim, fontSize: 13, marginTop: 4, lineHeight: 19 }} numberOfLines={2}>
                {lang === 'ru' ? a.leadRu : a.leadEn}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}


// Square help card (2-up grid)
// Launcher item — circular icon shell + label. Lives inside a grouped 2×2
// container with dividers (see Home), so they read as one cohesive block.
function SquareCard({ icon, title, sub, color, onPress }: { icon: any; title: string; sub?: string; color?: string; onPress: () => void }) {
  const t = useTheme();
  const c = color ?? t.accent;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 10, paddingVertical: 14, opacity: pressed ? 0.6 : 1 })}>
      <View style={{
        width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center',
        backgroundColor: c + '1A', borderWidth: 1, borderColor: c + '33',
      }}>
        {icon}
      </View>
      <Text style={{ color: t.text, fontSize: 14, fontWeight: '700', textAlign: 'center' }} numberOfLines={1}>{title}</Text>
      {!!sub && <Text style={{ color: t.textDim, fontSize: 11, textAlign: 'center' }} numberOfLines={1}>{sub}</Text>}
    </Pressable>
  );
}

// Method / program card → leads to the Path tab.
function MethodCard() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const stepId = state.profile?.currentStep;
  if (!stepId) return null;
  // While a transition is scheduled, the pending banner above IS the plan.
  if (state.profile?.pendingMethod && (state.profile?.pendingQuitDate ?? 0) > Date.now()) {
    return null;
  }
  const step = getStep(stepId);
  const prog = programToday(state);
  const sug = escalationSuggestion(state);

  return (
    <Pressable onPress={() => router.push('/(tabs)/path')} style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}>
      <View style={{
        padding: 20, borderRadius: radius.xl,
        backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 14,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: step.color + '22', borderWidth: 1, borderColor: step.color + '50', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: step.color, fontWeight: '900', fontSize: 26, letterSpacing: -1 }}>{step.index}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: step.color, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
              {lang === 'ru' ? 'Твой путь' : 'Your path'}
            </Text>
            <Text style={{ color: t.text, fontSize: 19, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 }} numberOfLines={2}>
              {lang === 'ru' ? step.titleRu : step.titleEn}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 13, marginTop: 2 }}>
              {prog.data
                ? (lang === 'ru' ? `День ${prog.day} из ${prog.total}` : `Day ${prog.day} of ${prog.total}`)
                : (lang === 'ru' ? `Ступень ${step.index} из 5` : `Step ${step.index} of 5`)}
            </Text>
          </View>
          <Text style={{ color: t.textDim, fontSize: 22 }}>›</Text>
        </View>
        {prog.data && (
          <View style={{ height: 8, backgroundColor: t.border, borderRadius: 8, overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(100, (prog.total > 0 ? prog.day / prog.total : 0) * 100)}%`, height: '100%', backgroundColor: step.color, borderRadius: 8 }} />
          </View>
        )}
        {!!prog.data && (
          <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>
            {lang === 'ru' ? prog.data.focusRu : prog.data.focusEn}
          </Text>
        )}
        {/* Only nudge after a real pattern (≥2 slips/week), never after a single
            lapse — a slip is data, not a verdict. Neutral, non-judgmental copy. */}
        {sug.yes && sug.intensity !== 'soft' && (
          <Pressable onPress={() => router.push('/transition')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.border }}>
            <Icon.bolt size={16} color={t.warn} />
            <Text style={{ color: t.warn, fontSize: 13, fontWeight: '600', flex: 1 }}>
              {lang === 'ru' ? 'Несколько срывов на неделе — посмотрим, что усилить?' : 'A few slips this week — explore a stronger approach?'}
            </Text>
            <Text style={{ color: t.warn, fontSize: 14 }}>→</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

// Medication card — only when a medication course is active or expected.
function MedicationCard() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const stepId = state.profile?.currentStep;
  const med = state.profile?.medication;
  if (state.profile?.pendingMethod && (state.profile?.pendingQuitDate ?? 0) > Date.now()) {
    return null;
  }

  // No med activated, but the step expects one → activation CTA.
  if (!med) {
    const expectedMed = stepId ? expectedMedForStep(stepId) : null;
    if (!expectedMed) return null;
    const medName = lang === 'ru' ? MED_SAFETY[expectedMed].nameRu : MED_SAFETY[expectedMed].nameEn;
    return (
      <Pressable onPress={() => router.push({ pathname: '/med-gate', params: { med: expectedMed } } as any)}>
        <View style={{
          padding: 16, borderRadius: radius.lg,
          backgroundColor: t.card, borderWidth: 1, borderStyle: 'dashed', borderColor: t.info + '60',
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.info + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.shield size={22} color={t.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
              {lang === 'ru' ? `Начать приём: ${medName}` : `Start: ${medName}`}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
              {lang === 'ru' ? 'Препарат по плану — активируй расписание' : 'Medication is part of your plan'}
            </Text>
          </View>
          <Text style={{ color: t.info, fontSize: 18 }}>›</Text>
        </View>
      </Pressable>
    );
  }

  const medColor = med === 'cytisine' ? t.accent : med === 'bupropion' ? t.warn : t.info;
  const medName = med === 'cytisine' ? 'Цитизин' : med === 'bupropion' ? 'Бупропион' : 'Варениклин';

  async function stopMed() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await update((s) => ({
      ...s,
      profile: s.profile ? { ...s.profile, medication: undefined, medicationStartedAt: undefined } : s.profile,
    }));
  }

  // Path no longer involves this drug (e.g. switched to a behavioural step, or
  // a different medication). Don't silently keep showing "take your dose" for a
  // course that isn't part of the current path — offer a one-tap way to end it.
  const expectedNow = stepId ? expectedMedForStep(stepId) : null;
  if (med && expectedNow !== med) {
    return (
      <View style={{
        padding: 16, borderRadius: radius.lg,
        backgroundColor: t.card, borderWidth: 1, borderColor: medColor + '50', borderLeftWidth: 3, borderLeftColor: medColor, gap: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: medColor + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.shield size={22} color={medColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
              {lang === 'ru' ? `Ещё принимаешь ${medName}?` : `Still taking ${medName}?`}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2, lineHeight: 17 }}>
              {lang === 'ru' ? 'Твой путь сменился и больше не включает этот препарат.' : 'Your path changed and no longer includes this medication.'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable onPress={() => router.push('/meds')}
            style={({ pressed }) => ({ flex: 1, paddingVertical: 11, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 13.5 }}>{lang === 'ru' ? 'Продолжаю курс' : 'Continue course'}</Text>
          </Pressable>
          <Pressable onPress={stopMed}
            style={({ pressed }) => ({ flex: 1, paddingVertical: 11, borderRadius: radius.md, backgroundColor: medColor, alignItems: 'center', opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13.5 }}>{lang === 'ru' ? 'Я уже не принимаю' : 'I stopped'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Course not started yet (start date in the future) → courseDay <= 0 and
  // dosesForDay would fall through to the full default schedule. Hide instead.
  if (state.profile?.medicationStartedAt && state.profile.medicationStartedAt > Date.now()) return null;
  const medInfo = todayDoses(state, lang);
  if (medInfo.schedule.length === 0) return null;

  return (
    <Pressable onPress={() => router.push('/meds')}>
      <View style={{
        padding: 16, borderRadius: radius.lg,
        backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: medColor + '20', alignItems: 'center', justifyContent: 'center' }}>
          <Icon.shield size={22} color={medColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
            {lang === 'ru' ? `Приём · ${medName}` : `Doses · ${medName}`}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
            {lang === 'ru'
              ? `${medInfo.takenCount} из ${medInfo.schedule.length} принято сегодня`
              : `${medInfo.takenCount} of ${medInfo.schedule.length} taken today`}
          </Text>
        </View>
        <Text style={{ color: medColor, fontSize: 16, fontWeight: '800' }}>
          {medInfo.takenCount}/{medInfo.schedule.length}
        </Text>
      </View>
    </Pressable>
  );
}

// Relapse detector → honest fresh start. Shows ONLY when the user has smoked
// most of the last week. Never resets anything automatically; the user chooses.
function RelapseCard() {
  const t = useTheme();
  const lang = currentLang();
  const [state] = useAppState();
  const [dismissed, setDismissed] = useState(false);
  const p = state.profile;
  if (!p) return null;
  const rs = relapseStatus(state);
  if (!rs.activelySmoking || dismissed) return null;

  async function restart() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const now = Date.now();
    await update((s) => {
      if (!s.profile) return s;
      const prevSince = s.profile.stepEnteredAt ?? s.profile.quitDate ?? now;
      const slipsOnPrev = s.slips.filter((ts) => ts >= prevSince).length;
      const hist = s.profile.methodHistory ?? [];
      const archived = s.profile.currentStep
        ? [...hist, { stepId: s.profile.currentStep, startedAt: prevSince, endedAt: now, slips: slipsOnPrev, reason: 'restart' }]
        : hist;
      return { ...s, profile: { ...s.profile, quitDate: now, stepEnteredAt: now, methodHistory: archived, wantsToQuit: 'yes' as const } };
    });
    try { await scheduleQuitProgram(now, lang, p!.wakeHour ?? 8, p!.checkInHour ?? 21); } catch {}
  }

  return (
    <View style={{ padding: 18, borderRadius: radius.lg, backgroundColor: t.warn + '12', borderWidth: 1, borderColor: t.warn + '44', gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon.feather size={22} color={t.warn} />
        <Text style={{ color: t.text, fontSize: 16, fontWeight: '800', flex: 1 }}>
          {lang === 'ru' ? 'Похоже, ты снова куришь' : 'Looks like you\'re smoking again'}
        </Text>
      </View>
      <Text style={{ color: t.textDim, fontSize: 14, lineHeight: 21 }}>
        {lang === 'ru'
          ? 'И это часть пути, не провал — у большинства так бывает. Один срыв мы не считаем. Но если куришь почти каждый день, честный новый отсчёт мотивирует сильнее, чем счётчик, который врёт.'
          : "And that's part of the journey, not a failure — it happens to most. We don't count a single slip. But if you smoke most days, an honest fresh start motivates more than a counter that lies."}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable onPress={() => { Haptics.selectionAsync(); setDismissed(true); }}
          style={({ pressed }) => ({ flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
          <Text style={{ color: t.textDim, fontWeight: '700', fontSize: 13.5 }}>{lang === 'ru' ? 'Я держусь' : "I'm holding"}</Text>
        </Pressable>
        <Pressable onPress={restart}
          style={({ pressed }) => ({ flex: 1.3, paddingVertical: 12, borderRadius: radius.md, backgroundColor: t.warn, alignItems: 'center', opacity: pressed ? 0.85 : 1 })}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13.5 }}>{lang === 'ru' ? 'Начать заново с сегодня' : 'Restart from today'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Gentle, low-frequency "how are you really" check — our only honest signal of
// whether someone has quietly started smoking again, WITHOUT nagging daily
// pushes. Appears in-app at most once every 3 days, on a natural app open.
function StatusCheckCard() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const p = state.profile;
  if (!p) return null;
  const now = Date.now();
  const DAY = 86400_000;
  const daysSince = Math.floor((now - p.quitDate) / DAY);
  const lastAsked = p.lastStatusCheckAt ?? p.quitDate;
  // Don't ask in the first 2 days, not more than once per 3 days, and not when
  // we already know they're actively smoking (the RelapseCard handles that).
  if (daysSince < 2 || now - lastAsked < 3 * DAY || relapseStatus(state).activelySmoking) return null;

  async function holding() {
    Haptics.selectionAsync();
    await update((s) => ({ ...s, profile: s.profile ? { ...s.profile, lastStatusCheckAt: now } : s.profile }));
  }
  async function smoked() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await update((s) => ({
      ...s,
      slips: [...s.slips, now],
      cravings: [...s.cravings, { ts: now, intensity: 7, outcome: 'smoked' as const }],
      profile: s.profile ? { ...s.profile, lastStatusCheckAt: now } : s.profile,
    }));
    router.push('/slip');
  }

  return (
    <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border, gap: 12 }}>
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '800' }}>
        {lang === 'ru' ? 'Как ты сейчас, честно?' : 'How are you, honestly?'}
      </Text>
      <Text style={{ color: t.textDim, fontSize: 13, lineHeight: 19 }}>
        {lang === 'ru' ? 'Спрашиваю редко — но честный ответ помогает мне быть полезнее. Никакого осуждения.' : 'I ask rarely — an honest answer helps me help you. No judgment.'}
      </Text>
      {/* No emoji in the button labels — 💪 broke vertical alignment on some
          devices and read as «криво написанный текст» */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable onPress={holding}
          style={({ pressed }) => ({ flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}>
          <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '800', fontSize: 14.5 }}>{lang === 'ru' ? 'Держусь' : 'Holding'}</Text>
        </Pressable>
        <Pressable onPress={smoked}
          style={({ pressed }) => ({ flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
          <Text numberOfLines={1} style={{ color: t.textDim, fontWeight: '700', fontSize: 14.5 }}>{lang === 'ru' ? 'Закурил' : 'I smoked'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
