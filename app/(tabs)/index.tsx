import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useTranslation, currentLang } from '../../lib/i18n';
import { useAppState, update } from '../../lib/storage';
import { secondsClean, nextMilestone, progressFor } from '../../lib/health';
import {
  moneySaved, cigsAvoided,
  formatMoneyLive, formatCigs, formatDuration,
} from '../../lib/money';
import { identityHeadline, plural, triggerLabel, relevantPlan } from '../../lib/identity';
import { Icon } from '../../components/Icon';
import { programToday } from '../../lib/program';
import { getStep, escalationSuggestion, prepChecklist } from '../../lib/stepped';
import { todayDoses, isDoseTaken, expectedMedForStep, MED_SAFETY } from '../../lib/medication';
import { newlyUnlocked, ACHIEVEMENTS, buildContext, achProgress, isAchUnlocked } from '../../lib/achievements';
import { AchievementUnlock } from '../../components/AchievementUnlock';
import { ARTICLES, ARTICLE_IMAGES, articleAspect } from '../../lib/articles';
import { localDateKey } from '../../lib/dates';

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [state] = useAppState();
  const [now, setNow] = useState(Date.now());
  const [unlockQueue, setUnlockQueue] = useState<string[]>([]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
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
  const lang = currentLang();
  const localeStr = lang === 'ru' ? 'ru-RU' : 'en-US';

  const days = Math.floor(secs / 86400);

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

        {/* Breathing drop */}
        <BreathingDrop secs={secs} lang={lang} />

        {/* Identity hero — the heart of the positioning. Evolves with days. */}
        <Text style={{
          color: t.text, fontSize: 18, fontWeight: '700', textAlign: 'center',
          lineHeight: 25, marginTop: 8, paddingHorizontal: 14, letterSpacing: -0.3,
        }}>
          {identityHeadline(secs, lang)}
        </Text>
        {/* Concrete wins — no card frame, just two stats with a color divider.
            Breaks the "everything looks like another bordered row" feel. */}
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
            <SquareCard
              color="#FF2D78" icon={<Icon.chart size={32} color="#FF2D78" />}
              title={lang === 'ru' ? 'Симптомы' : 'Symptoms'}
              onPress={() => router.push('/symptoms' as any)} />
          </View>
        </View>

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

        {/* Goal card (if set) — animated piggy bank progress */}
        <GoalCard />

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

// Knowledge — 3 rotating coping articles + link to the full list.
function KnowledgeSection() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const start = Math.floor(Date.now() / 86400_000) % ARTICLES.length;
  const featured = [0, 1, 2].map((i) => ARTICLES[(start + i) % ARTICLES.length]);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <Text style={{ color: t.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.4, marginLeft: 2 }}>
          {lang === 'ru' ? 'Знание' : 'Knowledge'}
        </Text>
        <Pressable onPress={() => router.push('/articles' as any)} hitSlop={8}>
          <Text style={{ color: t.accent, fontSize: 14, fontWeight: '700' }}>
            {lang === 'ru' ? 'Все' : 'All'}
          </Text>
        </Pressable>
      </View>
      {featured.map((a) => {
        const I = Icon[a.icon];
        const img = ARTICLE_IMAGES[a.id];
        return (
          <Pressable key={a.id} onPress={() => router.push(`/article/${a.id}` as any)}
            style={{
              backgroundColor: t.bgElev, borderWidth: 1, borderColor: t.border,
              borderRadius: radius.lg, overflow: 'hidden',
            }}>
            {/* Taller (210), no crop — matches the /articles list */}
            {img
              ? <Image source={img} style={{ width: '100%', height: 210 }} resizeMode="cover" />
              : <View style={{ width: '100%', height: 210, backgroundColor: a.color + '1A', alignItems: 'center', justifyContent: 'center' }}>
                  <I size={48} color={a.color} />
                </View>}
            <View style={{ padding: 14 }}>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }} numberOfLines={2}>
                {lang === 'ru' ? a.titleRu : a.titleEn}
              </Text>
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

function SectionLabel({ text }: { text: string }) {
  const t = useTheme();
  return (
    <Text style={{
      color: t.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.4,
      marginLeft: 2, marginTop: 12, marginBottom: 2,
    }}>
      {text}
    </Text>
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

// Identity ritual — the signature feature. A once-a-day affirmation of the
// new self. NEVER punishes: a missed day doesn't reset anything; we count
// unique affirmed days. Reinforces quitter-identity (the #1 success predictor).
function IdentityRitualCard() {
  const t = useTheme();
  const lang = currentLang();
  const [state] = useAppState();
  const log = state.identityLog ?? [];
  const today = localDateKey();
  const doneToday = log.includes(today);
  const count = new Set(log).size;
  const statement = state.profile?.identityStatement?.trim();

  async function affirm() {
    if (doneToday) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await update((s) => {
      const cur = s.identityLog ?? [];
      return cur.includes(today) ? s : { ...s, identityLog: [...cur, today] };
    });
  }

  return (
    <Pressable onPress={affirm} disabled={doneToday}>
      <View style={{
        padding: 16, borderRadius: radius.lg,
        backgroundColor: doneToday ? t.accentSoft : t.accent + '14',
        borderWidth: 1, borderColor: t.accent + (doneToday ? '55' : '40'),
        flexDirection: 'row', alignItems: 'center', gap: 14,
      }}>
        <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: t.accent + '24', alignItems: 'center', justifyContent: 'center' }}>
          <Icon.check size={26} color={t.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>
            {doneToday
              ? (lang === 'ru' ? 'Сегодня подтверждено' : 'Affirmed today')
              : (lang === 'ru' ? 'Скажи: «Я не курю»' : 'Say: "I don\'t smoke"')}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
            {statement
              ? (lang === 'ru' ? `Я становлюсь ${statement}` : `I'm becoming ${statement}`)
              : count > 0
                ? (lang === 'ru' ? `${count} ${plural(count, ['день', 'дня', 'дней'])} подтверждаю` : `${count} ${count === 1 ? 'day' : 'days'} affirmed`)
                : (lang === 'ru' ? 'Один тап в день — закрепи, кто ты' : 'One tap a day — anchor who you are')}
          </Text>
        </View>
        {!doneToday && <Text style={{ color: t.accent, fontSize: 22, fontWeight: '700' }}>→</Text>}
      </View>
    </Pressable>
  );
}

// If-then plan surfacing — shows the most relevant plan one tap away, or a
// CTA to build the first one. Matches by the user's most frequent recent trigger.
function IfThenCard() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const plans = state.ifThens ?? [];

  if (plans.length === 0) {
    return (
      <Pressable onPress={() => router.push('/plans' as any)}>
        <View style={{
          padding: 16, borderRadius: radius.lg,
          backgroundColor: t.card, borderWidth: 1, borderStyle: 'dashed', borderColor: t.accent + '60',
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.target size={22} color={t.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
              {lang === 'ru' ? 'Создай план «если — то»' : 'Build an if-then plan'}
            </Text>
            <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>
              {lang === 'ru' ? 'Готовый ответ на тягу — заранее' : 'A ready answer to cravings — in advance'}
            </Text>
          </View>
          <Text style={{ color: t.accent, fontSize: 18 }}>›</Text>
        </View>
      </Pressable>
    );
  }

  const plan = relevantPlan(plans, state.cravings)!;

  return (
    <Pressable onPress={() => router.push('/plans' as any)}>
      <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon.target size={16} color={t.accent} />
          <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>
            {lang === 'ru' ? 'Твой план' : 'Your plan'}{plan.category ? ` · ${triggerLabel(plan.category, lang)}` : ''}
          </Text>
          <Text style={{ color: t.textDim, fontSize: 18 }}>›</Text>
        </View>
        <Text style={{ color: t.text, fontSize: 14, lineHeight: 21 }}>
          <Text style={{ color: t.accent, fontWeight: '700' }}>{lang === 'ru' ? 'Если ' : 'If '}</Text>
          {plan.trigger}
          <Text style={{ color: t.warn, fontWeight: '700' }}>{lang === 'ru' ? ' → то ' : ' → then '}</Text>
          {plan.action}
        </Text>
      </View>
    </Pressable>
  );
}

// Active savings goal — surfaces /goal contents on home so the user
// actually sees the jar they set up.
function GoalCard() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const p = state.profile;
  if (!p?.goalAmount || !p.goalLabel) return null;
  const secs = secondsClean(p.quitDate);
  const saved = moneySaved(p, secs);
  const pct = Math.min(1, saved / p.goalAmount);
  const remaining = Math.max(0, p.goalAmount - saved);
  return (
    <Pressable onPress={() => router.push('/goal' as any)} style={({ pressed }) => ({ marginTop: 14, opacity: pressed ? 0.94 : 1 })}>
      <View style={{ borderRadius: radius.xl, overflow: 'hidden' }}>
        <LinearGradient colors={[t.accent + '20', t.accent + '06']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ padding: 18, borderRadius: radius.xl, borderWidth: 1, borderColor: t.accent + '30' }}>
          {/* Piggy bank + label */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF14', borderWidth: 1, borderColor: t.accent + '50', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {p.goalPhoto
                ? <Image source={{ uri: p.goalPhoto }} style={{ width: '100%', height: '100%' }} />
                : <Text style={{ fontSize: 36 }}>{p.goalEmoji ?? '🐷'}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                {lang === 'ru' ? 'Копим на' : 'Saving for'}
              </Text>
              <Text style={{ color: t.text, fontSize: 19, fontWeight: '800', marginTop: 3, letterSpacing: -0.3 }} numberOfLines={1}>
                {p.goalLabel}
              </Text>
              <Text style={{ color: t.textDim, fontSize: 12.5, marginTop: 3 }}>
                {remaining > 0
                  ? `${lang === 'ru' ? 'осталось' : 'left'} ${Math.round(remaining).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')} ${p.currency}`
                  : (lang === 'ru' ? 'Цель достигнута! 🎉' : 'Goal reached! 🎉')}
              </Text>
            </View>
          </View>
          {/* Progress bar with savings/total under it */}
          <View style={{ marginTop: 14, gap: 8 }}>
            <View style={{ height: 10, borderRadius: 10, backgroundColor: '#00000026', overflow: 'hidden' }}>
              <LinearGradient colors={[t.accent, '#5E5CE6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 10 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: t.text, fontSize: 13, fontWeight: '700' }}>
                {Math.round(saved).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')} {p.currency}
              </Text>
              <Text style={{ color: t.accent, fontSize: 13, fontWeight: '800' }}>
                {Math.round(pct * 100)}%
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

// Closest locked achievement — "something to look forward to".
function NearAchievement() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  const ctx = buildContext(state);
  const stored = state.achievements ?? {};

  const locked = ACHIEVEMENTS
    .filter((a) => !stored[a.id] && !isAchUnlocked(a, ctx))
    .map((a) => ({ a, prog: achProgress(a, ctx) }))
    .sort((x, y) => y.prog - x.prog);

  if (locked.length === 0) return null;
  const { a, prog } = locked[0];
  const I = Icon[a.icon];

  return (
    <Pressable onPress={() => router.push('/(tabs)/awards')}>
      <View style={{
        padding: 14, borderRadius: radius.lg,
        backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: a.color + '20', alignItems: 'center', justifyContent: 'center' }}>
          <I size={23} color={a.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.textDim, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
            {lang === 'ru' ? 'Скоро достижение' : 'Almost there'}
          </Text>
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
            {lang === 'ru' ? a.titleRu : a.titleEn}
          </Text>
          <View style={{ height: 5, borderRadius: 5, backgroundColor: t.border, overflow: 'hidden', marginTop: 6 }}>
            <View style={{ width: `${prog * 100}%`, height: '100%', backgroundColor: a.color }} />
          </View>
        </View>
        <Text style={{ color: t.textDim, fontSize: 18 }}>›</Text>
      </View>
    </Pressable>
  );
}

// Single prioritised "do this now" card.
function TodayFocus() {
  const t = useTheme();
  const router = useRouter();
  const lang = currentLang();
  const [state] = useAppState();
  if (!state.profile) return null;

  // No more daily "did you smoke today?" check-in — it was annoying.
  // Default action is always a 5-minute breathing practice.
  const action = {
    label: lang === 'ru' ? '5 минут дыхания' : '5 minutes of breathing',
    sub: lang === 'ru' ? 'Снизит тягу и стресс прямо сейчас' : 'Lowers craving and stress right now',
    href: '/practice/cyclic_sigh', color: t.info, icon: Icon.wind,
  };

  const I = action.icon;
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); router.push(action.href as any); }}>
      <View style={{
        padding: 16, borderRadius: radius.lg,
        backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
        flexDirection: 'row', alignItems: 'center', gap: 14,
      }}>
        <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: action.color + '20', alignItems: 'center', justifyContent: 'center' }}>
          <I size={26} color={action.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{action.label}</Text>
          <Text style={{ color: t.textDim, fontSize: 12, marginTop: 2 }}>{action.sub}</Text>
        </View>
        <Text style={{ color: t.textDim, fontSize: 20 }}>›</Text>
      </View>
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
